package com.techforum.backend.controller;

import com.techforum.backend.service.CaptchaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/captcha")
public class CaptchaController {

    @Autowired
    private CaptchaService captchaService;

    @GetMapping("/slider")
    public ResponseEntity<Map<String, Object>> generateSliderCaptcha() {
        Map<String, Object> captcha = captchaService.generateCaptcha();
        return ResponseEntity.ok(captcha);
    }

    @PostMapping("/slider/validate")
    public ResponseEntity<Map<String, Object>> validateSliderCaptcha(
            @RequestBody Map<String, String> request) {
        String token = request.get("token");
        int userPosition = Integer.parseInt(request.get("position"));
        
        boolean isValid = captchaService.validateCaptcha(token, userPosition);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", isValid);
        response.put("message", isValid ? "验证成功" : "验证失败，请重试");
        
        return ResponseEntity.ok(response);
    }
}
