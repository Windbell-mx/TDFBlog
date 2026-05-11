package com.techforum.backend.config;

import io.minio.MinioClient;
import io.minio.errors.MinioException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;

@Configuration
public class MinioConfig {
    @Value("${minio.internalUrl}")
    private String internalUrl;

    @Value("${minio.accessKey}")
    private String accessKey;

    @Value("${minio.secretKey}")
    private String secretKey;

    @Bean
    public MinioClient minioClient() {
        MinioClient client = MinioClient.builder()
                .endpoint(internalUrl)
                .credentials(accessKey, secretKey)
                .connectTimeout(3000)
                .writeTimeout(60000)
                .readTimeout(60000)
                .build();

        try {
            client.listBuckets();
            System.out.println("Minio连接成功: " + internalUrl);
        } catch (MinioException | IOException | InvalidKeyException | NoSuchAlgorithmException e) {
            System.err.println("Minio连接失败: " + e.getMessage());
            System.err.println("注意: Minio服务不可用，头像上传功能将不可用");
        }

        return client;
    }
}
