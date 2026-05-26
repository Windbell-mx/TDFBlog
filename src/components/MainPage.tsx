import { useState, useEffect } from 'react';
import '../styles/MainPage.css';
import Home from './Home';
import Profile from './Profile';
import ArticleDetail from './ArticleDetail';
import CreateArticle from './CreateArticle';
import { userApi, articleApi, getCurrentUserId, type Article } from '../services/api';
import ThemeToggle from './ThemeToggle';

interface MainPageProps {
  onLogout: () => void;
  addToast: (message: string, type: 'success' | 'error' | 'info', duration?: number) => void;
}

const MainPage = ({ onLogout, addToast }: MainPageProps) => {
  
  const [currentModule, setCurrentModule] = useState('home');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [viewedAuthor, setViewedAuthor] = useState<{ id: number; username: string } | null>(null);
  const [latestArticles, setLatestArticles] = useState<Article[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(true);

  const handleLogout = () => {
    userApi.logout();
    onLogout();
  };

  const handleArticleClick = (article: Article) => {
    setSelectedArticle(article);
    setCurrentModule('community');
    // 更新浏览器历史记录
    history.pushState({ articleId: article.id, module: 'community' }, '', `/#article/${article.id}`);
  };

  const handleBackFromArticle = () => {
    setSelectedArticle(null);
    // 更新浏览器历史记录
    history.pushState({ module: 'community' }, '', `/#community`);
  };

  const handleAuthorClick = (authorId: number, authorName: string) => {
    setViewedAuthor({ id: authorId, username: authorName });
    setCurrentModule('personal');
    // 更新浏览器历史记录
    history.pushState({ authorId, module: 'personal' }, '', `/#author/${authorId}`);
  };

  const handleBackFromAuthor = () => {
    setViewedAuthor(null);
    setCurrentModule('community');
    // 更新浏览器历史记录
    history.pushState({ module: 'community' }, '', `/#community`);
  };

  // 获取最新文章
  useEffect(() => {
    const fetchLatestArticles = async () => {
      try {
        setIsLoadingArticles(true);
        const articles = await articleApi.getAllArticles('latest');
        // 只取前3篇
        setLatestArticles(articles.slice(0, 3));
      } catch (error) {
        console.error('获取最新文章失败:', error);
      } finally {
        setIsLoadingArticles(false);
      }
    };

    fetchLatestArticles();
  }, []);

  // 监听浏览器回退事件
  useEffect(() => {
    const handlePopState = () => {
      // 根据当前状态处理回退逻辑
      if (selectedArticle) {
        setSelectedArticle(null);
      } else if (viewedAuthor) {
        setViewedAuthor(null);
      } else if (currentModule !== 'home') {
        setCurrentModule('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentModule, selectedArticle, viewedAuthor]);

  // 处理导航
  const handleNavClick = (module: string) => {
    setCurrentModule(module);
    setSelectedArticle(null);
    setViewedAuthor(null);
    // 更新浏览器历史记录
    history.pushState({ module }, '', `/#${module}`);
  };

  return (
    <div className="main-page-container">
      <header className="main-header">
        <div className="header-left">
          <h1>科技研讨吧</h1>
        </div>
        <nav className="main-nav">
          <button
            className={`nav-module ${currentModule === 'home' ? 'active' : ''}`}
            onClick={() => handleNavClick('home')}
          >
            首页
          </button>
          <button
            className={`nav-module ${currentModule === 'community' ? 'active' : ''}`}
            onClick={() => handleNavClick('community')}
          >
            科技社区
          </button>
          <button
            className={`nav-module ${currentModule === 'personal' ? 'active' : ''}`}
            onClick={() => handleNavClick('personal')}
          >
            个人中心
          </button>
        </nav>
        <div className="header-right">
          <ThemeToggle />
          <button className="logout-button" onClick={handleLogout}>
            退出登录
          </button>
        </div>
      </header>

      <main className="main-content">
        {currentModule === 'home' && (
          <div className="home-content">
            <section className="hero-section">
              <div className="hero-content">
                <h2>欢迎来到科技研讨吧</h2>
                <p>这里是技术爱好者的聚集地，分享知识，交流经验，共同成长</p>
                <button
                  className="get-started-button"
                  onClick={() => handleNavClick('community')}
                >
                  浏览社区
                </button>
              </div>
            </section>

            <section className="features-section">
              <h3>平台特色</h3>
              <div className="features-grid">
                <div className="feature-card">
                  <div className="feature-icon">📝</div>
                  <h4>技术文章</h4>
                  <p>分享最新的技术动态和深度解析</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">📒</div>
                  <h4>学习笔记</h4>
                  <p>记录学习过程中的心得体会</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">👥</div>
                  <h4>社区交流</h4>
                  <p>与其他技术爱好者互动交流</p>
                </div>
              </div>
            </section>

            <section className="latest-articles">
              <h3>最新文章</h3>
              <div className="articles-preview">
                {isLoadingArticles ? (
                  <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>加载中...</p>
                  </div>
                ) : latestArticles.length === 0 ? (
                  <div className="empty-state">
                    <p>暂无文章</p>
                    <button
                      className="read-more-button"
                      onClick={() => handleNavClick('community')}
                    >
                      浏览社区
                    </button>
                  </div>
                ) : (
                  latestArticles.map(article => (
                    <div
                      key={article.id}
                      className="article-preview"
                      onClick={() => handleArticleClick(article)}
                    >
                      <div className="article-preview-content">
                        <div className="article-meta">
                          <div className="article-author">
                            <img
                              src={article.user?.avatar || ''}
                              alt={article.user?.nickname || '作者'}
                              className="author-avatar-small"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ccc"%3E%3Ccircle cx="12" cy="8" r="5"/%3E%3Cpath d="M12 14c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/%3E%3C/svg%3E';
                              }}
                            />
                            <span>{article.user?.nickname || '匿名用户'}</span>
                          </div>
                          <span className="article-date">{new Date(article.createdAt).toLocaleDateString('zh-CN')}</span>
                        </div>
                        <h4>{article.title}</h4>
                        <p>{article.content?.replace(/<[^>]*>/g, '').substring(0, 100)}...</p>
                      </div>
                      <button className="read-more-button">阅读全文</button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}
        {currentModule === 'community' && selectedArticle === null && (
          <Home onArticleClick={handleArticleClick} onAuthorClick={handleAuthorClick} addToast={addToast} />
        )}
        {currentModule === 'community' && selectedArticle !== null && (
          <ArticleDetail 
            article={selectedArticle} 
            onBack={handleBackFromArticle} 
            onAuthorClick={handleAuthorClick} 
            onEdit={(article) => {
              setCurrentModule('create');
              setEditingArticle(article);
            }}
            addToast={addToast} 
          />
        )}
        {currentModule === 'personal' && (
          <Profile onLogout={handleLogout} viewedAuthor={viewedAuthor} onBack={handleBackFromAuthor} addToast={addToast} />
        )}
        {currentModule === 'create' && (
          <CreateArticle
            onBack={() => {
              setCurrentModule('community');
              setEditingArticle(null);
              history.pushState({ module: 'community' }, '', `/#community`);
            }}
            onSave={(articleData) => {
              if (editingArticle) {
                // 更新文章
                articleApi.updateArticle(editingArticle.id, {
                  title: articleData.title,
                  content: articleData.content,
                  category: articleData.category,
                  tags: articleData.tags
                }).then(() => {
                  addToast('文章更新成功！', 'success');
                  setCurrentModule('community');
                  setEditingArticle(null);
                  history.pushState({ module: 'community' }, '', `/#community`);
                }).catch(() => {
                  addToast('更新失败，请重试', 'error');
                });
              } else {
                // 创建文章
                const userId = getCurrentUserId();
                if (!userId) {
                  addToast('请先登录', 'error');
                  return;
                }
                articleApi.createArticle({
                  title: articleData.title,
                  content: articleData.content,
                  userId: userId,
                  category: articleData.category,
                  tags: articleData.tags
                }).then(() => {
                  addToast('文章发布成功！', 'success');
                  setCurrentModule('community');
                  history.pushState({ module: 'community' }, '', `/#community`);
                }).catch(() => {
                  addToast('发布失败，请重试', 'error');
                });
              }
            }}
            article={editingArticle ? {
              id: editingArticle.id,
              title: editingArticle.title || '',
              content: editingArticle.content || '',
              category: editingArticle.category || '技术文章',
              tags: (editingArticle as any).tags || []
            } : undefined}
          />
        )}
      </main>
    </div>
  );
};

export default MainPage;
