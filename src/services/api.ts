// API服务文件，用于与后端通信

const API_BASE_URL = 'http://localhost:8081/api';
const TOKEN_KEY = 'tech_forum_token';
const USER_KEY = 'tech_forum_user';

// 类型定义
export interface User {
  id: number;
  username: string;
  email: string;
  password?: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Article {
  id: number;
  title: string;
  content: string;
  coverImage?: string;
  category?: string;
  readCount?: number;
  createdAt: string;
  updatedAt: string;
  user: User;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: User;
}

// 获取token
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

// 存储token
export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

// 清除token
export const clearToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
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
  return !!getToken();
};

// 自定义错误类，包含HTTP状态码
export class HttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'HttpError';
  }
}

// 通用请求方法
async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearToken();
      window.location.href = '/';
    }
    throw new HttpError(`HTTP error! status: ${response.status}`, response.status);
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
    const response = await request<{ token: string; user: User }>('/users/register', {
      method: 'POST',
      body: JSON.stringify(user),
    });
    setToken(response.token);
    setUser(response.user);
    return response;
  },

  login: async (credentials: { email: string; password: string }) => {
    const response = await request<{ token: string; user: User }>('/users/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    setToken(response.token);
    setUser(response.user);
    return response;
  },

  logout: () => {
    clearToken();
  },

  getUserById: (id: number) => request<User>(`/users/${id}`),

  uploadAvatar: async (id: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getToken();

    const response = await fetch(`${API_BASE_URL}/users/${id}/avatar`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearToken();
        window.location.href = '/';
        throw new HttpError('Unauthorized', 401);
      }
      throw new HttpError(`HTTP error! status: ${response.status}`, response.status);
    }

    return response;
  },

  deleteUser: async (id: number): Promise<void> => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.status === 204 || response.ok) {
      return;
    }

    if (response.status === 401) {
      clearToken();
      window.location.href = '/';
      throw new HttpError('Unauthorized', 401);
    }

    throw new HttpError(`HTTP error! status: ${response.status}`, response.status);
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
export const articleApi = {
  createArticle: (article: { title: string; content: string; coverImage?: string; userId: number; category?: string }) =>
    request<Article>('/articles', {
      method: 'POST',
      body: JSON.stringify(article),
    }),

  getAllArticles: () => request<Article[]>('/articles'),

  getArticleById: (id: number) => request<Article>(`/articles/${id}`),

  getArticlesByUserId: (userId: number) => request<Article[]>(`/articles/user/${userId}`),

  updateArticle: (id: number, article: { title: string; content: string; category?: string }) =>
    request<Article>(`/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(article),
    }),

  deleteArticle: (id: number) =>
    request<void>(`/articles/${id}`, {
      method: 'DELETE',
    }),

  uploadCoverImage: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    return fetch(`${API_BASE_URL}/articles/${id}/cover`, {
      method: 'POST',
      body: formData,
    });
  },

  getPopularAuthors: () => request<Array<{ id: number; username: string; avatar?: string; articleCount: number }>>('/articles/popular-authors'),
};

// 笔记相关API
export const noteApi = {
  createNote: (note: { title: string; content: string; userId: number }) =>
    request<Note>('/notes', {
      method: 'POST',
      body: JSON.stringify(note),
    }),

  getNoteById: (id: number) => request<Note>(`/notes/${id}`),

  getNotesByUserId: (userId: number) => request<Note[]>(`/notes/user/${userId}`),

  updateNote: (id: number, note: { title: string; content: string }) =>
    request<Note>(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(note),
    }),

  deleteNote: (id: number) =>
    request<void>(`/notes/${id}`, {
      method: 'DELETE',
    }),
};

// 收藏相关API
export const collectionApi = {
  addCollection: (userId: number, articleId: number) =>
    request<{ success: boolean; message: string }>('/collections', {
      method: 'POST',
      body: JSON.stringify({ userId, articleId }),
    }),

  removeCollection: (userId: number, articleId: number) =>
    request<{ success: boolean; message: string }>('/collections', {
      method: 'DELETE',
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