import { useState, useEffect, useRef } from 'react';
import '../styles/MainPage.css';
import Home from './Home';
import Profile from './Profile';
import ArticleDetail from './ArticleDetail';
import CreateArticle from './CreateArticle';
import { userApi, articleApi, getCurrentUserId, getUser, type Article, type User } from '../services/api';
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    nickname: '',
    gender: 'male' as 'male' | 'female' | 'secret',
    bio: '',
    avatar: ''
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [errors, setErrors] = useState<{ nickname?: string; bio?: string }>({});
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const genderLabels = {
    male: '男',
    female: '女',
    secret: '保密'
  };

  const handleLogout = () => {
    userApi.logout();
    onLogout();
  };

  const handleEditProfile = () => {
    if (currentUser) {
      setEditForm({
        nickname: currentUser.nickname || '',
        gender: (currentUser.gender === 'female' || currentUser.gender === 'secret') ? currentUser.gender : 'male',
        bio: currentUser.bio || '',
        avatar: currentUser.avatar || ''
      });
      setErrors({});
      setIsEditingProfile(true);
    }
  };

  const handleCancelEditProfile = () => {
    setIsEditingProfile(false);
    setErrors({});
    setAvatarFile(null);
    setSaveError('');
  };

  const validateForm = (): boolean => {
    const newErrors: { nickname?: string; bio?: string } = {};

    if (!editForm.nickname.trim()) {
      newErrors.nickname = '昵称不能为空';
    } else if (editForm.nickname.length < 2) {
      newErrors.nickname = '昵称至少需要2个字符';
    } else if (editForm.nickname.length > 20) {
      newErrors.nickname = '昵称不能超过20个字符';
    }

    if (editForm.bio.length > 200) {
      newErrors.bio = '简介不能超过200个字符';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (validateForm() && currentUser) {
      setIsSaving(true);
      setSaveError('');

      try {
        let newAvatarUrl = editForm.avatar || currentUser.avatar;

        if (avatarFile) {
          const response = await userApi.uploadAvatar(currentUser.id, avatarFile);
          const result = await response.json();
          newAvatarUrl = result.avatar;
        }

        const updates = {
          nickname: editForm.nickname,
          gender: editForm.gender,
          bio: editForm.bio
        };

        await userApi.updateUser(currentUser.id, updates);

        const updatedUser = {
          ...currentUser,
          nickname: editForm.nickname,
          gender: editForm.gender,
          bio: editForm.bio,
          avatar: newAvatarUrl
        };
        localStorage.setItem('tech_forum_user', JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);

        setAvatarFile(null);
        setIsEditingProfile(false);
        addToast('个人信息保存成功！', 'success');
      } catch (err) {
        console.error('保存失败:', err);
        addToast('保存失败，请稍后重试', 'error');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleInputChange = (field: 'nickname' | 'bio', value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleGenderChange = (gender: 'male' | 'female' | 'secret') => {
    setEditForm(prev => ({
      ...prev,
      gender
    }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm(prev => ({
          ...prev,
          avatar: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);

    try {
      const userId = currentUser?.id;
      if (!userId) {
        addToast('无法获取用户ID', 'error');
        setIsDeleting(false);
        return;
      }
      await userApi.deleteUser(userId);
      addToast('账号已成功注销', 'success');
      userApi.logout();
      onLogout();
    } catch (error) {
      console.error('注销账号失败:', error);
      addToast('注销失败，请稍后重试', 'error');
      setIsDeleting(false);
    }
  };

  const handleArticleClick = async (article: Article) => {
    try {
      // 每次都从详情API获取完整数据，确保有tags等信息
      const fullArticle = await articleApi.getArticleById(article.id);
      setSelectedArticle(fullArticle);
    } catch (error) {
      console.error('获取文章详情失败:', error);
      setSelectedArticle(article); // 如果获取失败，使用原来的文章数据
    }
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

  // 获取当前用户信息
  useEffect(() => {
    const user = getUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
            我的
          </button>
        </nav>
        <div className="header-right">
          <ThemeToggle />
          <div className="user-menu-container" ref={menuRef}>
            <button 
              className="user-avatar-button" 
              onClick={(e) => {
                e.stopPropagation();
                setShowUserMenu(!showUserMenu);
              }}
            >
              {currentUser?.avatar ? (
                <img 
                  src={currentUser.avatar} 
                  alt="用户头像" 
                  className="user-avatar"
                />
              ) : (
                <div className="default-avatar">
                  {currentUser?.nickname?.charAt(0) || '?'}
                </div>
              )}
            </button>
            {showUserMenu && (
              <div className="user-menu">
                <div className="user-info">
                  <div className="user-avatar-large">
                    {currentUser?.avatar ? (
                      <img 
                        src={currentUser.avatar} 
                        alt="用户头像" 
                        className="user-avatar"
                      />
                    ) : (
                      <div className="default-avatar-large">
                        {currentUser?.nickname?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  <div className="user-details">
                    <div className="user-nickname">{currentUser?.nickname || '用户'}</div>
                    <div className="user-email">{currentUser?.email || ''}</div>
                  </div>
                </div>
                <div className="menu-divider"></div>
                <button 
                  className="menu-item" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUserMenu(false);
                    setShowUserInfo(true);
                  }}
                >
                  <span className="menu-icon">👤</span>
                  <span>个人信息</span>
                </button>
                <button 
                  className="menu-item logout-item" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUserMenu(false);
                    handleLogout();
                  }}
                >
                  <span className="menu-icon">🚪</span>
                  <span>退出登录</span>
                </button>
              </div>
            )}
          </div>
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
            onDelete={() => {
              setSelectedArticle(null);
            }}
            addToast={addToast} 
          />
        )}
        {currentModule === 'personal' && (
          <Profile viewedAuthor={viewedAuthor} onBack={handleBackFromAuthor} addToast={addToast} />
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

      {/* 用户信息弹窗 */}
      {showUserInfo && (
        <div className="user-info-modal-overlay" onClick={() => !isEditingProfile && setShowUserInfo(false)}>
          <div className="user-info-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{isEditingProfile ? '编辑资料' : '个人信息'}</h3>
              <button className="close-button" onClick={() => !isEditingProfile && setShowUserInfo(false)}>×</button>
            </div>
            <div className="modal-body">
              {isEditingProfile ? (
                <div className="edit-profile-form">
                  <div className="edit-avatar-section">
                    <div className="avatar-wrapper">
                      <img 
                        src={editForm.avatar || currentUser?.avatar || ''} 
                        alt="用户头像" 
                        className="modal-avatar"
                      />
                      <div className="avatar-overlay" onClick={handleAvatarClick}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                        </svg>
                        <span>更换头像</span>
                      </div>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarChange}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                  </div>
                  <div className="avatar-hint">点击头像更换图片</div>
                  <div className="edit-fields">
                    <div className="form-group">
                      <label className="form-label">昵称</label>
                      <input
                        type="text"
                        className={`form-input ${errors.nickname ? 'error' : ''}`}
                        value={editForm.nickname}
                        onChange={(e) => handleInputChange('nickname', e.target.value)}
                        placeholder="请输入昵称"
                      />
                      {errors.nickname && <span className="error-message">{errors.nickname}</span>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">性别</label>
                      <div className="gender-selector">
                        <button
                          type="button"
                          className={`gender-option ${editForm.gender === 'male' ? 'active' : ''}`}
                          onClick={() => handleGenderChange('male')}
                        >
                          <span className="gender-icon">♂</span>
                          <span>男</span>
                        </button>
                        <button
                          type="button"
                          className={`gender-option ${editForm.gender === 'female' ? 'active' : ''}`}
                          onClick={() => handleGenderChange('female')}
                        >
                          <span className="gender-icon">♀</span>
                          <span>女</span>
                        </button>
                        <button
                          type="button"
                          className={`gender-option ${editForm.gender === 'secret' ? 'active' : ''}`}
                          onClick={() => handleGenderChange('secret')}
                        >
                          <span className="gender-icon">⚥</span>
                          <span>保密</span>
                        </button>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">个人简介</label>
                      <textarea
                        className={`form-textarea ${errors.bio ? 'error' : ''}`}
                        value={editForm.bio}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        placeholder="请输入个人简介"
                        rows={4}
                      />
                      {errors.bio && <span className="error-message">{errors.bio}</span>}
                      <span className="char-count">{editForm.bio.length}/200</span>
                    </div>
                    {saveError && <div className="error-message">{saveError}</div>}
                  </div>
                </div>
              ) : (
                <>
                  <div className="user-avatar-section">
                    {currentUser?.avatar ? (
                      <img 
                        src={currentUser.avatar} 
                        alt="用户头像" 
                        className="modal-avatar"
                      />
                    ) : (
                      <div className="modal-default-avatar">
                        {currentUser?.nickname?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  <div className="user-info-list">
                    <div className="info-item">
                      <span className="info-label">昵称</span>
                      <span className="info-value">{currentUser?.nickname || '-'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">性别</span>
                      <span className="info-value">{currentUser?.gender ? genderLabels[currentUser.gender as keyof typeof genderLabels] : '-'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">邮箱</span>
                      <span className="info-value">{currentUser?.email || '-'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">用户ID</span>
                      <span className="info-value">{currentUser?.id || '-'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">个人简介</span>
                      <span className="info-value bio-value">{currentUser?.bio || '-'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">注册时间</span>
                      <span className="info-value">{currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleString('zh-CN') : '-'}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              {isEditingProfile ? (
                <>
                  <button className="save-button" onClick={handleSaveProfile} disabled={isSaving}>
                    {isSaving ? '保存中...' : '保存'}
                  </button>
                  <button className="cancel-button" onClick={handleCancelEditProfile} disabled={isSaving}>取消</button>
                </>
              ) : (
                <>
                  <button className="modal-edit-btn" onClick={handleEditProfile}>
                    编辑资料
                  </button>
                  <button className="modal-delete-btn" onClick={() => {
                    setShowUserInfo(false);
                    setShowDeleteConfirm(true);
                  }}>
                    注销账号
                  </button>
                  <button className="modal-close-btn" onClick={() => setShowUserInfo(false)}>
                    关闭
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 注销账号确认对话框 */}
      {showDeleteConfirm && (
        <div className="user-info-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="user-info-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>注销账号</h3>
              <button className="close-button" onClick={() => setShowDeleteConfirm(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="delete-confirm-text">
                您确定要注销当前账号吗？此操作不可撤销，您的所有数据将被永久删除。
              </p>
            </div>
            <div className="modal-footer">
              <button className="modal-cancel-btn" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
                取消
              </button>
              <button className="modal-confirm-delete-btn" onClick={handleDeleteAccount} disabled={isDeleting}>
                {isDeleting ? '注销中...' : '确认注销'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainPage;
