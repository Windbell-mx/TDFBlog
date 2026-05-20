package com.techforum.backend.util;

import io.minio.GetObjectArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.UUID;

@Component
public class MinioUtil {
    @Autowired
    private MinioClient minioClient;

    @Value("${minio.publicUrl}")
    private String publicUrl;

    @Value("${minio.bucketName}")
    private String bucketName;

    public String uploadFile(MultipartFile file) throws Exception {
        String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();

        try (InputStream inputStream = file.getInputStream()) {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(fileName)
                            .stream(inputStream, file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build()
            );
        }

        return fileName;
    }

    public void deleteFile(String fileName) {
        if (fileName == null || fileName.isEmpty()) {
            return;
        }

        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(bucketName)
                            .object(fileName)
                            .build()
            );
            System.out.println("Minio旧文件已删除: " + fileName);
        } catch (Exception e) {
            System.err.println("删除Minio文件失败: " + e.getMessage());
        }
    }

    public InputStream getFile(String fileName) throws Exception {
        return minioClient.getObject(
                GetObjectArgs.builder()
                        .bucket(bucketName)
                        .object(fileName)
                        .build()
        );
    }

    public String getBucketName() {
        return bucketName;
    }
}
