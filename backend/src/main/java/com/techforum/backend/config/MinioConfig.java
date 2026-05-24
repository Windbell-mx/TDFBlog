package com.techforum.backend.config;

import io.minio.MinioClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MinioConfig {
    @Value("${minio.url}")
    private String url;

    @Value("${minio.accessKey}")
    private String accessKey;

    @Value("${minio.secretKey}")
    private String secretKey;

    @Bean
    public MinioClient minioClient() {
        MinioClient client = MinioClient.builder()
                .endpoint(url)
                .credentials(accessKey, secretKey)
                .build();

        try {
            client.listBuckets();
            System.out.println("Minio连接成功: " + url);
        } catch (Exception e) {
            System.err.println("Minio连接失败: " + e.getMessage());
            System.err.println("注意: Minio服务不可用，头像上传功能将不可用");
        }

        return client;
    }
}
