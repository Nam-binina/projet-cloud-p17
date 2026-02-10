import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Sidebar from './pages/Sidebar'
import CustomersTable from './pages/CustomersTable'
import Dashboard from './pages/Dashboard'
import Reports from './pages/Reports'
import Map from './pages/Map'
import { getCurrentUser, logoutUser } from './services/authService'
import './App.css'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentPage, setCurrentPage] = useState('map')
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [userData, setUserData] = useState(null)

  // Get default page based on user type
  const getDefaultPage = (userType) => {
    switch (userType) {
      case 'manager': return 'dashboard';
      case 'user': return 'customers';
      case 'visitor':
      default: return 'map';
    }
  };

  // Check if user is already logged in
  useEffect(() => {
    const user = getCurrentUser()
    if (user) {
      setIsLoggedIn(true)
      setUserData(user)
      setCurrentPage(getDefaultPage(user.userType))
    }
  }, [])

  const handleLogin = (data) => {
    setUserData(data)
    setIsLoggedIn(true)
    setCurrentPage(getDefaultPage(data.userType))
  }

  const handleLogout = async () => {
    await logoutUser()
    setIsLoggedIn(false)
    setUserData(null)
  }

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="app-container">
      <Sidebar 
        onMenuClick={setCurrentPage}
        expanded={sidebarExpanded}
        onToggle={() => setSidebarExpanded(!sidebarExpanded)}
        userData={userData}
        onLogout={handleLogout}
      />
      <main className={`main-content ${!sidebarExpanded ? 'expanded' : ''}`}>
        {/* Manager only: Dashboard */}
        {currentPage === 'dashboard' && userData?.userType === 'manager' && <Dashboard userData={userData} />}
        
        {/* Manager & User: Customers, Reports */}
        {currentPage === 'customers' && ['manager', 'user'].includes(userData?.userType) && <CustomersTable userData={userData} />}
        {currentPage === 'reports' && ['manager', 'user'].includes(userData?.userType) && <Reports userData={userData} />}
        
        {/* Everyone: Map */}
        {currentPage === 'map' && <Map userData={userData} />}
        
        {/* Access denied message */}
        {currentPage === 'dashboard' && userData?.userType !== 'manager' && (
          <div className="access-denied">
            <h2>🚫 Accès refusé</h2>
            <p>Vous n'avez pas la permission d'accéder au Dashboard.</p>
            <p>Rôle requis: <strong>Manager</strong></p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
