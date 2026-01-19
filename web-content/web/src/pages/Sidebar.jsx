import { useState } from 'react';
import './Sidebar.css';

const Sidebar = ({ onMenuClick, expanded: propExpanded = true, onToggle }) => {
  const [activeMenu, setActiveMenu] = useState('Dashboard');

  const menuItems = [
    { name: 'Dashboard', icon: '⊞', submenu: ['Activity', 'Traffic', 'Statistic'] },
    { name: 'Customers', icon: '👥', link: 'customers' },
    { name: 'Reports', icon: '📋', link: 'reports' },
    { name: 'Invoices', icon: '🧾' },
    { name: 'Wallet', icon: '💳' },
    { name: 'Notification', icon: '🔔' },
  ];

  const handleMenuClick = (item) => {
    setActiveMenu(item.name);
    if (item.link && onMenuClick) {
      onMenuClick(item.link);
    }
  };

  const messages = [
    { name: 'Erik Gunsel', avatar: '👤' },
    { name: 'Emily Smith', avatar: '👤' },
    { name: 'Arthur Adeik', avatar: '👤' },
  ];

  return (
    <div className={`sidebar ${propExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Header */}
      <div className="sidebar-header">
        <div className="profile-section">
          <div className="avatar">👤</div>
          <div className="profile-info">
            <p className="profile-label">Project Designer</p>
            <p className="profile-name">Andrew Smith</p>
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

      {/* Footer CTA */}
      <div className="sidebar-footer">
        <p className="footer-text">Let's start!</p>
        {propExpanded && <p className="footer-subtext">Creating or adding new tasks couldn't be easier</p>}
        <button className="add-task-btn">
          <span>+</span> {propExpanded && 'Add New Task'}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
