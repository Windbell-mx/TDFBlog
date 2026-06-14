// API服务文件，用于与后端通信

const API_BASE_URL = '/api';
const USER_KEY = 'tech_forum_user';

// 类型定义
export interface User {
  id: number;
  email: string;
  nickname?: string;
  username?: string;
  password?: string;
  avatar?: string;
  gender?: string;
  bio?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Article {
  id: number;
  title: string;
  content: string;
  coverImage?: string;
  category?: string;
  tags?: string[];
  readCount?: number;
  createdAt: string;
  updatedAt: string;
  user: User;
}

// 获取token
// Token 存储已移除 —— 后端使用 httpOnly cookie 管理认证令牌
export const clearUser = (): void => {
  localStorage.removeItem(USER_KEY);
};

// 获取用户信息
export const getUser = (): any => {
  const userStr = localStorage.getItem(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

// 获取当前用户ID
export const getCurrentUserId = (): number | null => {
  const user = getUser();
  return user ? user.id : null;
};

// 存储用户信息
export const setUser = (user: any): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

// 检查是否已登录
export const isAuthenticated = (): boolean => {
  // 由于 token 存放在 httpOnly cookie 中，前端无法直接读取。
  // 使用已缓存的用户信息作为登录态判断（若需要更强验证，可调用 /users/me）。
  return !!getUser();
};

// 自定义错误类，包含HTTP状态码和错误信息
export class HttpError extends Error {
  status: number;
  errorMessage: string;

  constructor(message: string, status: number, errorMessage?: string) {
    super(message);
    this.status = status;
    this.errorMessage = errorMessage || message;
    this.name = 'HttpError';
  }
}

// 通用请求方法
async function request<T>(
  url: string,
  options: RequestInit & { skipAuthRedirect?: boolean } = {}
): Promise<T> {
  // 不再在前端添加 Authorization 头，后端使用 httpOnly cookie 进行认证。
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    let errorMessage = '请求失败';
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } else {
        const text = await response.text();
        if (text) {
          errorMessage = text;
        }
      }
    } catch {
      // 无法解析错误响应，使用默认消息
    }

    // 只有在不是登录/注册接口，且没有设置skipAuthRedirect的情况下，才处理401
    if (response.status === 401 && !options.skipAuthRedirect && 
        !url.includes('/users/login') && !url.includes('/users/register')) {
      clearUser();
      window.location.href = '/';
    }
    
    throw new HttpError(`HTTP error! status: ${response.status}`, response.status, errorMessage);
  }

  // 检查响应是否有body
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return undefined as T;
  }

  return response.json();
}

// 用户相关API
export const userApi = {
  register: async (user: { username: string; email: string; password: string }) => {
    const response = await request<{ user: User }>('/users/register', {
      method: 'POST',
      body: JSON.stringify(user),
      skipAuthRedirect: true,
    });
    setUser(response.user);
    return response;
  },

  login: async (credentials: { email: string; password: string; captchaToken?: string }) => {
    const response = await request<{ user: User }>('/users/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      skipAuthRedirect: true,
    });
    setUser(response.user);
    return response;
  },

  logout: () => {
    // 清除前端缓存的用户信息（后端若有 logout 接口，可在此调用）
    clearUser();
  },

  getUserById: (id: number) => request<User>(`/users/${id}`),

  uploadAvatar: async (id: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE_URL}/users/${id}/avatar`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearUser();
        window.location.href = '/';
        throw new HttpError('Unauthorized', 401);
      }
      throw new HttpError(`HTTP error! status: ${response.status}`, response.status);
    }

    return response;
  },

  deleteUser: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (response.status === 204 || response.ok) {
      return;
    }

    if (response.status === 401) {
      clearUser();
      window.location.href = '/';
      throw new HttpError('Unauthorized', 401);
    }

    throw new HttpError(`HTTP error! status: ${response.status}`, response.status);
  },

  updateUser: async (id: number, updates: { nickname?: string; gender?: string; bio?: string }): Promise<User> => {
    return request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  forgotPassword: async (email: string): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/users/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      throw new HttpError(`HTTP error! status: ${response.status}`, response.status);
    }

    return response.text();
  },

  resetPassword: async (token: string, newPassword: string): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/users/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, newPassword }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new HttpError(text || `HTTP error! status: ${response.status}`, response.status);
    }

    return response.text();
  },
};

// 文章相关API
export const articleApi = (() => {
  let authorsCache: any[] | null = null;

  return {
    createArticle: (article: { title: string; content: string; coverImage?: string; userId: number; category?: string; tags?: string[] }) => {
      // 创建新文章时清除缓存
      authorsCache = null;
      return request<Article>('/articles', {
        method: 'POST',
        body: JSON.stringify(article),
      });
    },

    getAllArticles: async (sort: string = 'latest') => {
      // 每次都从服务器获取最新数据，确保排序正确
      const result = await request<Article[]>(`/articles?sort=${sort}`);
      return result;
    },

    getArticleById: (id: number) => request<Article>(`/articles/${id}`),

    getArticlesByUserId: (userId: number) => request<Article[]>(`/articles/user/${userId}`),

    updateArticle: (id: number, article: { title: string; content: string; category?: string; tags?: string[] }) => {
      // 更新文章时清除缓存
      authorsCache = null;
      return request<Article>(`/articles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(article),
      });
    },

    deleteArticle: (id: number) => {
      // 删除文章时清除缓存
      authorsCache = null;
      return request<void>(`/articles/${id}`, {
        method: 'DELETE',
      });
    },

    uploadCoverImage: (id: number, file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return fetch(`${API_BASE_URL}/articles/${id}/cover`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
    },

    getPopularAuthors: async () => {
      // 第一次调用后缓存结果
      if (authorsCache) {
        return authorsCache;
      }
      const result = await request<Array<{ id: number; nickname: string; avatar?: string; articleCount: number }>>('/articles/popular-authors');
      authorsCache = result;
      return result;
    },

    // 清除所有文章缓存的方法
    clearCache: () => {
      authorsCache = null;
    },
  };
})();

// 统计相关API
export const statisticsApi = {
  getStatistics: () => request<{ articleCount: number; userCount: number; todayUpdates: number }>('/statistics'),
};

// 收藏相关API
export const collectionApi = {
  addCollection: (userId: number, articleId: number) =>
    request<{ success: boolean; message: string }>('/collections', {
      method: 'POST',
      body: JSON.stringify({ userId, articleId }),
    }),

  removeCollection: (userId: number, articleId: number) =>
    request<{ success: boolean; message: string }>('/collections/remove', {
      method: 'POST',
      body: JSON.stringify({ userId, articleId }),
    }),

  getUserCollections: (userId: number) =>
    request<Array<{ id: number; articleId: number; articleTitle: string; createdAt: string }>>(`/collections/user/${userId}`),

  checkCollection: (userId: number, articleId: number) =>
    request<{ isCollected: boolean }>(`/collections/check?userId=${userId}&articleId=${articleId}`),

  incrementReadCount: (articleId: number) =>
    request<void>(`/articles/${articleId}/read`, {
      method: 'POST',
    }),
};
