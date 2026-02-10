// All authentication is handled via backend API
// No client-side Firebase needed - backend manages hybrid Firebase/PostgreSQL auth

// Determine API URL based on environment
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // In development (Vite), use localhost:3000
  // In production/Docker, the web and auth-api are on the same network
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3000';
  }
  // In Docker, use the service name and port 80 (reverse proxy assumed)
  return `http://${window.location.hostname}:3000`;
};

const API_URL = getApiUrl();

/**
 * Check if user has internet connection
 */
export const isOnline = () => {
  return navigator.onLine;
};

/**
 * Login with backend API (Firebase or PostgreSQL, handled server-side)
 */
export const loginUser = async (email, password, userType) => {
  try {
    console.log('Logging in via backend API (hybrid Firebase/PostgreSQL)...');
    const response = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Backend returns either Firebase or PostgreSQL result
    const userData = {
      uid: data.user?.uid || data.user?.id,
      email: data.user?.email,
      userType,
      token: data.idToken || data.token,
      provider: data.provider, // 'firebase' or 'postgresql'
      lastLogin: new Date().toISOString()
    };

    localStorage.setItem('authData', JSON.stringify(userData));
    return { success: true, data: userData };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Register new user via backend API (hybrid Firebase/PostgreSQL)
 */
export const registerUser = async (email, password, userType) => {
  try {
    console.log('Registering via backend API (hybrid Firebase/PostgreSQL)...');
    const response = await fetch(`${API_URL}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error(`Registration failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Backend returns either Firebase or PostgreSQL result
    const userData = {
      uid: data.user?.uid || data.user?.id,
      email: data.user?.email,
      userType,
      token: data.idToken || data.token,
      provider: data.provider, // 'firebase' or 'postgresql'
      lastLogin: new Date().toISOString()
    };

    localStorage.setItem('authData', JSON.stringify(userData));
    return { success: true, data: userData };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = () => {
  const authData = localStorage.getItem('authData');
  return authData ? JSON.parse(authData) : null
};

/**
 * Logout user
 */
export const logoutUser = async () => {
  try {
    localStorage.removeItem('authData');
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    localStorage.removeItem('authData');
    return { success: true };
  }
};

/**
 * Validate token
 */
export const validateToken = async (token) => {
  try {
    const response = await fetch(`${API_URL}/auth/validate`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.ok;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};

/**
 * Get all users
 */
export const getAllUsers = async () => {
  try {
    const response = await fetch(`${API_URL}/api/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des utilisateurs: ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, data: data.users || [] };
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Block a user by email
 */
export const blockUser = async (email, durationMinutes = 1440) => {
  try {
    console.log(`Blocage de l'utilisateur ${email} pour ${durationMinutes} minutes...`);
    const response = await fetch(`${API_URL}/api/firebase/block-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, durationMinutes })
    });

    if (!response.ok) {
      throw new Error(`Erreur lors du blocage: ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Erreur lors du blocage de l\'utilisateur:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Unblock a user by email
 */
export const unblockUser = async (email) => {
  try {
    console.log(`Déblocage de l'utilisateur ${email}...`);
    const response = await fetch(`${API_URL}/api/firebase/unblock-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      throw new Error(`Erreur lors du déblocage: ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Erreur lors du déblocage de l\'utilisateur:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Listen to online/offline events
 */
export const setupConnectivityListener = (onOnline, onOffline) => {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
};
