import { useState, useEffect } from 'react';
import '../styles/Home.css';
import ArticleCard from './ArticleCard';
import CreateArticle from './CreateArticle';
import ToastManager from './ToastManager';
import { articleApi, getCurrentUserId } from '../services/api';

interface Article {
  id: number;
  title: string;
  content: string;
  coverImage?: string;
  category?: string;
  readCount?: number;
  createdAt: string;
  updatedAt: string;
  user: { id: number; username: string; email: string; avatar?: string };
}

interface Author {
  id: number;
  username: string;
  avatar?: string;
  articleCount: number;
}

interface HomeProps {
  onArticleClick?: (article: Article) => void;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

const Home = ({ onArticleClick }: HomeProps) => {
  const [currentPage, setCurrentPage] = useState('home');
  const [searchTerm, setSearchTerm] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [popularAuthors, setPopularAuthors] = useState<Author[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const fetchArticles = async () => {
      setIsLoading(true);
      try {
        const articlesData = await articleApi.getAllArticles();
        setArticles(articlesData);
      } catch (error) {
        console.error('获取文章失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchAuthors = async () => {
      try {
        const authorsData = await articleApi.getPopularAuthors();
        setPopularAuthors(authorsData);
      } catch (error) {
        console.error('获取热门作者失败:', error);
      }
    };

    fetchArticles();
    fetchAuthors();
  }, []);

  const filteredArticles = articles.filter(article => {
    const searchLower = searchTerm.toLowerCase();
    return (
      article.title.toLowerCase().includes(searchLower) ||
      article.content.toLowerCase().includes(searchLower)
    );
  });

  const handleCreateArticle = () => {
    setCurrentPage('createArticle');
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info', duration: number = 3000) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  };

  const handleCloseToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const handleSaveArticle = async (article: {
    title: string;
    content: string;
    tags: string[];
    category: string;
    permission: string
  }) => {
    try {
      const currentUserId = getCurrentUserId();
      if (!currentUserId) {
        showToast('请先登录后再发布文章', 'error');
        return;
      }

      console.log('开始保存文章:', article);
      const response = await articleApi.createArticle({
        title: article.title,
        content: article.content,
        userId: currentUserId,
        category: article.category,
      });
      console.log('文章发布成功:', response);
      const data = await articleApi.getAllArticles();
      setArticles(data);
      setCurrentPage('home');
      showToast('文章发布成功！', 'success');
    } catch (error) {
      console.error('保存文章失败:', error);
      showToast('保存文章失败，请稍后重试', 'error');
    }
  };

  const categories = [
    { id: 'all', name: '全部', icon: '🌐' },
    { id: 'frontend', name: '前端开发', icon: '💻' },
    { id: 'backend', name: '后端技术', icon: '⚙️' },
    { id: 'ai', name: '人工智能', icon: '🤖' },
    { id: 'devops', name: 'DevOps', icon: '🚀' },
    { id: 'mobile', name: '移动开发', icon: '📱' },
  ];

  const stats = [
    { label: '文章总数', value: articles.length, icon: '📝' },
    { label: '活跃用户', value: Math.max(articles.length * 3, 128), icon: '👥' },
    { label: '今日更新', value: Math.floor(Math.random() * 20) + 1, icon: '✨' },
  ];

  return (
    <div className="home-container">
      {currentPage === 'home' && (
        <>
          <header className="home-header">
            <div className="header-content">
              <h1>🌐 科技社区</h1>
              <p>我们的时间河流因技术而交汇</p>
            </div>
            <div className="header-stats">
              {stats.map((stat, index) => (
                <div key={index} className="stat-card">
                  <span className="stat-icon">{stat.icon}</span>
                  <div className="stat-info">
                    <span className="stat-value">{stat.value}</span>
                    <span className="stat-label">{stat.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </header>

          <nav className="home-nav">
            <div className="nav-content">
              <div className="category-tabs">
                {categories.map(category => (
                  <button
                    key={category.id}
                    className={`category-tab ${selectedCategory === category.id ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <span className="category-icon">{category.icon}</span>
                    <span className="category-name">{category.name}</span>
                  </button>
                ))}
              </div>
              <div className="nav-actions">
                <div className="search-box">
                  <input
                    type="text"
                    className="search-input"
                    placeholder="搜索技术文章..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button className="search-btn">🔍</button>
                </div>
                <button className="create-btn" onClick={handleCreateArticle}>
                  <span>+</span> 发布文章
                </button>
              </div>
            </div>
          </nav>

          <main className="home-main">
            <section className="articles-section">
              <div className="section-header">
                <h2>📖 精选文章</h2>
                <span className="article-count">共 {filteredArticles.length} 篇文章</span>
              </div>

              {isLoading ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>加载中...</p>
                </div>
              ) : filteredArticles.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📭</span>
                  <h3>暂无文章</h3>
                  <p>成为第一个发布文章的人吧！</p>
                  <button className="create-first-btn" onClick={handleCreateArticle}>
                    立即发布
                  </button>
                </div>
              ) : (
                <div className="articles-grid">
                  {filteredArticles.map(article => (
                    <ArticleCard
                      key={article.id}
                      article={{
                        id: article.id,
                        title: article.title,
                        content: article.content,
                        date: article.createdAt,
                        category: article.category || '技术文章',
                        readCount: article.readCount || 0
                      }}
                      onClick={() => onArticleClick && onArticleClick(article)}
                    />
                  ))}
                </div>
              )}
            </section>

            <aside className="sidebar">
              <div className="sidebar-card">
                <h3>🏆 热门作者</h3>
                <div className="author-list">
                  {popularAuthors.map(author => (
                    <div key={author.id} className="author-item">
                      <img 
                        src={author.avatar || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=default%20avatar%20portrait&image_size=square'} 
                        alt={author.username} 
                      />
                      <div className="author-info">
                        <span className="author-name">{author.username}</span>
                        <span className="author-articles">{author.articleCount}篇文章</span>
                      </div>
                    </div>
                  ))}
                  {popularAuthors.length === 0 && (
                    <div className="author-item">
                      <div className="author-info">
                        <span className="author-name">暂无作者</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="sidebar-card">
                <h3>🏷️ 热门标签</h3>
                <div className="tags-cloud">
                  <span className="tag">React</span>
                  <span className="tag">Vue</span>
                  <span className="tag">TypeScript</span>
                  <span className="tag">Node.js</span>
                  <span className="tag">Python</span>
                  <span className="tag">AI</span>
                  <span className="tag">Docker</span>
                  <span className="tag">K8s</span>
                </div>
              </div>

              <div className="sidebar-card">
                <h3>📅 最新活动</h3>
                <div className="activity-list">
                  <div className="activity-item">
                    <span className="activity-icon">🎉</span>
                    <div className="activity-info">
                      <span className="activity-title">技术分享会</span>
                      <span className="activity-date">2026-04-25</span>
                    </div>
                  </div>
                  <div className="activity-item">
                    <span className="activity-icon">💻</span>
                    <div className="activity-info">
                      <span className="activity-title">编程马拉松</span>
                      <span className="activity-date">2026-05-01</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </main>

          <footer className="home-footer">
            <div className="footer-content">
              <p>© 2026 科技研讨吧. 用技术连接世界</p>
              <div className="footer-links">
                <a href="#">关于我们</a>
                <a href="#">联系方式</a>
                <a href="#">隐私政策</a>
              </div>
            </div>
          </footer>
        </>
      )}

      {currentPage === 'createArticle' && (
        <CreateArticle
          onBack={() => setCurrentPage('home')}
          onSave={handleSaveArticle}
        />
      )}

      <ToastManager toasts={toasts} onClose={handleCloseToast} />
    </div>
  );
};

export default Home;