package com.techforum.backend.controller;

import com.techforum.backend.dto.UserResponse;
import com.techforum.backend.model.AuthResponse;
import com.techforum.backend.model.ForgotPasswordRequest;
import com.techforum.backend.model.LoginRequest;
import com.techforum.backend.model.RegisterRequest;
import com.techforum.backend.model.ResetPasswordRequest;
import com.techforum.backend.model.User;
import com.techforum.backend.service.EmailService;
import com.techforum.backend.service.UserService;
import com.techforum.backend.util.JwtUtil;
import com.techforum.backend.util.MinioUtil;
import org.springframework.beans.factory.annotation.Autowired;
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

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    private UserResponse convertToUserResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setUsername(user.getNickname());
        response.setNickname(user.getNickname());
        response.setEmail(user.getEmail());
        response.setAvatar(user.getAvatar());
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
        user.setEmail(request.getEmail());
        user.setNickname(request.getUsername()); // 使用username作为nickname
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        User savedUser = userService.save(user);
        String token = jwtUtil.generateToken(savedUser.getId(), savedUser.getEmail()); // 使用email作为token的subject

        return ResponseEntity.ok(new AuthResponse(token, convertToUserResponse(savedUser)));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        Optional<User> userOptional = userService.findByEmail(request.getEmail());
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            if (passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                String token = jwtUtil.generateToken(user.getId(), user.getEmail()); // 使用email作为token的subject
                return ResponseEntity.ok(new AuthResponse(token, convertToUserResponse(user)));
            }
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        Optional<User> userOptional = userService.findById(id);
        if (userOptional.isPresent()) {
            return ResponseEntity.ok(convertToUserResponse(userOptional.get()));
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/avatar")
    public ResponseEntity<Map<String, String>> uploadAvatar(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        try {
            Optional<User> userOptional = userService.findById(id);
            if (userOptional.isPresent()) {
                User user = userOptional.get();
                String avatarUrl = minioUtil.uploadFile(file);
                user.setAvatar(avatarUrl);
                userService.save(user);
                Map<String, String> response = new HashMap<>();
                response.put("avatar", avatarUrl);
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

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        Optional<User> userOptional = userService.findById(id);
        if (userOptional.isPresent()) {
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
                System.err.println("邮件发送失败: " + e.getMessage());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("邮件发送失败，请稍后重试或联系管理员");
            }
        }
        return ResponseEntity.ok("如果邮箱存在，重置链接已发送");
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

    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> updates) {
        Optional<User> userOptional = userService.findById(id);
        if (userOptional.isPresent()) {
            User user = userOptional.get();

            if (updates.containsKey("nickname")) {
                user.setNickname((String) updates.get("nickname"));
            }
            if (updates.containsKey("gender")) {
                user.setGender((String) updates.get("gender"));
            }
            if (updates.containsKey("bio")) {
                user.setBio((String) updates.get("bio"));
            }

            User updatedUser = userService.save(user);
            return ResponseEntity.ok(convertToUserResponse(updatedUser));
        }
        return ResponseEntity.notFound().build();
    }
}