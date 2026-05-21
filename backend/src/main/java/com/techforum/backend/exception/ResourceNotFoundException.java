package com.techforum.backend.exception;

public class ResourceNotFoundException extends BusinessException {
    
    public ResourceNotFoundException(String message) {
        super(404, message);
    }
    
    public ResourceNotFoundException(String resourceName, Long id) {
        super(404, resourceName + " 不存在，ID: " + id);
    }
    
    public ResourceNotFoundException(String resourceName, String identifier) {
        super(404, resourceName + " 不存在: " + identifier);
    }
}
