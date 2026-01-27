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
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [userData, setUserData] = useState(null)

  // Check if user is already logged in
  useEffect(() => {
    const user = getCurrentUser()
    if (user) {
      setIsLoggedIn(true)
      setUserData(user)
    }
  }, [])

  const handleLogin = (data) => {
    setUserData(data)
    setIsLoggedIn(true)
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
        {currentPage === 'dashboard' && <Dashboard userData={userData} />}
        {currentPage === 'customers' && <CustomersTable userData={userData} />}
        {currentPage === 'reports' && <Reports userData={userData} />}
        {currentPage === 'map' && <Map userData={userData} />}
      </main>
    </div>
  )
}

export default App
