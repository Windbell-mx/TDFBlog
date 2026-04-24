import React, { useState, useEffect } from 'react';
import { collectionApi, getCurrentUserId } from '../services/api';

interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Article {
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

interface ArticleDetailProps {
  article: Article;
  onBack: () => void;
}

const ArticleDetail: React.FC<ArticleDetailProps> = ({ article, onBack }) => {
  const [isCollected, setIsCollected] = useState(false);
  const [isLoadingCollection, setIsLoadingCollection] = useState(false);

  useEffect(() => {
    const checkCollectionStatus = async () => {
      const userId = getCurrentUserId();
      if (userId && article.id) {
        try {
          const response = await collectionApi.checkCollection(userId, article.id);
          setIsCollected(response.isCollected);
        } catch (error) {
          console.error('检查收藏状态失败:', error);
        }
      }
    };

    const incrementRead = async () => {
      if (article.id) {
        try {
          await collectionApi.incrementReadCount(article.id);
        } catch (error) {
          console.error('增加阅读量失败:', error);
        }
      }
    };

    checkCollectionStatus();
    incrementRead();
  }, [article.id]);

  const handleToggleCollection = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      alert('请先登录');
      return;
    }

    setIsLoadingCollection(true);
    try {
      if (isCollected) {
        await collectionApi.removeCollection(userId, article.id);
        setIsCollected(false);
      } else {
        await collectionApi.addCollection(userId, article.id);
        setIsCollected(true);
      }
    } catch (error) {
      console.error('收藏操作失败:', error);
    } finally {
      setIsLoadingCollection(false);
    }
  };

  if (!article) {
    return (
      <div className="article-detail-container">
        <div className="error-state">
          <p>文章不存在</p>
          <button className="back-button" onClick={onBack}>返回</button>
        </div>
      </div>
    );
  }

  // 格式化日期
  const formatDate = (dateString: string): string => {
    if (!dateString) return '未知';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 获取用户信息
  const user = article.user || {};
  const username = user.username || '未知用户';
  const avatar = user.avatar || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20portrait&image_size=square';

  return (
    <div className="article-detail-container">
      <div className="article-detail-header">
        <button className="back-button" onClick={onBack}>← 返回</button>
        <h1 className="article-detail-title">{article.title || '无标题'}</h1>
        <div className="article-detail-meta">
          <span className="article-author">
            <img src={avatar} alt={username} className="author-avatar" />
            {username}
          </span>
          <span className="article-date">{formatDate(article.createdAt)}</span>
          <span className="article-category">{article.category || '技术文章'}</span>
          <span className="article-reads">👁 {article.readCount || 0}</span>
        </div>
        <button
          className={`fancy-collect-btn ${isCollected ? 'collected' : ''} ${isLoadingCollection ? 'loading' : ''}`}
          onClick={handleToggleCollection}
          disabled={isLoadingCollection}
        >
          <span className="collect-icon">
            {isCollected ? '❤️' : '🤍'}
          </span>
          <span className="collect-text">
            {isLoadingCollection ? '操作中...' : (isCollected ? '已收藏' : '收藏')}
          </span>
        </button>
      </div>
      <div className="article-detail-content" dangerouslySetInnerHTML={{ __html: article.content || '<p>无内容</p>' }} />
    </div>
  );
};

export default ArticleDetail;