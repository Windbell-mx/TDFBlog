package com.techforum.backend.controller;

import com.techforum.backend.dto.UserResponse;
import com.techforum.backend.model.AuthResponse;
import com.techforum.backend.model.DeleteAccountRequest;
import com.techforum.backend.model.ForgotPasswordRequest;
import com.techforum.backend.model.LoginRequest;
import com.techforum.backend.model.RegisterRequest;
import com.techforum.backend.model.ResetPasswordRequest;
import com.techforum.backend.model.User;
import com.techforum.backend.service.CaptchaService;
import com.techforum.backend.service.EmailService;
import com.techforum.backend.service.UserService;
import com.techforum.backend.util.JwtUtil;
import com.techforum.backend.util.MinioUtil;
import com.techforum.backend.util.RedisUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {
    @Autowired
    private UserService userService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private MinioUtil minioUtil;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private RedisUtil redisUtil;

    @Autowired
    private CaptchaService captchaService;

    @Value("${app.security.cors.allowed-origin-patterns:http://localhost:*,https://localhost:*}")
    private String mediaBaseUrl;

    private static final String USER_CACHE_KEY = "user:";
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    private UserResponse convertToUserResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setUsername(user.getNickname());
        response.setNickname(user.getNickname());
        response.setEmail(user.getEmail());
        response.setAvatar(user.getAvatar() != null ? "/api/media/avatar/" + user.getAvatar() : null);
        response.setGender(user.getGender());
        response.setBio(user.getBio());
        response.setCreatedAt(user.getCreatedAt() != null ? user.getCreatedAt().format(FORMATTER) : null);
        response.setUpdatedAt(user.getUpdatedAt() != null ? user.getUpdatedAt().format(FORMATTER) : null);
        return response;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        Optional<User> existingUser = userService.findByEmail(request.getEmail());
        if (existingUser.isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }

        User user = new User();
        user.setId(JwtUtil.generateEmailHash(request.getEmail()));
        user.setEmail(request.getEmail());
        user.setNickname(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        User savedUser = userService.save(user);
        String token = jwtUtil.generateToken(savedUser.getId(), savedUser.getEmail());

        return ResponseEntity.ok(new AuthResponse(token, convertToUserResponse(savedUser)));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        String email = request.getEmail();
        String captchaToken = request.getCaptchaToken();
        boolean hasCaptchaToken = captchaToken != null && !captchaToken.isEmpty();
        
        boolean isCaptchaRequired = captchaService.isCaptchaRequired(email);
        
        if (isCaptchaRequired && !hasCaptchaToken) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "登录失败次数过多，请完成人机验证");
            error.put("captchaRequired", true);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        if (hasCaptchaToken) {
            boolean isCaptchaValid = captchaService.validateCaptcha(captchaToken, 0);
            if (!isCaptchaValid) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "验证码无效，请重新验证");
                error.put("captchaRequired", true);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }
            captchaService.resetFailedAttempts(email);
        }

        Optional<User> userOptional = userService.findByEmail(email);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            if (passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                captchaService.resetFailedAttempts(email);
                String token = jwtUtil.generateToken(user.getId(), user.getEmail());
                return ResponseEntity.ok(new AuthResponse(token, convertToUserResponse(user)));
            } else {
                captchaService.recordFailedAttempt(email);
                int failedAttempts = captchaService.getFailedAttempts(email);
                
                Map<String, Object> error = new HashMap<>();
                error.put("error", "密码错误");
                error.put("remainingAttempts", Math.max(0, 3 - failedAttempts));
                
                if (failedAttempts >= 3) {
                    error.put("captchaRequired", true);
                    error.put("error", "登录失败次数过多，请完成人机验证");
                }
                
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }
        }

        captchaService.recordFailedAttempt(email);
        int failedAttempts = captchaService.getFailedAttempts(email);
        
        Map<String, Object> error = new HashMap<>();
        error.put("error", "用户不存在");
        error.put("remainingAttempts", Math.max(0, 3 - failedAttempts));
        
        if (failedAttempts >= 3) {
            error.put("captchaRequired", true);
            error.put("error", "登录失败次数过多，请完成人机验证");
        }
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable String id) {
        Optional<User> userOptional = userService.findById(id);
        if (userOptional.isPresent()) {
            return ResponseEntity.ok(convertToUserResponse(userOptional.get()));
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/avatar")
    public ResponseEntity<Map<String, String>> uploadAvatar(@PathVariable String id, @RequestParam("file") MultipartFile file) {
        try {
            Optional<User> userOptional = userService.findById(id);
            if (userOptional.isPresent()) {
                User user = userOptional.get();

                String oldAvatar = user.getAvatar();
                if (oldAvatar != null && !oldAvatar.isEmpty()) {
                    minioUtil.deleteFile(oldAvatar);
                }

                String fileName = minioUtil.uploadFile(file);
                user.setAvatar(fileName);
                userService.save(user);

                try {
                    redisUtil.delete(USER_CACHE_KEY + id);
                    redisUtil.delete(USER_CACHE_KEY + user.getEmail());
                } catch (Exception e) {
                    System.err.println("Redis缓存清除失败: " + e.getMessage());
                }

                Map<String, String> response = new HashMap<>();
                response.put("avatar", "/api/media/avatar/" + fileName);
                return ResponseEntity.ok(response);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            System.err.println("头像上传失败: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "头像上传失败，请稍后重试");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(@PathVariable String id, @RequestBody Map<String, String> updates) {
        Optional<User> userOptional = userService.findById(id);
        if (userOptional.isPresent()) {
            User user = userOptional.get();

            if (updates.containsKey("nickname")) {
                user.setNickname(updates.get("nickname"));
            }
            if (updates.containsKey("gender")) {
                user.setGender(updates.get("gender"));
            }
            if (updates.containsKey("bio")) {
                user.setBio(updates.get("bio"));
            }

            User updatedUser = userService.save(user);

            try {
                redisUtil.delete(USER_CACHE_KEY + id);
                redisUtil.delete(USER_CACHE_KEY + updatedUser.getEmail());
            } catch (Exception e) {
                System.err.println("Redis缓存清除失败: " + e.getMessage());
            }

            return ResponseEntity.ok(convertToUserResponse(updatedUser));
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable String id) {
        Optional<User> userOptional = userService.findById(id);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            if (user.getAvatar() != null) {
                minioUtil.deleteFile(user.getAvatar());
            }
            userService.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        Optional<User> userOptional = userService.findByEmail(request.getEmail());
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            String resetToken = UUID.randomUUID().toString();
            user.setResetToken(resetToken);
            user.setResetTokenExpiry(LocalDateTime.now().plusHours(1));
            userService.save(user);

            try {
                emailService.sendPasswordResetEmail(user.getEmail(), resetToken);
                return ResponseEntity.ok("密码重置链接已发送到您的邮箱，请查收");
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("邮件发送失败，请稍后重试");
            }
        }

        return ResponseEntity.ok("如果该邮箱已注册，密码重置链接已发送到您的邮箱");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody ResetPasswordRequest request) {
        Optional<User> userOptional = userService.findByResetToken(request.getToken());
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            if (user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("重置链接已过期");
            }

            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
            user.setResetToken(null);
            user.setResetTokenExpiry(null);
            userService.save(user);

            return ResponseEntity.ok("密码重置成功");
        }

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("无效的重置链接");
    }

    @PostMapping("/delete-account")
    public ResponseEntity<Map<String, Object>> deleteAccount(@RequestBody DeleteAccountRequest request) {
        Map<String, Object> response = new HashMap<>();
        
        Optional<User> userOptional = userService.findById(request.getUserId());
        if (!userOptional.isPresent()) {
            response.put("success", false);
            response.put("message", "用户不存在");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
        
        User user = userOptional.get();
        
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            response.put("success", false);
            response.put("message", "密码错误");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
        
        try {
            userService.deleteAccount(request.getUserId());
            
            response.put("success", true);
            response.put("message", "账户已成功注销");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("注销账户失败: " + e.getMessage());
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "注销失败，请稍后重试");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
