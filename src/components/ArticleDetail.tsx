import React, { useState, useEffect } from 'react';
import { collectionApi, getCurrentUserId, type Article as ApiArticle } from '../services/api';

interface ArticleDetailProps {
  article: ApiArticle;
  onBack: () => void;
  onAuthorClick?: (authorId: number, authorName: string) => void;
  addToast: (message: string, type: 'success' | 'error' | 'info', duration?: number) => void;
}

const ArticleDetail: React.FC<ArticleDetailProps> = ({ article, onBack, onAuthorClick, addToast }) => {
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
      addToast('请先登录', 'error');
      return;
    }

    console.log('收藏操作开始:', { userId, articleId: article.id, currentState: isCollected });
    setIsLoadingCollection(true);
    try {
      if (isCollected) {
        console.log('执行取消收藏操作');
        await collectionApi.removeCollection(userId, article.id);
        console.log('取消收藏成功');
        setIsCollected(false);
        addToast('已取消收藏', 'success');
      } else {
        console.log('执行收藏操作');
        await collectionApi.addCollection(userId, article.id);
        console.log('收藏成功');
        setIsCollected(true);
        addToast('收藏成功', 'success');
      }
    } catch (error) {
      console.error('收藏操作失败:', error);
      addToast('操作失败，请稍后重试', 'error');
    } finally {
      setIsLoadingCollection(false);
      console.log('收藏操作结束');
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

  const user = article.user ?? { id: 0, nickname: '', avatar: '', email: '' };
  const displayName = user.nickname || '未知用户';
  const avatar = user.avatar || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20portrait&image_size=square';

  return (
    <div className="article-detail-container">
      <div className="article-detail-header">
        <button className="back-button" onClick={onBack}>← 返回</button>
        <h1 className="article-detail-title">{article.title || '无标题'}</h1>
        <div className="article-detail-meta">
          <span
            className="article-author"
            onClick={() => {
              if (onAuthorClick && user.id) {
                onAuthorClick(user.id, displayName);
              }
            }}
            style={{ cursor: 'pointer' }}
            title="点击查看作者信息"
          >
            <img src={avatar} alt={displayName} className="author-avatar" />
            {displayName}
          </span>
          <span className="article-date">{formatDate(article.createdAt)}</span>
          <span className="article-category">{article.category || '技术文章'}</span>
          <span className="article-reads">👁 {article.readCount || 0}</span>
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
      </div>
      <div className="article-detail-content" dangerouslySetInnerHTML={{ __html: article.content || '<p>无内容</p>' }} />
    </div>
  );
};

export default ArticleDetail;
