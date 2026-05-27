import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../styles/Login.css';
import { userApi, HttpError, clearToken } from '../services/api';

interface ResetPasswordProps {
  addToast: (message: string, type: 'success' | 'error' | 'info', duration?: number) => void;
}

const ResetPassword = ({ addToast }: ResetPasswordProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // 清除现有的登录状态，确保重置密码时不会有其他用户的登录信息
    clearToken();

    if (!token) {
      addToast('无效的重置链接，缺少token', 'error');
    }
  }, [token, addToast]);

  const handleBack = () => {
    navigate('/login', { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!token) {
      addToast('无效的重置链接', 'error');
      setIsLoading(false);
      return;
    }

    if (!newPassword) {
      addToast('请输入新密码', 'error');
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      addToast('密码长度至少6位', 'error');
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      addToast('两次输入的密码不一致', 'error');
      setIsLoading(false);
      return;
    }

    try {
      await userApi.resetPassword(token, newPassword);
      setIsSuccess(true);
      addToast('密码重置成功！', 'success');
      setTimeout(() => {
        handleBack();
      }, 2000);
    } catch (err: any) {
      console.error('重置密码失败:', err);
      if (err instanceof HttpError) {
        if (err.status === 400) {
          addToast('无效或已过期的重置链接', 'error');
        } else {
          addToast(`请求失败，请稍后重试。错误码: ${err.status}`, 'error');
        }
      } else {
        addToast('网络错误，请检查网络连接后重试。', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="login-container">
        <div className="form-side" style={{ flex: 1 }}>
          <div className="login-card">
            <div className="login-header">
              <h1>链接无效</h1>
              <p>抱歉，此重置链接无效或已过期</p>
            </div>
            <button onClick={handleBack} className="login-button">
              返回登录
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="animation-side" onClick={handleBack} style={{ cursor: 'pointer' }}>
        <div className="animation-content">
          <h2>重置密码</h2>
          <p>设置您的新密码</p>
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
            <h1>{isSuccess ? '成功' : '设置新密码'}</h1>
            <p>{isSuccess ? '请使用新密码登录' : '请输入您的新密码'}</p>
          </div>

          {!isSuccess && (
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="newPassword">新密码</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="请输入新密码（至少6位）"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">确认密码</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="请再次输入新密码"
                  required
                />
              </div>

              <button
                type="submit"
                className="login-button"
                disabled={isLoading}
              >
                {isLoading ? '重置中...' : '确认重置'}
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
          )}

          {isSuccess && (
            <button onClick={handleBack} className="login-button">
              返回登录
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
