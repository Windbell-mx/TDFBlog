import { useState, useRef, useEffect } from 'react';
import '../styles/Profile.css';
import { userApi, articleApi, getUser, getCurrentUserId, collectionApi, type Article } from '../services/api';
import ConfirmDialog from './ConfirmDialog';
import EditArticle from './EditArticle';
import ArticleDetail from './ArticleDetail';

interface ProfileProps {
  onBack?: () => void;
  viewedAuthor?: { id: number; username: string } | null;
  addToast: (message: string, type: 'success' | 'error' | 'info', duration?: number) => void;
}

interface UserInfo {
  avatar: string;
  nickname: string;
  gender: 'male' | 'female' | 'secret';
  registerDate: string;
  bio: string;
  stats: {
    articles: number;
    views: number;
    collections: number;
  };
  id: number;
  email: string;
  createdAt?: string;
}

interface Collection {
  id: number;
  articleId: number;
  articleTitle?: string;
  createdAt: string;
}

const Profile: React.FC<ProfileProps> = ({ viewedAuthor, onBack, addToast }) => {
  const [userArticles, setUserArticles] = useState<Article[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [articleIdToDelete, setArticleIdToDelete] = useState<number | null>(null);
  const [isEditArticleOpen, setIsEditArticleOpen] = useState(false);
  const [currentEditArticle, setCurrentEditArticle] = useState<Article | null>(null);
  const [viewingArticle, setViewingArticle] = useState<Article | null>(null);
  const [userCollections, setUserCollections] = useState<Collection[]>([]);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const hasFetchedData = useRef(false);

  const currentUser = getUser();

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '未知';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [userInfo, setUserInfo] = useState<UserInfo>(() => {
    return {
      avatar: currentUser?.avatar || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20portrait%20of%20a%20tech%20person&image_size=square',
      nickname: currentUser?.nickname || '技术达人',
      gender: 'male',
      registerDate: formatDate(currentUser?.createdAt),
      bio: '前端开发工程师，热爱技术分享和学习，专注于React、TypeScript等前端技术栈。',
      stats: {
        articles: 0,
        views: 0,
        collections: 0
      },
      id: currentUser?.id || 0,
      email: currentUser?.email || 'user@example.com',
      createdAt: currentUser?.createdAt
    };
  });

  const genderLabels = {
    male: '男',
    female: '女',
    secret: '保密'
  };

  useEffect(() => {
    const userId = viewedAuthor?.id || currentUser?.id;
    if (hasFetchedData.current || !userId) return;
    hasFetchedData.current = true;

    const fetchUserInfo = async () => {
      if (!userId) return;

      try {
        const userData = await userApi.getUserById(userId);
        console.log('获取到的用户信息:', userData);

        setUserInfo(prev => ({
          ...prev,
          id: userId,
          nickname: userData.nickname || '技术达人',
          gender: (userData.gender === 'female' || userData.gender === 'secret') ? userData.gender : 'male',
          bio: userData.bio || '前端开发工程师，热爱技术分享和学习，专注于React、TypeScript等前端技术栈。',
          avatar: userData.avatar || prev.avatar
        }));
      } catch (error) {
        console.error('获取用户信息失败:', error);
        addToast('获取用户信息失败', 'error');
      } finally {
        setIsLoadingUser(false);
      }
    };

    const fetchData = async () => {
      if (!userId) return;

      setIsLoadingArticles(true);
      setIsLoadingCollections(true);
      try {
        const articles = await articleApi.getArticlesByUserId(userId);
        
        const sortedArticles = (articles || []).sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        console.log('获取到的文章:', sortedArticles);
        setUserArticles(sortedArticles);

        if (!viewedAuthor) {
          const collections = await collectionApi.getUserCollections(userId);
          console.log('获取到的收藏:', collections);
          setUserCollections(collections || []);
          setUserInfo(prev => ({
            ...prev,
            stats: {
              ...prev.stats,
              articles: sortedArticles.length,
              collections: collections?.length || 0
            }
          }));
        } else {
          setUserCollections([]);
          setUserInfo(prev => ({
            ...prev,
            stats: {
              ...prev.stats,
              articles: sortedArticles.length,
              collections: 0
            }
          }));
        }
      } catch (error) {
        console.error('获取数据失败:', error);
        addToast('获取数据失败', 'error');
      } finally {
        setIsLoadingArticles(false);
        setIsLoadingCollections(false);
      }
    };

    fetchUserInfo();
    fetchData();
  }, [currentUser?.id, viewedAuthor?.id, addToast]);



  const handleDeleteArticle = (articleId: number) => {
    console.log('删除文章ID:', articleId);
    setArticleIdToDelete(articleId);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!articleIdToDelete) return;

    try {
      await articleApi.deleteArticle(articleIdToDelete);
      setUserArticles(prev => prev.filter(a => a.id !== articleIdToDelete));
      setUserInfo(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          articles: prev.stats.articles - 1
        }
      }));
      addToast('文章删除成功！', 'success');
    } catch (error) {
      console.error('删除文章失败:', error);
      addToast('删除文章失败，请稍后重试', 'error');
    } finally {
      setIsDeleteConfirmOpen(false);
      setArticleIdToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteConfirmOpen(false);
    setArticleIdToDelete(null);
  };

  const handleEditArticle = (article: Article) => {
    setCurrentEditArticle(article);
    setIsEditArticleOpen(true);
  };

  const handleViewArticle = async (article: Article) => {
    if (!article.content) {
      try {
        const fullArticle = await articleApi.getArticleById(article.id);
        setViewingArticle({ ...article, ...fullArticle });
      } catch (error) {
        console.error('获取文章详情失败:', error);
        setViewingArticle(article);
      }
    } else {
      setViewingArticle(article);
    }
  };

  const handleBackFromArticle = () => {
    setViewingArticle(null);
  };

  const handleViewedArticleDelete = () => {
    if (viewingArticle) {
      setUserArticles(prev => prev.filter(a => a.id !== viewingArticle?.id));
      setViewingArticle(null);
    }
  };

  const handleSaveEdit = async (article: { id: number; title: string; content: string; tags: string[]; category: string; permission: string }) => {
    try {
      const updateData = {
        title: article.title,
        content: article.content,
        category: article.category,
        tags: article.tags
      };
      console.log('发送给后端的数据:', updateData);
      console.log('文章ID:', article.id);
      await articleApi.updateArticle(article.id, updateData);
      setUserArticles(prev => prev.map(a =>
        a.id === article.id
          ? { ...a, title: article.title, content: article.content, category: article.category, tags: article.tags }
          : a
      ));
      setIsEditArticleOpen(false);
      setCurrentEditArticle(null);
      addToast('文章编辑成功！', 'success');
    } catch (error) {
      console.error('编辑文章失败:', error);
      addToast('编辑文章失败，请稍后重试', 'error');
    }
  };

  const handleCancelEditArticle = () => {
    setIsEditArticleOpen(false);
    setCurrentEditArticle(null);
  };

  const handleRemoveCollection = async (articleId: number) => {
    const userId = getCurrentUserId();
    if (!userId) {
      addToast('请先登录', 'error');
      return;
    }

    try {
      await collectionApi.removeCollection(userId, articleId);
      setUserCollections(prev => prev.filter(c => c.articleId !== articleId));
      setUserInfo(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          collections: Math.max(0, prev.stats.collections - 1)
        }
      }));
      addToast('已取消收藏', 'success');
    } catch (error) {
      console.error('取消收藏失败:', error);
      addToast('取消收藏失败，请稍后重试', 'error');
    }
  };

  return (
    <div className="profile-container">
      {isEditArticleOpen && currentEditArticle ? (
        <EditArticle
          onBack={handleCancelEditArticle}
          onSave={handleSaveEdit}
          article={currentEditArticle}
        />
      ) : viewingArticle ? (
        <ArticleDetail 
          article={viewingArticle as Article}
          onBack={handleBackFromArticle}
          onEdit={!viewedAuthor ? handleEditArticle : undefined}
          onDelete={!viewedAuthor ? handleViewedArticleDelete : undefined}
          addToast={addToast}
        />
      ) : (
        <>
          <main className="profile-main">
            <div className="profile-content">
              <div className="profile-left">
                {viewedAuthor && onBack && (
                  <div className="profile-header">
                    <button className="back-button" onClick={onBack}>
                      ← 返回社区
                    </button>
                  </div>
                )}
                
                <section className="profile-section">
                  <div className="section-header">
                    <span className="section-icon">📝</span>
                    <h3>已发布文章</h3>
                  </div>
                  <div className="articles-list">
                    {isLoadingArticles ? (
                      <div className="loading-state">加载中...</div>
                    ) : userArticles.length === 0 ? (
                      <div className="empty-state">
                        <p>暂无文章</p>
                        <p className="hint">快去发布你的第一篇文章吧！</p>
                      </div>
                    ) : (
                      userArticles.map(article => (
                        <div key={article.id} className="article-item" onClick={() => handleViewArticle(article)}>
                          <div className="article-info">
                            <h4>{article.title}</h4>
                            <div className="article-meta">
                              <span>{article.category}</span>
                              <span>{formatDate(article.createdAt)}</span>
                              <span>👁 {article.readCount || 0}</span>
                            </div>
                          </div>
                          {!viewedAuthor && (
                            <div className="article-actions">
                              <button className="action-button edit" onClick={(e) => { e.stopPropagation(); handleEditArticle(article); }}>编辑</button>
                              <button className="action-button delete" onClick={(e) => { e.stopPropagation(); handleDeleteArticle(article.id); }}>删除</button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </section>

                {!viewedAuthor && (
                  <section className="profile-section">
                    <div className="section-header">
                      <span className="section-icon">⭐</span>
                      <h3>我的收藏</h3>
                    </div>
                    <div className="collections-list">
                      {isLoadingCollections ? (
                        <div className="loading-state">加载中...</div>
                      ) : userCollections.length === 0 ? (
                        <div className="empty-state">
                          <p>暂无收藏</p>
                          <p className="hint">快去收藏你喜欢的文章吧！</p>
                        </div>
                      ) : (
                        userCollections.map(collection => (
                          <div key={collection.id} className="collection-item">
                            <div className="collection-info">
                              <h4>{collection.articleTitle || '无标题文章'}</h4>
                              <div className="collection-meta">
                                <span>收藏时间: {formatDate(collection.createdAt)}</span>
                              </div>
                            </div>
                            <div className="collection-actions">
                              <button className="action-button view" onClick={() => handleViewArticle({ id: collection.articleId, title: collection.articleTitle || '无标题', content: '', createdAt: collection.createdAt, updatedAt: collection.createdAt, readCount: 0, user: { id: 0, nickname: '', avatar: '', email: '' } })}>
                                查看
                              </button>
                              <button className="action-button remove" onClick={() => handleRemoveCollection(collection.articleId)}>
                                取消收藏
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                )}
              </div>

              <div className="profile-right">
                <section className="profile-info-card">
                  {isLoadingUser ? (
                    <div className="loading-state profile-loading">
                      <div className="loading-spinner"></div>
                      <p>加载个人信息中...</p>
                    </div>
                  ) : (
                    <>
                      <div className="profile-avatar">
                        <img src={userInfo.avatar} alt="头像" />
                      </div>
                      <div className="profile-details">
                        <h2 className="profile-nickname">
                          {userInfo.nickname}
                          <span className="gender-badge">{genderLabels[userInfo.gender]}</span>
                        </h2>
                        <p className="profile-register-date">注册时间：{userInfo.registerDate}</p>
                        {!viewedAuthor && (
                          <p className="profile-email">{userInfo.email}</p>
                        )}
                        <p className="profile-bio">{userInfo.bio}</p>
                        <div className="profile-stats">
                          <div className="stat-item">
                            <span className="stat-number">{userInfo.stats.articles}</span>
                            <span className="stat-label">发表文章</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-number">{userInfo.stats.views}</span>
                            <span className="stat-label">浏览量</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-number">{userInfo.stats.collections}</span>
                            <span className="stat-label">收藏量</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </section>
              </div>
            </div>
          </main>

          <footer className="profile-footer">
            <p>© 2026 个人管理中心. 保留所有权利.</p>
          </footer>

          <ConfirmDialog
            isOpen={isDeleteConfirmOpen}
            title="删除文章"
            message="确定要删除这篇文章吗？此操作不可撤销。"
            onConfirm={handleConfirmDelete}
            onCancel={handleCancelDelete}
            confirmText="删除"
            cancelText="取消"
          />
        </>
      )}
    </div>
  );
};

export default Profile;
