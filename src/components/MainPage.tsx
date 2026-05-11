import { useState, useEffect } from 'react';
import '../styles/MainPage.css';
import Home from './Home';
import Profile from './Profile';
import ArticleDetail from './ArticleDetail';
import { userApi, articleApi, type Article } from '../services/api';

interface MainPageProps {
  onLogout: () => void;
}

const MainPage = ({ onLogout }: MainPageProps) => {
  
  const [currentModule, setCurrentModule] = useState('home');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [viewedAuthor, setViewedAuthor] = useState<{ id: number; username: string } | null>(null);
  const [latestArticles, setLatestArticles] = useState<Article[]>([]);

  const handleLogout = () => {
    userApi.logout();
    onLogout();
  };

  const handleArticleClick = (article: Article) => {
    setSelectedArticle(article);
    // 更新浏览器历史记录
    history.pushState({ articleId: article.id }, '', `/#article/${article.id}`);
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

  // 获取最新文章
  useEffect(() => {
    const fetchLatestArticles = async () => {
      try {
        const articles = await articleApi.getAllArticles();
        // 按创建时间排序，取最新的文章
        const sortedArticles = articles.sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setLatestArticles(sortedArticles.slice(0, 2)); // 只显示最新的2篇文章
      } catch (error) {
        console.error('获取最新文章失败:', error);
      }
    };

    fetchLatestArticles();
  }, []);

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
                {latestArticles.length > 0 ? (
                  latestArticles.map(article => (
                    <div key={article.id} className="article-preview" onClick={() => handleArticleClick(article)}>
                      <h4>{article.title}</h4>
                      <p>{article.content.replace(/<[^>]*>/g, '').substring(0, 100)}...</p>
                      <div className="article-meta">
                        <span className="article-author">
                          <img 
                            src={article.user.avatar || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20portrait&image_size=square'} 
                            alt={article.user.nickname || article.user.username} 
                            className="author-avatar-small"
                          />
                          {article.user.nickname || article.user.username}
                        </span>
                        <span className="article-date">{new Date(article.createdAt).toLocaleDateString('zh-CN')}</span>
                      </div>
                      <button
                        className="read-more-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArticleClick(article);
                        }}
                      >
                        阅读更多
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <p>暂无文章</p>
                    <button
                      className="read-more-button"
                      onClick={() => handleNavClick('community')}
                    >
                      浏览社区
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
        {currentModule === 'community' && selectedArticle === null && (
          <Home onArticleClick={handleArticleClick} onAuthorClick={handleAuthorClick} />
        )}
        {currentModule === 'community' && selectedArticle !== null && (
          <ArticleDetail article={selectedArticle} onBack={handleBackFromArticle} onAuthorClick={handleAuthorClick} />
        )}
        {currentModule === 'personal' && (
          <Profile onLogout={handleLogout} viewedAuthor={viewedAuthor} onBack={handleBackFromAuthor} />
        )}
      </main>
    </div>
  );
};

export default MainPage;
