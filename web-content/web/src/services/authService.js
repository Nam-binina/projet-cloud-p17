const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3000';
  }
  return `http://${window.location.hostname}:3000`;
};

const API_URL = getApiUrl();

export const isOnline = () => {
  return navigator.onLine;
};

export const loginUser = async (email, password, userType) => {
  try {
    console.log('Logging in via backend API (hybrid Firebase/PostgreSQL)...');
    const response = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    const userData = {
      uid: data.user?.uid || data.user?.id,
      email: data.user?.email,
      userType,
      token: data.idToken || data.token,
      provider: data.provider, 
      lastLogin: new Date().toISOString()
    };

    localStorage.setItem('authData', JSON.stringify(userData));
    return { success: true, data: userData };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
};

export const registerUser = async (email, password, userType) => {
  try {
    console.log('Registering via backend API (hybrid Firebase/PostgreSQL)...');
    const response = await fetch(`${API_URL}/api/register`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error(`Registration failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    const userData = {
      uid: data.user?.uid || data.user?.id,
      email: data.user?.email,
      userType,
      token: data.idToken || data.token,
      provider: data.provider, 
      lastLogin: new Date().toISOString()
    };

    localStorage.setItem('authData', JSON.stringify(userData));
    return { success: true, data: userData };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: error.message };
  }
};


export const getCurrentUser = () => {
  const authData = localStorage.getItem('authData');
  return authData ? JSON.parse(authData) : null
};


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


export const blockUser = async (email, durationMinutes = 1440) => {
  try {
    console.log(`Blocage de l'utilisateur ${email} pour ${durationMinutes} minutes...`);
    const response = await fetch(`${API_URL}/api/users/block`, {
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


export const unblockUser = async (email) => {
  try {
    console.log(`Déblocage de l'utilisateur ${email}...`);
    const response = await fetch(`${API_URL}/api/users/unblock`, {
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


export const setupConnectivityListener = (onOnline, onOffline) => {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
};