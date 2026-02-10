import { useState } from 'react';
import './Login.css';
import { loginUser, registerUser, isOnline } from '../services/authService';

const Login = ({ onLogin }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState('manager');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState(isOnline() ? 'online' : 'offline');

  // Listen to online/offline events
  useState(() => {
    const handleOnline = () => setConnectionStatus('online');
    const handleOffline = () => setConnectionStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegisterMode) {
        // Registration mode
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        if (password.length < 8) {
          setError('Password must be at least 8 characters long');
          setLoading(false);
          return;
        }
        
        const result = await registerUser(username, password, userType);
        if (result.success) {
          console.log('Registration successful with provider:', result.data.provider);
          onLogin(result.data);
        } else {
          setError(result.error || 'Registration failed');
        }
      } else {
        // Login mode
        const result = await loginUser(username, password, userType);
        
        if (result.success) {
          console.log('Login successful with provider:', result.data.provider);
          onLogin(result.data);
        } else {
          setError(result.error || 'Login failed');
        }
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Left side - Image */}
      <div className="login-left">
        <div className="location-pin-container">
          <svg viewBox="0 0 200 280" className="location-pin">
            <defs>
              <linearGradient id="pinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F2A444" />
                <stop offset="100%" stopColor="#F27830" />
              </linearGradient>
            </defs>
            {/* Pin shape */}
            <path
              d="M 100 10 C 140 50 170 90 170 140 C 170 190 140 250 100 280 C 60 250 30 190 30 140 C 30 90 60 50 100 10 Z"
              fill="#000"
              opacity="0.8"
            />
            {/* Inner circle */}
            <circle cx="100" cy="140" r="25" fill="url(#pinGradient)" />
          </svg>
        </div>

        {/* Connection Status Indicator */}
        <div className="connection-status">
          <span className={`status-dot ${connectionStatus}`}></span>
          <span className="status-text">
            {connectionStatus === 'online' ? '🔗 Connected (Firebase/PostgreSQL)' : '📴 Offline (PostgreSQL only)'}
          </span>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="login-right">
        <div className="login-card">
          {/* Header */}
          <div className="login-header">
            <h1>{isRegisterMode ? 'Register' : 'Login'}</h1>
            <p>{isRegisterMode ? 'Create a new account' : 'Secure authentication with Firebase & PostgreSQL'}</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form">
            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="username" className="form-label">Email</label>
              <input
                type="email"
                id="username"
                className="form-input"
                placeholder="Enter your email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                type="password"
                id="password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Confirm Password Field (Register only) */}
            {isRegisterMode && (
              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  className="form-input"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            )}

            {/* Submit Button */}
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  {isRegisterMode ? 'Registering...' : 'Logging in...'}
                </>
              ) : (
                isRegisterMode ? 'Create Account' : 'Login'
              )}
            </button>

            {/* Toggle Login/Register Link */}
            <div className="auth-toggle">
              <p>
                {isRegisterMode ? 'Already have an account? ' : "Don't have an account? "}
                <button
                  type="button"
                  className="toggle-link"
                  onClick={() => {
                    setIsRegisterMode(!isRegisterMode);
                    setError('');
                    setConfirmPassword('');
                  }}
                >
                  {isRegisterMode ? 'Login here' : 'Register here'}
                </button>
              </p>
            </div>

            {/* Visitor Access Button */}
            <div className="visitor-access-section">
              <div className="divider">
                <span>ou</span>
              </div>
              <button
                type="button"
                className="visitor-btn"
                disabled={loading}
                onClick={() => {
                  onLogin({
                    user: { email: 'visiteur@guest.com', displayName: 'Visiteur' },
                    userType: 'visitor',
                    provider: 'guest',
                    isGuest: true
                  });
                }}
              >
                <span className="visitor-icon">👤</span>
                Accéder en tant que visiteur
              </button>
            </div>
          </form>

          {/* User Type Selection */}
          {/* <div className="user-type-section">
            <p className="user-type-label">Select User Type</p>
            <div className="user-type-buttons">
              <label className="radio-option">
                <input
                  type="radio"
                  value="visitor"
                  checked={userType === 'visitor'}
                  onChange={(e) => setUserType(e.target.value)}
                  disabled={loading}
                />
                <span>Visiteur</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  value="user"
                  checked={userType === 'user'}
                  onChange={(e) => setUserType(e.target.value)}
                  disabled={loading}
                />
                <span>Utilisateur</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  value="manager"
                  checked={userType === 'manager'}
                  onChange={(e) => setUserType(e.target.value)}
                  disabled={loading}
                />
                <span>Manager</span>
              </label>
            </div>
          </div> */}

          {/* Demo Credentials */}
          <div className="demo-section">
            <p className="demo-label">Demo Credentials</p>
            <div className="demo-creds">
              <small>Email: demo@example.com</small>
              <small>Password: demo123456</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
