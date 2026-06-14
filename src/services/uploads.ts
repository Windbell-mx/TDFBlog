// 图片上传与访问服务文件

const UPLOADS_BASE_URL = '/uploads';

// 上传相关API
const UPLOAD_API_BASE_URL = '/api';

// 获取头像完整URL
export const getAvatarUrl = (avatar: string | null | undefined): string | null => {
  if (!avatar) return null;
  
  // 如果已经是完整URL，直接返回
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar;
  }
  
  // 如果是相对路径，添加CDN基础URL
  if (avatar.startsWith('/')) {
    return UPLOADS_BASE_URL + avatar;
  }
  
  // 如果只是文件名，添加CDN基础URL
  return `${UPLOADS_BASE_URL}/${avatar}`;
};

// 获取封面图片完整URL
export const getCoverImageUrl = (coverImage: string | null | undefined): string | null => {
  if (!coverImage) return null;
  
  if (coverImage.startsWith('http://') || coverImage.startsWith('https://')) {
    return coverImage;
  }
  
  if (coverImage.startsWith('/')) {
    return UPLOADS_BASE_URL + coverImage;
  }
  
  return `${UPLOADS_BASE_URL}/${coverImage}`;
};

// 上传头像
export const uploadAvatar = async (userId: string, file: File): Promise<{ avatar: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${UPLOAD_API_BASE_URL}/users/${userId}/avatar`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '头像上传失败');
  }
  
  const data = await response.json();
  return {
    avatar: data.avatar
  };
};

// 上传文章封面
export const uploadCoverImage = async (file: File): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${UPLOAD_API_BASE_URL}/articles/cover`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '封面上传失败');
  }
  
  const data = await response.json();
  return {
    url: data.url
  };
};

// 图片预加载
export const preloadImage = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`图片加载失败: ${url}`));
    img.src = url;
  });
};

// 批量预加载图片
export const preloadImages = async (urls: string[]): Promise<void[]> => {
  return Promise.all(urls.map(url => preloadImage(url)));
};

// 验证图片文件
export const validateImageFile = (file: File, maxSizeMB: number = 2): { valid: boolean; error?: string } => {
  // 检查文件类型
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: '不支持的图片格式，请上传 JPG、PNG、GIF 或 WebP 格式' 
    };
  }
  
  // 检查文件大小
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { 
      valid: false, 
      error: `图片大小不能超过 ${maxSizeMB}MB` 
    };
  }
  
  return { valid: true };
};

// 获取图片扩展名
export const getImageExtension = (filename: string): string => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

// 生成唯一文件名
export const generateUniqueFilename = (originalName: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = getImageExtension(originalName);
  return `${timestamp}-${random}.${extension}`;
};

// 导出常量
export { UPLOADS_BASE_URL };
