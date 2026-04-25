package com.techforum.backend.dto;

public class UserResponse {
    private Long id;
    private String username;
    private String nickname;
    private String email;
    private String avatar;
    private String gender;
    private String bio;
    private String createdAt;
    private String updatedAt;

    public UserResponse() {
    }

    public UserResponse(Long id, String username, String nickname, String email,
                       String avatar, String gender, String bio, String createdAt, String updatedAt) {
        this.id = id;
        this.username = username;
        this.nickname = nickname;
        this.email = email;
        this.avatar = avatar;
        this.gender = gender;
        this.bio = bio;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }
}