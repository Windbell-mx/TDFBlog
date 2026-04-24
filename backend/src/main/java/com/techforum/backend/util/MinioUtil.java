package com.techforum.backend.util;

import io.minio.MinioClient;
import io.minio.PutObjectArgs;
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

    @Value("${minio.bucketName}")
    private String bucketName;

    @Value("${minio.url}")
    private String minioUrl;

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

        return minioUrl + "/" + bucketName + "/" + fileName;
    }
}