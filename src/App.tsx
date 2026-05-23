import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import MainPage from './components/MainPage';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import ToastManager from './components/ToastManager';
import { ThemeProvider } from './contexts/ThemeContext';
import { isAuthenticated, clearToken } from './services/api';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    setIsLoggedIn(isAuthenticated());
  }, []);

  const addToast = useCallback((message: string, type: Toast['type'] = 'info', duration = 3000) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    clearToken();
    setIsLoggedIn(false);
  };

  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="app">
          <ToastManager toasts={toasts} onClose={removeToast} />
          <Routes>
            <Route path="/login" element={
              !isLoggedIn ? <Login onLogin={handleLogin} addToast={addToast} /> : <Navigate to="/" />
            } />
            <Route path="/forgot-password" element={
              !isLoggedIn ? <ForgotPassword onBack={() => window.history.back()} addToast={addToast} /> : <Navigate to="/" />
            } />
            <Route path="/reset-password" element={
              !isLoggedIn ? <ResetPassword onBack={() => window.history.back()} addToast={addToast} /> : <Navigate to="/" />
            } />
            <Route path="/" element={
              isLoggedIn ? <MainPage onLogout={handleLogout} addToast={addToast} /> : <Navigate to="/login" />
            } />
          </Routes>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
