import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Login.css';
import { userApi, HttpError } from '../services/api';

interface LoginProps {
  onLogin: () => void;
}

const Login = ({ onLogin }: LoginProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    return {
      email: savedEmail || '',
      password: '',
      confirmPassword: ''
    };
  });
  const [rememberMe, setRememberMe] = useState(() => {
    const saved = localStorage.getItem('rememberMe');
    return saved === 'true';
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // 验证表单
    if (isLogin) {
      if (!formData.email || !formData.password) {
        setError('请填写所有必填字段');
        setIsLoading(false);
        return;
      }
    } else {
      if (!formData.email || !formData.password || !formData.confirmPassword) {
        setError('请填写所有必填字段');
        setIsLoading(false);
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('两次输入的密码不一致');
        setIsLoading(false);
        return;
      }
    }

    try {
      if (isLogin) {
        // 登录
        const response = await userApi.login({
          email: formData.email,
          password: formData.password
        });
        console.log('登录成功:', response);

        // 处理记住我功能
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
          localStorage.setItem('rememberedEmail', formData.email);
        } else {
          localStorage.removeItem('rememberMe');
          localStorage.removeItem('rememberedEmail');
        }

        onLogin();
      } else {
        // 注册
        const response = await userApi.register({
          username: formData.email.split('@')[0], // 使用邮箱前缀作为用户名
          email: formData.email,
          password: formData.password
        });
        console.log('注册成功:', response);
        setSuccess('注册成功！请使用注册的邮箱和密码登录。');
        // 注册成功后自动切换到登录模式
        setTimeout(() => {
          setIsLogin(true);
          setFormData({
            email: formData.email,
            password: '',
            confirmPassword: ''
          });
          setSuccess('');
        }, 2000);
      }
    } catch (err: any) {
      console.error('认证失败:', err);
      if (err instanceof HttpError) {
        if (err.status === 409) {
          // 邮箱已被注册
          setError('该邮箱已被注册，请使用该邮箱登录或使用其他邮箱注册。');
        } else if (err.status === 401) {
          // 登录失败
          setError('邮箱或密码错误，请检查后重新输入。');
        } else {
          setError(`操作失败，请稍后重试。错误码: ${err.status}`);
        }
      } else {
        setError('网络错误，请检查网络连接后重试。');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    if (!rememberMe) {
      setFormData({
        email: '',
        password: '',
        confirmPassword: ''
      });
    } else {
      setFormData(prev => ({
        ...prev,
        password: '',
        confirmPassword: ''
      }));
    }
  };

  return (
    <div className="login-container">
      <div className="animation-side" onClick={toggleForm} style={{ cursor: 'pointer' }}>
        <div className="animation-content">
          <h2>{isLogin ? '欢迎回来' : '创建账户'}</h2>
          <p>{isLogin ? '登录以访问您的账户' : '注册新账户开始您的旅程'}</p>
          <div className="toggle-wrapper">
            <div className="toggle-track">
              <div className={`toggle-thumb ${!isLogin ? 'right' : ''}`}></div>
            </div>
            <span className="toggle-label left">登录</span>
            <span className="toggle-label right">注册</span>
          </div>
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
            <h1>{isLogin ? '登录' : '注册'}</h1>
            <p>{isLogin ? '请输入您的账户信息' : '创建新账户'}</p>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">邮箱</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="请输入邮箱"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">密码</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="请输入密码"
                required
              />
            </div>

            {!isLogin && (
              <div className="form-group">
                <label htmlFor="confirmPassword">确认密码</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="请再次输入密码"
                  required
                />
              </div>
            )}

            {isLogin && (
              <div className="form-options">
                <label className="remember-me">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  记住我
                </label>
                <Link to="/forgot-password" className="forgot-password">忘记密码？</Link>
              </div>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? (isLogin ? '登录中...' : '注册中...') : (isLogin ? '登录' : '注册')}
            </button>
          </form>

          <div className="login-footer">
            <p>
              {isLogin ? '还没有账户？' : '已有账户？'}
              <button onClick={toggleForm} className="toggle-button">
                {isLogin ? '立即注册' : '立即登录'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
