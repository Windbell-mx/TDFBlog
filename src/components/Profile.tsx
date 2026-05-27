import { useState, useRef, useEffect } from 'react';
import '../styles/Profile.css';
import { userApi, articleApi, noteApi, getUser, getCurrentUserId, clearToken, HttpError, collectionApi } from '../services/api';
import ConfirmDialog from './ConfirmDialog';
import EditArticle from './EditArticle';

interface ProfileProps {
  onBack?: () => void;
  onLogout: () => void;
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

interface Article {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  readCount: number;
  articleTitle?: string;
}

interface Collection {
  id: number;
  articleId: number;
  articleTitle?: string;
  createdAt: string;
}

const Profile: React.FC<ProfileProps> = ({ onLogout, viewedAuthor, onBack, addToast }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    nickname: '',
    gender: 'secret' as 'male' | 'female' | 'secret',
    bio: '',
    avatar: ''
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [errors, setErrors] = useState<{ nickname?: string; bio?: string }>({});
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [userArticles, setUserArticles] = useState<Article[]>([]);
  const [userNotes, setUserNotes] = useState<Article[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [articleIdToDelete, setArticleIdToDelete] = useState<number | null>(null);
  const [isEditArticleOpen, setIsEditArticleOpen] = useState(false);
  const [currentEditArticle, setCurrentEditArticle] = useState<Article | null>(null);
  const [viewingArticle, setViewingArticle] = useState<Article | null>(null);
  const [userCollections, setUserCollections] = useState<Collection[]>([]);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
    // 确定要查看的用户ID
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

    const fetchOtherData = async () => {
      if (!userId) return;

      setIsLoadingArticles(true);
      setIsLoadingCollections(true);
      try {
        const [articles, notes] = await Promise.all([
          articleApi.getArticlesByUserId(userId),
          noteApi.getNotesByUserId(userId)
        ]);

        const notesAsArticles: Article[] = notes.map(note => ({
          id: note.id,
          title: note.title,
          content: note.content,
          createdAt: note.createdAt,
          readCount: 0
        }));

        console.log('获取到的文章:', articles);
        console.log('获取到的笔记:', notes);
        setUserArticles((articles || []).map(a => ({ ...a, readCount: a.readCount || 0 })));
        setUserNotes(notesAsArticles);

        // 只获取当前用户的收藏，不获取其他用户的收藏
        if (!viewedAuthor) {
          const collections = await collectionApi.getUserCollections(userId);
          console.log('获取到的收藏:', collections);
          setUserCollections(collections || []);
          setUserInfo(prev => ({
            ...prev,
            stats: {
              ...prev.stats,
              articles: articles?.length || 0,
              collections: collections?.length || 0
            }
          }));
        } else {
          setUserCollections([]);
          setUserInfo(prev => ({
            ...prev,
            stats: {
              ...prev.stats,
              articles: articles?.length || 0,
              collections: 0
            }
          }));
        }
      } catch (error) {
        console.error('获取其他数据失败:', error);
        addToast('获取数据失败', 'error');
      } finally {
        setIsLoadingArticles(false);
        setIsLoadingCollections(false);
      }
    };

    fetchUserInfo();
    fetchOtherData();
  }, [currentUser?.id, viewedAuthor?.id, addToast]);

  const genderLabels = {
    male: '男',
    female: '女',
    secret: '保密'
  };

