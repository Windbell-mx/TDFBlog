import { useState, useEffect } from 'react';
import '../styles/MainPage.css';
import Home from './Home';
import Profile from './Profile';
import ArticleDetail from './ArticleDetail';
import { userApi, articleApi, type Article } from '../services/api';

interface MainPageProps {
  onLogout: () => void;
  addToast: (message: string, type: 'success' | 'error' | 'info', duration?: number) => void;
}

const MainPage = ({ onLogout, addToast }: MainPageProps) => {
  
  const [currentModule, setCurrentModule] = useState('home');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [viewedAuthor, setViewedAuthor] = useState<{ id: number; username: string } | null>(null);
  // 移除 latestArticles 状态，不再重复获取文章

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
                <div className="empty-state">
                  <p>去社区浏览更多文章</p>
                  <button
                    className="read-more-button"
                    onClick={() => handleNavClick('community')}
                  >
                    浏览社区
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}
        {currentModule === 'community' && selectedArticle === null && (
          <Home onArticleClick={handleArticleClick} onAuthorClick={handleAuthorClick} addToast={addToast} />
        )}
        {currentModule === 'community' && selectedArticle !== null && (
          <ArticleDetail article={selectedArticle} onBack={handleBackFromArticle} onAuthorClick={handleAuthorClick} addToast={addToast} />
        )}
        {currentModule === 'personal' && (
          <Profile onLogout={handleLogout} viewedAuthor={viewedAuthor} onBack={handleBackFromAuthor} addToast={addToast} />
        )}
      </main>
    </div>
  );
};

export default MainPage;
