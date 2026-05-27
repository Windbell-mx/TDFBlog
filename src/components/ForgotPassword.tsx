import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';
import { userApi, HttpError } from '../services/api';

interface ForgotPasswordProps {
  addToast: (message: string, type: 'success' | 'error' | 'info', duration?: number) => void;
}

const ForgotPassword = ({ addToast }: ForgotPasswordProps) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      if (hasSubmitted) {
        return;
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [hasSubmitted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (hasSubmitted) {
      return;
    }

    if (!email) {
      addToast('请输入邮箱地址', 'error');
      return;
    }

    setIsLoading(true);
    setHasSubmitted(true);

    try {
      await userApi.forgotPassword(email);
      addToast('如果邮箱存在，重置密码链接已发送', 'success');
    } catch (err: any) {
      console.error('忘记密码请求失败:', err);
      if (err instanceof HttpError) {
        addToast(`请求失败，请稍后重试。错误码: ${err.status}`, 'error');
      } else {
        addToast('网络错误，请检查网络连接后重试。', 'error');
      }
      setHasSubmitted(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/login', { replace: true });
  };

  return (
    <div className="login-container">
      <div className="animation-side" onClick={handleBack} style={{ cursor: 'pointer' }}>
        <div className="animation-content">
          <h2>忘记密码？</h2>
          <p>没关系，我们来帮您找回</p>
          <div className="animation-elements">
            <div className="circle"></div>
            <div className="square"></div>
            <div className="triangle"></div>
          </div>
        </div>
      </div>
      <div className="form-side">
        <div className="login-card">
          <div className="login-header">
            <h1>找回密码</h1>
            <p>输入您的注册邮箱</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">邮箱</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入注册时的邮箱"
                disabled={isLoading}
                required
              />
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={isLoading || hasSubmitted}
            >
              {isLoading ? '发送中...' : (hasSubmitted ? '已发送' : '发送重置链接')}
            </button>

            <div className="login-footer">
              <p>
                想起密码了？
                <button onClick={handleBack} className="toggle-button">
                  返回登录
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
