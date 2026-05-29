import React, { useState, useEffect } from 'react';
import { getCurrentUserId, getUser, type User } from '../services/api';

interface Comment {
  id: number;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
}

interface CommentSectionProps {
  articleId: number;
  addToast: (message: string, type: 'success' | 'error' | 'info', duration?: number) => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({ articleId, addToast }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentUser = getUser() as User | null;
  const currentUserId = getCurrentUserId();

  useEffect(() => {
    loadComments();
  }, [articleId]);

  const loadComments = async () => {
    setIsLoading(true);
    try {
      // 模拟获取评论数据
      const mockComments: Comment[] = [
        {
          id: 1,
          userId: '1',
          userName: '技术达人',
          userAvatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20tech%20avatar&image_size=square',
          content: '这篇文章写得很好，很有深度！',
          createdAt: '2026-05-28 10:30'
        },
        {
          id: 2,
          userId: '2',
          userName: '编程小白',
          userAvatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=friendly%20developer%20avatar&image_size=square',
          content: '学习到了很多，感谢分享！',
          createdAt: '2026-05-28 11:45'
        }
      ];
      setComments(mockComments);
    } catch (error) {
      console.error('加载评论失败:', error);
      addToast('加载评论失败', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!newComment.trim()) {
      addToast('请输入评论内容', 'error');
      return;
    }

    if (!currentUserId || !currentUser) {
      addToast('请先登录', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // 模拟提交评论
      const comment: Comment = {
        id: Date.now(),
        userId: currentUserId.toString(),
        userName: currentUser.nickname || '用户',
        userAvatar: currentUser.avatar || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20portrait&image_size=square',
        content: newComment.trim(),
        createdAt: new Date().toLocaleString('zh-CN')
      };
      setComments([comment, ...comments]);
      setNewComment('');
      addToast('评论成功', 'success');
    } catch (error) {
      console.error('提交评论失败:', error);
      addToast('提交评论失败', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '未知';
    return dateString;
  };

  return (
    <div className="comment-section">
      <h3 className="comment-section-title">评论 ({comments.length})</h3>
      
      {/* 评论输入框 */}
      {currentUser && (
        <div className="comment-input-container">
          <textarea
            className="comment-input"
            placeholder="写下你的评论..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                handleSubmit();
              }
            }}
          />
          <div className="comment-actions">
            <span className="hint">Ctrl + Enter 提交</span>
            <button 
              className="comment-submit-btn"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? '提交中...' : '发表评论'}
            </button>
          </div>
        </div>
      )}

      {/* 评论列表 */}
      <div className="comments-list">
        {isLoading ? (
          <div className="loading-state">加载评论中...</div>
        ) : comments.length === 0 ? (
          <div className="empty-state">
            <p>暂无评论</p>
            <p className="hint">快来发表第一条评论吧！</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-avatar">
                <img src={comment.userAvatar} alt={comment.userName} />
              </div>
              <div className="comment-content">
                <div className="comment-header">
                  <span className="comment-author">{comment.userName}</span>
                  <span className="comment-date">{formatDate(comment.createdAt)}</span>
                </div>
                <p className="comment-text">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;