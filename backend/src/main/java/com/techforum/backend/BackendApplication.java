package com.techforum.backend;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BackendApplication {
    public static void main(String[] args) {
        // 加载 .env 文件
        try {
            Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
            dotenv.entries().forEach(entry -> {
                System.setProperty(entry.getKey(), entry.getValue());
            });
            System.out.println("成功加载 .env 配置文件！");
        } catch (Exception e) {
            System.out.println("未找到 .env 文件，使用默认配置。");
        }
        
        SpringApplication.run(BackendApplication.class, args);
        System.out.println("后端已启动成功！");
    }
}