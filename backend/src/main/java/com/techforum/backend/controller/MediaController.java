package com.techforum.backend.controller;

import com.techforum.backend.util.MinioUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.BufferedInputStream;
import java.io.InputStream;

@RestController
@RequestMapping("/api/media")
public class MediaController {

    @Autowired
    private MinioUtil minioUtil;

    @GetMapping("/avatar/{fileName}")
    public ResponseEntity<byte[]> getAvatar(@PathVariable String fileName) {
        try {
            InputStream inputStream = minioUtil.getFile(fileName);
            BufferedInputStream bufferedInputStream = new BufferedInputStream(inputStream);
            byte[] data = bufferedInputStream.readAllBytes();
            bufferedInputStream.close();

            String contentType = guessContentType(fileName);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.setCacheControl("public, max-age=31536000");

            return new ResponseEntity<>(data, headers, HttpStatus.OK);
        } catch (Exception e) {
            System.err.println("获取头像失败: " + e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    private String guessContentType(String fileName) {
        if (fileName.endsWith(".png")) {
            return "image/png";
        } else if (fileName.endsWith(".gif")) {
            return "image/gif";
        } else if (fileName.endsWith(".webp")) {
            return "image/webp";
        } else {
            return "image/jpeg";
        }
    }
}
