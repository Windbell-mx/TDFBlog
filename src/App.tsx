import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import MainPage from './components/MainPage';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import { isAuthenticated, clearToken } from './services/api';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(isAuthenticated());
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    clearToken();
    setIsLoggedIn(false);
  };

  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/login" element={
            !isLoggedIn ? <Login onLogin={handleLogin} /> : <Navigate to="/" />
          } />
          <Route path="/forgot-password" element={
            !isLoggedIn ? <ForgotPassword onBack={() => window.history.back()} /> : <Navigate to="/" />
          } />
          <Route path="/reset-password" element={
            !isLoggedIn ? <ResetPassword onBack={() => window.history.back()} /> : <Navigate to="/" />
          } />
          <Route path="/" element={
            isLoggedIn ? <MainPage onLogout={handleLogout} /> : <Navigate to="/login" />
          } />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;