import { useEffect, useMemo, useState } from 'react';
import './Dashboard.css';

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

const Dashboard = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState('Never');
  const [syncResult, setSyncResult] = useState(null);
  const [syncError, setSyncError] = useState(null);
  const [signalements, setSignalements] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const response = await fetch(`${API_URL}/api/sync`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = payload?.error || response.statusText;
        throw new Error(`Sync failed: ${message}`);
      }

      const data = payload;
      setSyncResult(data.data);
      setLastSync(new Date().toLocaleString());
    } catch (error) {
      console.error('Sync error:', error);
      setSyncError(error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      setIsLoadingData(true);
      try {
        const [signalementsResponse, usersResponse] = await Promise.all([
          fetch(`${API_URL}/api/signalements`),
          fetch(`${API_URL}/api/users`)
        ]);

        const signalementsPayload = signalementsResponse.ok
          ? await signalementsResponse.json()
          : { signalements: [] };
        const usersPayload = usersResponse.ok
          ? await usersResponse.json()
          : { users: [] };

        if (isMounted) {
          setSignalements(Array.isArray(signalementsPayload.signalements) ? signalementsPayload.signalements : []);
          setUsers(Array.isArray(usersPayload.users) ? usersPayload.users : []);
        }
      } catch (error) {
        console.error('Erreur chargement dashboard:', error);
        if (isMounted) {
          setSignalements([]);
          setUsers([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingData(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const { totalRevenue, activeUsers, totalSignalements, resolvedSignalements } = useMemo(() => {
    const totalRevenueValue = signalements.reduce((sum, item) => {
      const budget = Number(item.budget);
      return Number.isFinite(budget) ? sum + budget : sum;
    }, 0);

    const activeUsersValue = users.filter(user => {
      if (user.disabled) {
        return false;
      }

      const lastSignIn = user.lastSignInTime || user.last_login || user.lastLogin;
      if (!lastSignIn) {
        return false;
      }

      const lastSignInDate = new Date(lastSignIn);
      if (Number.isNaN(lastSignInDate.getTime())) {
        return false;
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return lastSignInDate >= thirtyDaysAgo;
    }).length;

    const resolvedStatuses = new Set(['termine', 'resolved', 'closed', 'done']);
    const resolvedCount = signalements.filter(item =>
      resolvedStatuses.has(String(item.status || '').toLowerCase())
    ).length;

    return {
      totalRevenue: totalRevenueValue,
      activeUsers: activeUsersValue,
      totalSignalements: signalements.length,
      resolvedSignalements: resolvedCount
    };
  }, [signalements, users]);

  const monthlySignalements = useMemo(() => {
    const buckets = new Map();
    signalements.forEach(item => {
      if (!item.date) {
        return;
      }
      const date = new Date(item.date);
      if (Number.isNaN(date.getTime())) {
        return;
      }
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      buckets.set(key, (buckets.get(key) || 0) + 1);
    });

    const sortedKeys = Array.from(buckets.keys()).sort();
    const lastKeys = sortedKeys.slice(-6);
    return lastKeys.map(key => {
      const [year, month] = key.split('-');
      return {
        key,
        label: new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('fr-FR', { month: 'short' }),
        value: buckets.get(key) || 0
      };
    });
  }, [signalements]);

  const budgetByType = useMemo(() => {
    const totals = new Map();
    signalements.forEach(item => {
      const rawType = item.type || item.status || 'Autre';
      const type = String(rawType).trim() || 'Autre';
      const budget = Number(item.budget);
      const safeBudget = Number.isFinite(budget) ? budget : 0;
      totals.set(type, (totals.get(type) || 0) + safeBudget);
    });

    const entries = Array.from(totals.entries())
      .map(([type, budget]) => ({ type, budget }))
      .sort((a, b) => b.budget - a.budget);

    if (entries.length > 4) {
      const top = entries.slice(0, 4);
      const restTotal = entries.slice(4).reduce((sum, item) => sum + item.budget, 0);
      if (restTotal > 0) {
        top.push({ type: 'Autres', budget: restTotal });
      }
      return top;
    }

    return entries;
  }, [signalements]);

  const statusBreakdown = useMemo(() => {
    const totals = new Map();
    signalements.forEach(item => {
      const status = String(item.status || 'Autre').toLowerCase();
      totals.set(status, (totals.get(status) || 0) + 1);
    });
    return Array.from(totals.entries()).map(([status, count]) => ({ status, count }));
  }, [signalements]);

  const hasData = !isLoadingData && (signalements.length > 0 || users.length > 0);

  const formatCurrency = (value) => new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'MGA',
    maximumFractionDigits: 0
  }).format(value || 0);

  const formatNumber = (value) => new Intl.NumberFormat('fr-FR').format(value || 0);

  const budgetTotal = budgetByType.reduce((sum, item) => sum + item.budget, 0);
  const pieColors = ['#F2A444', '#F27830', '#BE9086', '#A62C21', '#401511'];
  const pieSegments = budgetByType.map((item, index) => {
    const percentage = budgetTotal > 0 ? (item.budget / budgetTotal) * 100 : 0;
    const circumference = 2 * Math.PI * 80;
    const dash = (percentage / 100) * circumference;
    const offset = budgetByType.slice(0, index).reduce((sum, prev) => {
      const prevPercentage = budgetTotal > 0 ? (prev.budget / budgetTotal) * 100 : 0;
      return sum + (prevPercentage / 100) * circumference;
    }, 0);

    return {
      ...item,
      percentage,
      dash,
      offset: -offset,
      color: pieColors[index % pieColors.length]
    };
  });

  const monthlyMax = monthlySignalements.reduce((max, item) => Math.max(max, item.value), 0) || 1;
  const monthlyMid = Math.ceil(monthlyMax / 2);
  const monthlyPoints = monthlySignalements.map((item, index) => {
    const xStart = 60;
    const xEnd = 360;
    const yTop = 30;
    const yBottom = 170;
    const xStep = monthlySignalements.length > 1 ? (xEnd - xStart) / (monthlySignalements.length - 1) : 0;
    const x = xStart + xStep * index;
    const y = yBottom - (item.value / monthlyMax) * (yBottom - yTop);
    return `${x},${y}`;
  }).join(' ');

  const statusMax = statusBreakdown.reduce((max, item) => Math.max(max, item.count), 0) || 1;
  const recentSignalements = signalements.slice(0, 4);

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

      {/* Sync Result/Error */}
      {syncError && (
        <div className="sync-alert error">
          ❌ Sync Error: {syncError}
        </div>
      )}
      {syncResult && (
        <div className="sync-alert success">
          ✅ Sync completed! 
          <span> Firebase → PostgreSQL: {syncResult.firebase_to_pg?.created || 0} created, {syncResult.firebase_to_pg?.updated || 0} updated</span>
          <span> | PostgreSQL → Firebase: {syncResult.pg_to_firebase?.created || 0} created, {syncResult.pg_to_firebase?.updated || 0} updated</span>
          {syncResult.signalements && (
            <span> | Signalements: {syncResult.signalements.created || 0} created, {syncResult.signalements.updated || 0} updated</span>
          )}
          {syncResult.photos && (
            <span> | Photos: {syncResult.photos.synced || 0} synced, {syncResult.photos.skipped || 0} skipped</span>
          )}
        </div>
      )}

      {hasData && (
        <>
          {/* KPIs */}
          <div className="kpis-section">
            <div className="kpi-card">
              <div className="kpi-icon">📊</div>
              <div className="kpi-content">
                <p className="kpi-label">Total Revenue</p>
                <p className="kpi-value">{formatCurrency(totalRevenue)}</p>
                <p className="kpi-change">Budget total des signalements</p>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon">👥</div>
              <div className="kpi-content">
                <p className="kpi-label">Active Users</p>
                <p className="kpi-value">{formatNumber(activeUsers)}</p>
                <p className="kpi-change">30 derniers jours</p>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon">🧾</div>
              <div className="kpi-content">
                <p className="kpi-label">Total Signalements</p>
                <p className="kpi-value">{formatNumber(totalSignalements)}</p>
                <p className="kpi-change">Tous statuts</p>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon">✅</div>
              <div className="kpi-content">
                <p className="kpi-label">Signalements Résolus</p>
                <p className="kpi-value">{formatNumber(resolvedSignalements)}</p>
                <p className="kpi-change">Terminé / Closed</p>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="charts-grid">
            {signalements.length > 0 && monthlySignalements.length > 0 && (
              <div className="chart-card">
                <h3>Signalements par mois</h3>
                <div className="chart-container">
                  <svg viewBox="0 0 400 200" className="chart-svg">
                    <line x1="50" y1="20" x2="50" y2="180" stroke="#ddd" strokeWidth="1" />
                    <line x1="50" y1="180" x2="380" y2="180" stroke="#ddd" strokeWidth="1" />

                    <text x="45" y="185" fontSize="10" textAnchor="end" fill="#999">0</text>
                    <text x="45" y="110" fontSize="10" textAnchor="end" fill="#999">{monthlyMid}</text>
                    <text x="45" y="35" fontSize="10" textAnchor="end" fill="#999">{monthlyMax}</text>

                    <line x1="50" y1="110" x2="380" y2="110" stroke="#f0f0f0" strokeWidth="1" />
                    <line x1="50" y1="35" x2="380" y2="35" stroke="#f0f0f0" strokeWidth="1" />

                    <polyline
                      points={monthlyPoints}
                      fill="none"
                      stroke="#F2A444"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {monthlySignalements.map((item, index) => {
                      const xStart = 60;
                      const xEnd = 360;
                      const yTop = 30;
                      const yBottom = 170;
                      const xStep = monthlySignalements.length > 1 ? (xEnd - xStart) / (monthlySignalements.length - 1) : 0;
                      const x = xStart + xStep * index;
                      const y = yBottom - (item.value / monthlyMax) * (yBottom - yTop);
                      return (
                        <circle key={item.key} cx={x} cy={y} r="4" fill="#F2A444" />
                      );
                    })}

                    {monthlySignalements.map((item, index) => {
                      const xStart = 60;
                      const xEnd = 360;
                      const xStep = monthlySignalements.length > 1 ? (xEnd - xStart) / (monthlySignalements.length - 1) : 0;
                      const x = xStart + xStep * index;
                      return (
                        <text key={`${item.key}-label`} x={x} y="195" fontSize="10" textAnchor="middle" fill="#999">
                          {item.label}
                        </text>
                      );
                    })}
                  </svg>
                </div>
              </div>
            )}

            {signalements.length > 0 && budgetByType.length > 0 && (
              <div className="chart-card">
                <h3>Budget par type de signalement</h3>
                <div className="pie-chart">
                  <svg viewBox="0 0 200 200" className="pie-svg">
                    {pieSegments.map(segment => (
                      <circle
                        key={segment.type}
                        cx="100"
                        cy="100"
                        r="80"
                        fill="none"
                        stroke={segment.color}
                        strokeWidth="20"
                        strokeDasharray={`${segment.dash} ${2 * Math.PI * 80}`}
                        strokeDashoffset={segment.offset}
                      />
                    ))}
                  </svg>
                  <div className="pie-legend">
                    {pieSegments.map(segment => (
                      <div className="legend-item" key={`${segment.type}-legend`}>
                        <span className="legend-color" style={{ backgroundColor: segment.color }}></span>
                        <span>{segment.type} ({segment.percentage.toFixed(0)}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {signalements.length > 0 && statusBreakdown.length > 0 && (
              <div className="chart-card">
                <h3>Signalements par statut</h3>
                <div className="chart-container">
                  <svg viewBox="0 0 400 200" className="chart-svg">
                    <line x1="40" y1="20" x2="40" y2="180" stroke="#ddd" strokeWidth="1" />
                    <line x1="40" y1="180" x2="390" y2="180" stroke="#ddd" strokeWidth="1" />
                    {statusBreakdown.map((item, index) => {
                      const barWidth = 28;
                      const gap = 18;
                      const x = 60 + index * (barWidth + gap);
                      const height = (item.count / statusMax) * 140;
                      const y = 180 - height;
                      return (
                        <g key={item.status}>
                          <rect x={x} y={y} width={barWidth} height={height} fill="#F2A444" opacity="0.8" />
                          <text x={x + barWidth / 2} y="195" fontSize="10" textAnchor="middle" fill="#999">
                            {item.status}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
            )}

            {signalements.length > 0 && (
              <div className="chart-card">
                <h3>Derniers signalements</h3>
                <div className="activity-list">
                  {recentSignalements.map(item => (
                    <div className="activity-item" key={item.id || item.date || item.descriptiotn || item.description || item.title}>
                      <div className="activity-icon">📝</div>
                      <div className="activity-content">
                        <p className="activity-title">{item.descriptiotn || item.description || item.title || 'Signalement'}</p>
                        <p className="activity-time">
                          {item.date ? new Date(item.date).toLocaleString('fr-FR') : 'Date inconnue'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
