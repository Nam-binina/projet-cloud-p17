import { useState } from 'react';
import './Sidebar.css';


const Sidebar = ({ onMenuClick, expanded: propExpanded = true, onToggle, userData, onLogout }) => {
  const userType = userData?.userType || 'visitor';
  const isGuest = userData?.isGuest || false;
  const [activeMenu, setActiveMenu] = useState(
    (userType === 'visitor' || isGuest) ? 'Map' : userType === 'user' ? 'Map' : 'Dashboard'
  );

  // All menu items with role restrictions
  const allMenuItems = [
    { name: 'Dashboard', icon: '📊', link: 'dashboard', roles: ['manager'] },
    { name: 'Réparations', icon: '🔧', link: 'pricing', roles: ['manager'] },
    { name: 'Statistics', icon: '📈', link: 'statistics', roles: ['manager', 'user', 'visitor'] },
    { name: 'Users', icon: '👥', link: 'customers', roles: ['manager', 'user'] },
    { name: 'Reports', icon: '📋', link: 'reports', roles: ['manager', 'user'] },
    { name: 'Map', icon: '🗺️', link: 'map', roles: ['manager', 'user', 'visitor'] },
  ];

  // Filter menu items based on user role (visitors see Map and Statistics)
  const menuItems = allMenuItems.filter(item => {
    if (isGuest || userType === 'visitor') {
      return item.roles.includes('visitor');
    }
    return item.roles.includes(userType);
  });

  const handleMenuClick = (item) => {
    setActiveMenu(item.name);
    if (item.link && onMenuClick) {
      onMenuClick(item.link);
    }
  };

  const messages = [
    // { name: 'Erik Gunsel', avatar: '👤' },
    // { name: 'Emily Smith', avatar: '👤' },
    // { name: 'Arthur Adeik', avatar: '👤' },
  ];

  return (
    <div className={`sidebar ${propExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Header */}
      <div className="sidebar-header">
        <div className="profile-section">
          <div className="avatar">{isGuest ? '👤' : '👨‍💼'}</div>
          <div className="profile-info">
            <p className="profile-label">
              {isGuest ? 'Visiteur' : userData?.userType === 'manager' ? 'Manager' : userData?.userType === 'user' ? 'User' : 'Visitor'}
            </p>
            <p className="profile-name">
              {isGuest ? 'Mode Visiteur' : (userData?.user?.email || userData?.email || 'User')}
            </p>
          </div>
        </div>
        <button 
          className="toggle-btn"
          onClick={onToggle}
          title={propExpanded ? 'Collapse' : 'Expand'}
        >
          ⋮
        </button>
      </div>

      {/* Main Menu */}
      <div className="sidebar-main">
        <p className="section-label">MAIN</p>
        {menuItems.map((item) => (
          <div key={item.name}>
            <div 
              className={`menu-item ${activeMenu === item.name ? 'active' : ''}`}
              onClick={() => handleMenuClick(item)}
              title={item.name}
            >
              <span className="menu-icon">{item.icon}</span>
              {propExpanded && <span className="menu-label">{item.name}</span>}
            </div>
            {item.submenu && activeMenu === item.name && propExpanded && (
              <div className="submenu">
                {item.submenu.map((sub) => (
                  <div key={sub} className="submenu-item">{sub}</div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Messages Section */}
      <div className="sidebar-messages">
        <div className="section-header">
          <p className="section-label">MESSAGES</p>
          <button className="add-btn" title="Add message">+</button>
        </div>
        {messages.map((msg) => (
          <div key={msg.name} className="message-item" title={msg.name}>
            <div className="message-avatar">{msg.avatar}</div>
            {propExpanded && <span className="message-name">{msg.name}</span>}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        {/* Logout Button */}
        <button 
          className="logout-btn"
          onClick={onLogout}
          title="Logout"
        >
          <span>🚪</span> {propExpanded && 'Logout'}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;






