package com.techforum.backend.service;

import com.techforum.backend.util.RedisUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class CaptchaService {

    @Autowired
    private RedisUtil redisUtil;

    private static final String CAPTCHA_PREFIX = "captcha:";
    private static final String FAILED_ATTEMPTS_PREFIX = "login_failed:";
    private static final int MAX_FAILED_ATTEMPTS = 3;
    private static final long CAPTCHA_EXPIRE_SECONDS = 300;
    private static final long LOCKOUT_EXPIRE_SECONDS = 300;

    public Map<String, Object> generateCaptcha() {
        String token = UUID.randomUUID().toString();
        
        int backgroundWidth = 320;
        int backgroundHeight = 160;
        int sliderWidth = 60;
        int sliderHeight = 60;
        
        int targetPosition = ThreadLocalRandom.current().nextInt(100, backgroundWidth - sliderWidth - 20);
        
        Map<String, Object> captchaData = new HashMap<>();
        captchaData.put("token", token);
        captchaData.put("backgroundWidth", backgroundWidth);
        captchaData.put("backgroundHeight", backgroundHeight);
        captchaData.put("sliderWidth", sliderWidth);
        captchaData.put("sliderHeight", sliderHeight);
        captchaData.put("targetPosition", targetPosition);
        
        Map<String, Object> storedData = new HashMap<>();
        storedData.put("targetPosition", targetPosition);
        storedData.put("validated", false);
        
        redisUtil.set(CAPTCHA_PREFIX + token, storedData, CAPTCHA_EXPIRE_SECONDS);
        
        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("backgroundWidth", backgroundWidth);
        response.put("backgroundHeight", backgroundHeight);
        response.put("sliderWidth", sliderWidth);
        response.put("sliderHeight", sliderHeight);
        response.put("targetPosition", targetPosition);
        
        return response;
    }

    public boolean validateCaptcha(String token, int userPosition) {
        String key = CAPTCHA_PREFIX + token;
        Object dataObj = redisUtil.get(key);
        
        if (dataObj == null) {
            return false;
        }
        
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) dataObj;
        int targetPosition = (Integer) data.get("targetPosition");
        boolean alreadyValidated = (Boolean) data.get("validated");
        
        if (alreadyValidated) {
            return true;
        }
        
        int tolerance = 15;
        boolean isCorrect = Math.abs(userPosition - targetPosition) <= tolerance;
        
        if (isCorrect) {
            data.put("validated", true);
            redisUtil.set(key, data, CAPTCHA_EXPIRE_SECONDS);
        }
        
        return isCorrect;
    }

    public boolean isCaptchaRequired(String email) {
        String key = FAILED_ATTEMPTS_PREFIX + email;
        Object attemptsObj = redisUtil.get(key);
        
        if (attemptsObj == null) {
            return false;
        }
        
        int attempts = (Integer) attemptsObj;
        return attempts >= MAX_FAILED_ATTEMPTS;
    }

    public void recordFailedAttempt(String email) {
        String key = FAILED_ATTEMPTS_PREFIX + email;
        Object attemptsObj = redisUtil.get(key);
        
        int attempts = attemptsObj == null ? 0 : (Integer) attemptsObj;
        attempts++;
        
        redisUtil.set(key, attempts, LOCKOUT_EXPIRE_SECONDS);
    }

    public void resetFailedAttempts(String email) {
        String key = FAILED_ATTEMPTS_PREFIX + email;
        redisUtil.delete(key);
    }

    public int getFailedAttempts(String email) {
        String key = FAILED_ATTEMPTS_PREFIX + email;
        Object attemptsObj = redisUtil.get(key);
        return attemptsObj == null ? 0 : (Integer) attemptsObj;
    }
}
