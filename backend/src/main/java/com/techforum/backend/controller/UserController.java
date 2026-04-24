package com.techforum.backend.controller;

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

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        // 检查邮箱是否已存在
        Optional<User> existingUser = userService.findByEmail(request.getEmail());
        if (existingUser.isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }

        // 创建新用户
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword())); // 密码加密

        User savedUser = userService.save(user);
        String token = jwtUtil.generateToken(savedUser.getId(), savedUser.getUsername());

        return ResponseEntity.ok(new AuthResponse(token, savedUser));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        // 查找用户
        Optional<User> userOptional = userService.findByEmail(request.getEmail());
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            // 检查密码
            if (passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                String token = jwtUtil.generateToken(user.getId(), user.getUsername());
                return ResponseEntity.ok(new AuthResponse(token, user));
            }
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    @GetMapping("/{id}")
    public Optional<User> getUserById(@PathVariable Long id) {
        return userService.findById(id);
    }

    @PostMapping("/{id}/avatar")
    public ResponseEntity<Map<String, String>> uploadAvatar(@PathVariable Long id, @RequestParam("file") MultipartFile file) throws Exception {
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
}
