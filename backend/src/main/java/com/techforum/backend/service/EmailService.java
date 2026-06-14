package com.techforum.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${frontend.url}")
    private String frontendUrl;

    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("【科技研讨吧】密码重置邮件");

            String resetLink = frontendUrl + "/reset-password?token=" + resetToken;

            String htmlContent = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;'>"
                    + "<h2 style='color: #667eea; text-align: center;'>科技研讨吧 - 密码重置</h2>"
                    + "<p>您好，</p>"
                    + "<p>我们收到了您的密码重置请求。请点击下面的按钮重置您的密码：</p>"
                    + "<div style='text-align: center; margin: 30px 0;'>"
                    + "<a href='" + resetLink + "' style='background-color: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px;'>重置密码</a>"
                    + "</div>"
                    + "<p>或者复制以下链接到浏览器打开：</p>"
                    + "<p style='word-break: break-all; color: #667eea;'>" + resetLink + "</p>"
                    + "<p style='color: #888; font-size: 12px;'>此链接有效期为1小时，如果这不是您本人操作，请忽略此邮件。</p>"
                    + "<hr style='border: none; border-top: 1px solid #eee; margin: 20px 0;'>"
                    + "<p style='color: #888; font-size: 12px; text-align: center;'>© 2026 科技研讨吧 版权所有</p>"
                    + "</div>";

            helper.setText(htmlContent, true);

            mailSender.send(message);
            System.out.println("密码重置邮件已发送至: " + toEmail);
        } catch (Exception e) {
            System.err.println("发送邮件失败: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("发送邮件失败: " + e.getMessage());
        }
    }
}