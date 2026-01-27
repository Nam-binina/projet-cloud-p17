import { useState } from 'react';
import './Dashboard.css';

const Dashboard = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState('2 hours ago');

  const handleSync = async () => {
    setIsSyncing(true);
    // Simulation de synchronisation
    setTimeout(() => {
      setLastSync('Just now');
      setIsSyncing(false);
    }, 2000);
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>Dashboard</h1>
          <p>Welcome back! Here's your performance overview.</p>
        </div>
        <button 
          className={`sync-btn ${isSyncing ? 'syncing' : ''}`}
          onClick={handleSync}
          disabled={isSyncing}
        >
          <span className="sync-icon">🔄</span>
          {isSyncing ? 'Syncing...' : 'Synchronize'}
        </button>
      </div>

      {/* Last Sync Info */}
      <div className="sync-info">
        Last synchronized: <strong>{lastSync}</strong>
      </div>

      {/* KPIs */}
      <div className="kpis-section">
        <div className="kpi-card">
          <div className="kpi-icon">📊</div>
          <div className="kpi-content">
            <p className="kpi-label">Total Revenue</p>
            <p className="kpi-value">$124,500</p>
            <p className="kpi-change positive">↑ 12.5% from last month</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">👥</div>
          <div className="kpi-content">
            <p className="kpi-label">Active Users</p>
            <p className="kpi-value">2,453</p>
            <p className="kpi-change positive">↑ 8.2% from last month</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">📈</div>
          <div className="kpi-content">
            <p className="kpi-label">Conversion Rate</p>
            <p className="kpi-value">3.24%</p>
            <p className="kpi-change positive">↑ 1.5% from last month</p>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">⚡</div>
          <div className="kpi-content">
            <p className="kpi-label">Performance</p>
            <p className="kpi-value">98.5%</p>
            <p className="kpi-change negative">↓ 0.3% from last month</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        {/* Revenue Chart */}
        <div className="chart-card">
          <h3>Revenue Trend</h3>
          <div className="chart-container">
            <svg viewBox="0 0 400 200" className="chart-svg">
              {/* Grid */}
              <line x1="40" y1="20" x2="40" y2="180" stroke="#ddd" strokeWidth="1" />
              <line x1="40" y1="180" x2="390" y2="180" stroke="#ddd" strokeWidth="1" />
              
              {/* Y axis labels */}
              <text x="35" y="185" fontSize="10" textAnchor="end" fill="#999">0</text>
              <text x="35" y="135" fontSize="10" textAnchor="end" fill="#999">50k</text>
              <text x="35" y="85" fontSize="10" textAnchor="end" fill="#999">100k</text>
              <text x="35" y="35" fontSize="10" textAnchor="end" fill="#999">150k</text>

              {/* Grid lines */}
              <line x1="40" y1="130" x2="390" y2="130" stroke="#f0f0f0" strokeWidth="1" />
              <line x1="40" y1="80" x2="390" y2="80" stroke="#f0f0f0" strokeWidth="1" />
              <line x1="40" y1="30" x2="390" y2="30" stroke="#f0f0f0" strokeWidth="1" />

              {/* Data line */}
              <polyline
                points="70,120 120,90 170,70 220,95 270,60 320,85 370,45"
                fill="none"
                stroke="#F2A444"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              <circle cx="70" cy="120" r="4" fill="#F2A444" />
              <circle cx="120" cy="90" r="4" fill="#F2A444" />
              <circle cx="170" cy="70" r="4" fill="#F2A444" />
              <circle cx="220" cy="95" r="4" fill="#F2A444" />
              <circle cx="270" cy="60" r="4" fill="#F2A444" />
              <circle cx="320" cy="85" r="4" fill="#F2A444" />
              <circle cx="370" cy="45" r="4" fill="#F2A444" />

              {/* X axis labels */}
              <text x="70" y="195" fontSize="10" textAnchor="middle" fill="#999">Jan</text>
              <text x="120" y="195" fontSize="10" textAnchor="middle" fill="#999">Feb</text>
              <text x="170" y="195" fontSize="10" textAnchor="middle" fill="#999">Mar</text>
              <text x="220" y="195" fontSize="10" textAnchor="middle" fill="#999">Apr</text>
              <text x="270" y="195" fontSize="10" textAnchor="middle" fill="#999">May</text>
              <text x="320" y="195" fontSize="10" textAnchor="middle" fill="#999">Jun</text>
              <text x="370" y="195" fontSize="10" textAnchor="middle" fill="#999">Jul</text>
            </svg>
          </div>
        </div>

        {/* User Growth */}
        <div className="chart-card">
          <h3>User Growth</h3>
          <div className="chart-container">
            <svg viewBox="0 0 400 200" className="chart-svg">
              {/* Grid */}
              <line x1="40" y1="20" x2="40" y2="180" stroke="#ddd" strokeWidth="1" />
              <line x1="40" y1="180" x2="390" y2="180" stroke="#ddd" strokeWidth="1" />

              {/* Bar chart */}
              <rect x="60" y="110" width="30" height="70" fill="#F2A444" opacity="0.8" />
              <rect x="105" y="95" width="30" height="85" fill="#F2A444" opacity="0.8" />
              <rect x="150" y="80" width="30" height="100" fill="#F2A444" opacity="0.8" />
              <rect x="195" y="65" width="30" height="115" fill="#F27830" opacity="0.8" />
              <rect x="240" y="50" width="30" height="130" fill="#F27830" opacity="0.8" />
              <rect x="285" y="35" width="30" height="145" fill="#F27830" opacity="0.8" />
              <rect x="330" y="20" width="30" height="160" fill="#F27830" opacity="0.8" />

              {/* Labels */}
              <text x="75" y="195" fontSize="10" textAnchor="middle" fill="#999">W1</text>
              <text x="120" y="195" fontSize="10" textAnchor="middle" fill="#999">W2</text>
              <text x="165" y="195" fontSize="10" textAnchor="middle" fill="#999">W3</text>
              <text x="210" y="195" fontSize="10" textAnchor="middle" fill="#999">W4</text>
              <text x="255" y="195" fontSize="10" textAnchor="middle" fill="#999">W5</text>
              <text x="300" y="195" fontSize="10" textAnchor="middle" fill="#999">W6</text>
              <text x="345" y="195" fontSize="10" textAnchor="middle" fill="#999">W7</text>
            </svg>
          </div>
        </div>

        {/* Sales by Category */}
        <div className="chart-card">
          <h3>Sales by Category</h3>
          <div className="pie-chart">
            <svg viewBox="0 0 200 200" className="pie-svg">
              {/* Electronics - 35% */}
              <circle cx="100" cy="100" r="80" fill="none" stroke="#F2A444" strokeWidth="20" 
                strokeDasharray="175.93 502.65" strokeDashoffset="0" />
              
              {/* Clothing - 25% */}
              <circle cx="100" cy="100" r="80" fill="none" stroke="#F27830" strokeWidth="20" 
                strokeDasharray="125.66 502.65" strokeDashoffset="-175.93" />
              
              {/* Food - 20% */}
              <circle cx="100" cy="100" r="80" fill="none" stroke="#BE9086" strokeWidth="20" 
                strokeDashoffset="-301.59" strokeDasharray="100.53 502.65" />
              
              {/* Other - 20% */}
              <circle cx="100" cy="100" r="80" fill="none" stroke="#A62C21" strokeWidth="20" 
                strokeDashoffset="-402.12" strokeDasharray="100.53 502.65" />
            </svg>
            <div className="pie-legend">
              <div className="legend-item">
                <span className="legend-color" style={{backgroundColor: '#F2A444'}}></span>
                <span>Electronics (35%)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{backgroundColor: '#F27830'}}></span>
                <span>Clothing (25%)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{backgroundColor: '#BE9086'}}></span>
                <span>Food (20%)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{backgroundColor: '#A62C21'}}></span>
                <span>Other (20%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="chart-card">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon">📝</div>
              <div className="activity-content">
                <p className="activity-title">New order received</p>
                <p className="activity-time">2 hours ago</p>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">👤</div>
              <div className="activity-content">
                <p className="activity-title">New customer signed up</p>
                <p className="activity-time">4 hours ago</p>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">💳</div>
              <div className="activity-content">
                <p className="activity-title">Payment processed</p>
                <p className="activity-time">6 hours ago</p>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">📦</div>
              <div className="activity-content">
                <p className="activity-title">Shipment shipped</p>
                <p className="activity-time">1 day ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
