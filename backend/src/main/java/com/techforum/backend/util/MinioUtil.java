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
import java.time.LocalDate;
import java.util.UUID;

@Component
public class MinioUtil {
    @Autowired
    private MinioClient minioClient;

    @Value("${minio.url}")
    private String url;

    @Value("${minio.accessUrl}")
    private String accessUrl;

    @Value("${minio.bucketName}")
    private String bucketName;

    public String uploadFile(MultipartFile file) throws Exception {
        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(originalFilename);
        LocalDate now = LocalDate.now();
        String objectName = String.format("uploads/%d/%02d/%s.%s",
                now.getYear(),
                now.getMonthValue(),
                UUID.randomUUID().toString().replace("-", ""),
                extension);

        try (InputStream inputStream = file.getInputStream()) {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .stream(inputStream, file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build()
            );
        }

        return accessUrl + "/" + objectName;
    }

    public void deleteFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isEmpty()) {
            return;
        }

        String objectName = extractObjectName(fileUrl);
        if (objectName == null) {
            return;
        }

        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .build()
            );
            System.out.println("Minio旧文件已删除: " + objectName);
        } catch (Exception e) {
            System.err.println("删除Minio文件失败: " + e.getMessage());
        }
    }

    public InputStream getFile(String objectName) throws Exception {
        return minioClient.getObject(
                GetObjectArgs.builder()
                        .bucket(bucketName)
                        .object(objectName)
                        .build()
        );
    }

    public String getBucketName() {
        return bucketName;
    }

    private String getFileExtension(String filename) {
        if (filename == null || filename.isEmpty()) {
            return "jpg";
        }
        int lastDot = filename.lastIndexOf('.');
        if (lastDot > 0) {
            return filename.substring(lastDot + 1).toLowerCase();
        }
        return "jpg";
    }

    private String extractObjectName(String fileUrl) {
        if (fileUrl == null || fileUrl.isEmpty()) {
            return null;
        }
        if (fileUrl.startsWith(accessUrl)) {
            return fileUrl.substring(accessUrl.length() + 1);
        }
        if (fileUrl.startsWith(url)) {
            return fileUrl.substring(url.length() + 1);
        }
        if (fileUrl.startsWith("/")) {
            return fileUrl.substring(1);
        }
        return fileUrl;
    }
}
