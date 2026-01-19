import { useState } from 'react';
import './Login.css';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('visitor');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Pour le moment, just call onLogin
    onLogin();
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
      </div>

      {/* Right side - Login Form */}
      <div className="login-right">
        <div className="login-card">
          {/* Header */}
          <div className="login-header">
            <h1>Login</h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form">
            {/* Username Field */}
            <div className="form-group">
              <label htmlFor="username" className="form-label">Username</label>
              <input
                type="text"
                id="username"
                className="form-input"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
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
              />
            </div>

            {/* Submit Button */}
            <button type="submit" className="submit-btn">
              Submit
            </button>
          </form>

          {/* User Type Selection */}
          <div className="user-type-section">
            <p className="user-type-label">Visiteur</p>
            <div className="user-type-buttons">
              <label className="radio-option">
                <input
                  type="radio"
                  value="visitor"
                  checked={userType === 'visitor'}
                  onChange={(e) => setUserType(e.target.value)}
                />
                <span>Visiteur</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  value="user"
                  checked={userType === 'user'}
                  onChange={(e) => setUserType(e.target.value)}
                />
                <span>Utilisateur</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  value="manager"
                  checked={userType === 'manager'}
                  onChange={(e) => setUserType(e.target.value)}
                />
                <span>Manager</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
