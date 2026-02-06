import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Sidebar from './pages/Sidebar'
import CustomersTable from './pages/CustomersTable'
import Dashboard from './pages/Dashboard'
import Reports from './pages/Reports'
import Map from './pages/Map'
import Statistics from './pages/Statistics'
import { getCurrentUser, logoutUser } from './services/authService'
import './App.css'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentPage, setCurrentPage] = useState('map')
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [userData, setUserData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Get default page based on user type
  const getDefaultPage = (userType, isGuest) => {
    if (isGuest || userType === 'visitor') return 'map';
    switch (userType) {
      case 'manager': return 'dashboard';
      case 'user': return 'map';
      default: return 'map';
    }
  };

  // Check if user is already logged in
  useEffect(() => {
    const user = getCurrentUser()
    const authMode = localStorage.getItem('authMode')
    
    if (user) {
      setIsLoggedIn(true)
      setUserData(user)
      setCurrentPage(getDefaultPage(user.userType, user.isGuest))
    } else if (authMode === 'visitor') {
      // Restaurer le mode visiteur depuis localStorage
      const visitorData = {
        user: { email: 'visiteur@guest.local', displayName: 'Visiteur' },
        userType: 'visitor',
        provider: 'guest',
        isGuest: true
      };
      setIsLoggedIn(true)
      setUserData(visitorData)
      setCurrentPage('map')
    }
    setIsLoading(false)
  }, [])

  // Restauration visiteur au refresh
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser)
        if (parsed.isGuest) {
          setIsLoggedIn(true)
          setUserData(parsed)
          setCurrentPage('map')
        }
      } catch (e) {
        console.error('Error parsing saved user:', e)
      }
    }
  }, [])

  // Vérifier le localStorage au démarrage
  useEffect(() => {
    const savedUser = localStorage.getItem('userData');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      // Si c'est un visiteur et vous voulez forcer le login, décommentez :
      // if (parsed.isGuest) {
      //   localStorage.removeItem('userData');
      //   return;
      // }
      setUserData(parsed);
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = (data) => {
    setUserData(data)
    setIsLoggedIn(true)
    localStorage.setItem('userData', JSON.stringify(data))
    
    // Sauvegarder en localStorage pour persistance
    if (data.isGuest) {
      localStorage.setItem('authMode', 'visitor')
      localStorage.setItem('currentUser', JSON.stringify(data))
    }
    
    setCurrentPage(getDefaultPage(data.userType, data.isGuest))
  }

  const handleLogout = async () => {
    await logoutUser()
    localStorage.removeItem('authMode')
    localStorage.removeItem('currentUser')
    localStorage.removeItem('authData')
    setIsLoggedIn(false)
    setUserData(null)
    setCurrentPage('map')
  }

  const handleMenuClick = (page) => {
    // Vérifier les permissions avant de changer de page
    const isManager = userData?.userType === 'manager';
    const isVisitor = userData?.userType === 'visitor' || userData?.isGuest;
    
    // Pages réservées aux managers
    if (page === 'dashboard' && !isManager) {
      return; // Ne pas changer de page
    }
    
    // Pages interdites aux visiteurs
    if (['customers', 'reports'].includes(page) && isVisitor) {
      return;
    }
    
    setCurrentPage(page)
  }

  // Render current page
  const renderPage = () => {
    const isManager = userData?.userType === 'manager';
    const isVisitor = userData?.userType === 'visitor' || userData?.isGuest;

    switch (currentPage) {
      case 'dashboard':
        if (!isManager) {
          return (
            <div className="access-denied">
              <h2>🔒 Accès refusé</h2>
              <p>Vous n'avez pas la permission d'accéder au Dashboard.</p>
              <p>Rôle requis: <strong>Manager</strong></p>
            </div>
          );
        }
        return <Dashboard />;
      
      case 'statistics':
        return <Statistics userData={userData} />;
      
      case 'customers':
        if (isVisitor) {
          return <Map userData={userData} />;
        }
        return <CustomersTable userData={userData} />;
      
      case 'reports':
        if (isVisitor) {
          return <Map userData={userData} />;
        }
        return <Reports />;
      
      case 'map':
      default:
        return <Map userData={userData} />;
    }
  }

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="app-container">
      <Sidebar
        onMenuClick={handleMenuClick}
        expanded={sidebarExpanded}
        onToggle={() => setSidebarExpanded(!sidebarExpanded)}
        userData={userData}
        onLogout={handleLogout}
      />
      <main className={`main-content ${sidebarExpanded ? '' : 'expanded'}`}>
        {renderPage()}
      </main>
    </div>
  )
}

export default App