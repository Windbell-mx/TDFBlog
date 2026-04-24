import { useState } from 'react';
import '../styles/MainPage.css';
import Home from './Home';
import Profile from './Profile';
import ArticleDetail from './ArticleDetail';
import { userApi } from '../services/api';

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

interface MainPageProps {
  onLogout: () => void;
}

const MainPage = ({ onLogout }: MainPageProps) => {
  const [currentModule, setCurrentModule] = useState('home');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const handleLogout = () => {
    userApi.logout();
    onLogout();
  };

  const handleArticleClick = (article: Article) => {
    setSelectedArticle(article);
  };

  const handleBackFromArticle = () => {
    setSelectedArticle(null);
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
            onClick={() => {
              setCurrentModule('home');
              setSelectedArticle(null);
            }}
          >
            首页
          </button>
          <button
            className={`nav-module ${currentModule === 'community' ? 'active' : ''}`}
            onClick={() => {
              setCurrentModule('community');
              setSelectedArticle(null);
            }}
          >
            科技社区
          </button>
          <button
            className={`nav-module ${currentModule === 'personal' ? 'active' : ''}`}
            onClick={() => {
              setCurrentModule('personal');
              setSelectedArticle(null);
            }}
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
                  onClick={() => setCurrentModule('community')}
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
                <div className="article-preview">
                  <h4>React 19 新特性详解</h4>
                  <p>探索 React 19 带来的新功能和改进</p>
                  <button
                    className="read-more-button"
                    onClick={() => setCurrentModule('community')}
                  >
                    阅读更多
                  </button>
                </div>
                <div className="article-preview">
                  <h4>TypeScript 高级类型技巧</h4>
                  <p>掌握 TypeScript 的高级类型系统</p>
                  <button
                    className="read-more-button"
                    onClick={() => setCurrentModule('community')}
                  >
                    阅读更多
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}
        {currentModule === 'community' && selectedArticle === null && (
          <Home onArticleClick={handleArticleClick} />
        )}
        {currentModule === 'community' && selectedArticle !== null && (
          <ArticleDetail article={selectedArticle} onBack={handleBackFromArticle} />
        )}
        {currentModule === 'personal' && (
          <Profile onLogout={handleLogout} />
        )}
      </main>
    </div>
  );
};

export default MainPage;