  const handleEditClick = () => {
    setEditForm({
      nickname: userInfo.nickname,
      gender: userInfo.gender,
      bio: userInfo.bio,
      avatar: userInfo.avatar
    });
    setErrors({});
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
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

  const handleSave = async () => {
    if (validateForm()) {
      setIsSaving(true);
      setSaveError('');

      try {
        let newAvatarUrl = editForm.avatar || userInfo.avatar;

        if (avatarFile) {
          const response = await userApi.uploadAvatar(userInfo.id, avatarFile);
          const result = await response.json();
          newAvatarUrl = result.avatar;
        }

        const updates = {
          nickname: editForm.nickname,
          gender: editForm.gender,
          bio: editForm.bio
        };

        await userApi.updateUser(userInfo.id, updates);

        setUserInfo(prev => ({
          ...prev,
          nickname: editForm.nickname,
          gender: editForm.gender,
          bio: editForm.bio,
          avatar: newAvatarUrl
        }));

        const updatedUser = {
          ...currentUser,
          nickname: editForm.nickname,
          avatar: newAvatarUrl
        };
        localStorage.setItem('tech_forum_user', JSON.stringify(updatedUser));

        setAvatarFile(null);
        setIsEditing(false);
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
    setDeleteError('');

    try {
      await userApi.deleteUser(userInfo.id);
      clearToken();
      onLogout();
    } catch (err) {
      console.error('注销账号失败:', err);
      if (err instanceof HttpError) {
        addToast(`注销失败，请稍后重试。错误码: ${err.status}`, 'error');
        setIsDeleting(false);
      } else {
        addToast('网络错误，请检查网络连接后重试。', 'error');
        setIsDeleting(false);
      }
    }
  };

  const handleCloseModal = () => {
    if (!isDeleting) {
      setIsDeleteModalOpen(false);
      setDeleteError('');
    }
  };

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

  const handleSaveEdit = async (article: { id: number; title: string; content: string; tags: string[]; category: string; permission: string }) => {
    try {
      const updateData = {
        title: article.title,
        content: article.content,
        category: article.category
      };
      console.log('发送给后端的数据:', updateData);
      console.log('文章ID:', article.id);
      await articleApi.updateArticle(article.id, updateData);
      setUserArticles(prev => prev.map(a =>
        a.id === article.id
          ? { ...a, title: article.title, content: article.content, category: article.category }
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
        <div className="article-detail-container">
          <div className="article-detail-header">
            <button className="back-button" onClick={handleBackFromArticle}>← 返回</button>
            <h1 className="article-detail-title">{viewingArticle.title || '无标题'}</h1>
            <div className="article-detail-meta">
              <span className="article-date">{formatDate(viewingArticle.createdAt)}</span>
              <span className="article-reads">👁 {viewingArticle.readCount || 0}</span>
            </div>
          </div>
          <div className="article-detail-content" dangerouslySetInnerHTML={{ __html: viewingArticle.content || '<p>无内容</p>' }} />
        </div>
      ) : (
        <>
          <main className="profile-main">
            <div className="profile-content">
              <div className="profile-left">
                <section className="profile-section">
                  <div className="section-header">
                    <span className="section-icon">📝</span>
                    <h3>我的文章</h3>
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
                              <span>{formatDate(article.createdAt)}</span>
                              <span>👁 {article.readCount || 0}</span>
                            </div>
                          </div>
                          <div className="article-actions">
                            <button className="action-button edit" onClick={(e) => { e.stopPropagation(); handleEditArticle(article); }}>编辑</button>
                            <button className="action-button delete" onClick={(e) => { e.stopPropagation(); handleDeleteArticle(article.id); }}>删除</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                <section className="profile-section">
                  <div className="section-header">
                    <span className="section-icon">📒</span>
                    <h3>我的笔记</h3>
                  </div>
                  <div className="notes-list">
                    {isLoadingArticles ? (
                      <div className="loading-state">加载中...</div>
                    ) : userNotes.length === 0 ? (
                      <div className="empty-state">
                        <p>暂无笔记</p>
                        <p className="hint">快去发布你的第一篇笔记吧！</p>
                      </div>
                    ) : (
                      userNotes.map(note => (
                        <div key={note.id} className="note-item">
                          <div className="note-info">
                            <h4>{note.title}</h4>
                            <div className="note-meta">
                              <span>{formatDate(note.createdAt)}</span>
                            </div>
                          </div>
                          <div className="note-actions">
                            <button className="action-button edit">编辑</button>
                            <button className="action-button delete">删除</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>

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
                            <button className="action-button view" onClick={() => handleViewArticle({ id: collection.articleId, title: collection.articleTitle || '无标题', content: '', createdAt: collection.createdAt, readCount: 0 })}>
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
              </div>

              <div className="profile-right">
                <section className="profile-info-card">
                  {isEditing ? (
                    <div className="edit-form">
                      <div className="edit-avatar">
                        <div className="avatar-wrapper">
                          <img src={editForm.avatar || userInfo.avatar} alt="头像" />
                          <div className="avatar-overlay" onClick={handleAvatarClick}>
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
                        <div className="edit-actions">
                          <button className="save-button" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? '保存中...' : '保存'}
                          </button>
                          <button className="cancel-button" onClick={handleCancelEdit} disabled={isSaving}>取消</button>
                        </div>
                      </div>
                    </div>
                  ) : isLoadingUser ? (
                    <div className="loading-state profile-loading">
                      <div className="loading-spinner"></div>
                      <p>加载个人信息中...</p>
                    </div>
                  ) : (
                    <>
                      {viewedAuthor && onBack && (
                        <div className="profile-header">
                          <button className="back-button" onClick={onBack}>
                            ← 返回社区
                          </button>
                        </div>
                      )}
                      <div className="profile-avatar">
                        <img src={userInfo.avatar} alt="头像" />
                        {!viewedAuthor && (
                          <div className="avatar-decoration" onClick={handleEditClick}>✎</div>
                        )}
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
                        {!viewedAuthor && (
                          <>
                            <button className="edit-profile-button" onClick={handleEditClick}>编辑资料</button>
                            <button className="delete-account-button" onClick={() => setIsDeleteModalOpen(true)}>注销账号</button>
                          </>
                        )}
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

          {isDeleteModalOpen && (
            <div className="modal-overlay" onClick={handleCloseModal}>
              <div className="modal-content delete-account-modal" onClick={(e) => e.stopPropagation()}>
                <h3>注销账号</h3>
                <p className="modal-description">
                  您确定要注销当前账号吗？此操作不可撤销，您的所有数据将被永久删除。
                </p>
                {deleteError && <div className="error-message">{deleteError}</div>}
                <div className="modal-actions">
                  <button
                    className="cancel-button"
                    onClick={handleCloseModal}
                    disabled={isDeleting}
                  >
                    取消
                  </button>
                  <button
                    className="delete-button"
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                  >
                    {isDeleting ? '注销中...' : '确认注销'}
                  </button>
                </div>
              </div>
            </div>
          )}

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
