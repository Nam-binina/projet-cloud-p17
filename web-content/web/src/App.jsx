import { useState } from 'react'
import Login from './pages/Login'
import Sidebar from './pages/Sidebar'
import CustomersTable from './pages/CustomersTable'
import Dashboard from './pages/Dashboard'
import Reports from './pages/Reports'
import './App.css'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [sidebarExpanded, setSidebarExpanded] = useState(true)

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />
  }

  return (
    <div className="app-container">
      <Sidebar 
        onMenuClick={setCurrentPage}
        expanded={sidebarExpanded}
        onToggle={() => setSidebarExpanded(!sidebarExpanded)}
      />
      <main className={`main-content ${!sidebarExpanded ? 'expanded' : ''}`}>
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'customers' && <CustomersTable />}
        {currentPage === 'reports' && <Reports />}
      </main>
    </div>
  )
}

export default App
