import React, { useState, useEffect } from 'react';
import { getFinanceData, saveFinanceData, checkBudgetAlerts } from './utils/storage';
import { apiCheckHealth } from './utils/api';
import Dashboard from './components/Dashboard';
import ExpenseTracker from './components/ExpenseTracker';
import BudgetSettings from './components/BudgetSettings';
import SavingsGoals from './components/SavingsGoals';
import MonthlyReport from './components/MonthlyReport';

export default function App() {
  const [data, setData] = useState(() => getFinanceData());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [alerts, setAlerts] = useState([]);
  
  // SQLite UI States
  const [isLoading, setIsLoading] = useState(true);
  const [isDbOffline, setIsDbOffline] = useState(false);
  
  // Unified Toast System
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success', icon: '' });

  const showToast = (message, type = 'success', icon = '✨') => {
    setToast({ visible: true, message, type, icon });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3500);
  };

  // Initialize and load from SQLite DB on mount
  useEffect(() => {
    const initApp = async () => {
      try {
        setIsLoading(true);
        // Ping health check to ensure backend is up
        await apiCheckHealth();

        // Fetch data from backend SQLite
        const res = await fetch('http://localhost:5000/api/finance-data');
        if (res.ok) {
          const backendData = await res.json();
          setData(backendData);
          setIsDbOffline(false);
          // Seed local storage with SQLite state
          localStorage.setItem('student_finance_data', JSON.stringify(backendData));
        } else {
          console.warn('Backend SQLite returned non-200, using localStorage fallback');
          setIsDbOffline(true);
        }
      } catch (error) {
        console.warn('Backend SQLite connection failed, using localStorage fallback:', error);
        setIsDbOffline(true);
      } finally {
        setIsLoading(false);
      }
    };
    initApp();
  }, []);

  // Listen to custom database sync status events from storage.js
  useEffect(() => {
    const handleSyncStatus = (event) => {
      const { status } = event.detail;
      if (status === 'success') {
        showToast('Synced to SQLite DB', 'success', '✨');
        setIsDbOffline(false);
      } else if (status === 'error') {
        setIsDbOffline(true);
      }
    };
    window.addEventListener('db-sync-status', handleSyncStatus);
    
    // Listen for storage decryption failures
    const handleStorageError = (event) => {
      showToast(event.detail.message, 'error', '⚠️');
    };
    window.addEventListener('storage-error', handleStorageError);

    return () => {
      window.removeEventListener('db-sync-status', handleSyncStatus);
      window.removeEventListener('storage-error', handleStorageError);
    };
  }, []);

  // Update alerts when expenses or categories change
  useEffect(() => {
    const activeAlerts = checkBudgetAlerts(data.expenses, data.categories);
    setAlerts(activeAlerts);
    setData(prev => {
      const updated = { ...prev, alerts: activeAlerts };
      saveFinanceData(updated);
      return updated;
    });
  }, [data.expenses, data.categories]);


  // --- State Updates ---

  const handleAddExpense = (newExp) => {
    const expenseRecord = {
      id: `exp-${Date.now()}`,
      ...newExp
    };
    setData(prev => {
      const updated = {
        ...prev,
        expenses: [expenseRecord, ...prev.expenses]
      };
      saveFinanceData(updated);
      return updated;
    });
  };

  const handleDeleteExpense = (id) => {
    setData(prev => {
      const updated = {
        ...prev,
        expenses: prev.expenses.filter(e => e.id !== id)
      };
      saveFinanceData(updated);
      return updated;
    });
  };

  const handleUpdateIncome = (newIncome) => {
    setData(prev => {
      const updated = {
        ...prev,
        income: newIncome
      };
      saveFinanceData(updated);
      return updated;
    });
  };

  const handleUpdateCategory = (catName, updates) => {
    setData(prev => {
      const updated = {
        ...prev,
        categories: prev.categories.map(c => 
          c.name === catName ? { ...c, ...updates } : c
        )
      };
      saveFinanceData(updated);
      return updated;
    });
  };

  const handleAddCategory = (newCat) => {
    setData(prev => {
      const updated = {
        ...prev,
        categories: [...prev.categories, newCat]
      };
      saveFinanceData(updated);
      return updated;
    });
  };

  const handleAddGoal = (newGoal) => {
    setData(prev => {
      const updated = {
        ...prev,
        savingGoals: [...prev.savingGoals, { id: `g-${Date.now()}`, ...newGoal }]
      };
      saveFinanceData(updated);
      return updated;
    });
  };

  const handleContributeGoal = (goalId, amount) => {
    setData(prev => {
      const updated = {
        ...prev,
        savingGoals: prev.savingGoals.map(g => 
          g.id === goalId ? { ...g, current: Math.max(0, g.current + amount) } : g
        )
      };
      saveFinanceData(updated);
      return updated;
    });
  };

  const handleAddChatMessage = (newMsg) => {
    setData(prev => {
      const updated = {
        ...prev,
        chatHistory: [...prev.chatHistory, newMsg]
      };
      saveFinanceData(updated);
      return updated;
    });
  };

  const handleResetData = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/reset-data', { method: 'POST' });
      if (res.ok) {
        const backendData = await res.json();
        setData(backendData);
        localStorage.setItem('student_finance_data', JSON.stringify(backendData));
        showToast('Database reset successful', 'success', '♻️');
        setActiveTab('dashboard');
        return;
      }
    } catch (error) {
      console.warn('Backend SQLite reset failed, doing local storage fallback reset:', error);
    }
    
    localStorage.removeItem('student_finance_data');
    const freshData = getFinanceData();
    setData(freshData);
    setActiveTab('dashboard');
  };


  // --- Execute AI Actionable Recommendation ---
  const handleApplyRecommendation = (actionData, type) => {
    if (!actionData) return;

    logger_debug(`Applying ${type} suggestion:`, actionData);

    if (type === 'TRANSFER_BUDGET') {
      setData(prev => {
        const updated = {
          ...prev,
          categories: prev.categories.map(c => {
            if (c.name === actionData.from) {
              return { ...c, limit: Math.max(0, c.limit - actionData.amount) };
            }
            if (c.name === actionData.to) {
              return { ...c, limit: c.limit + actionData.amount };
            }
            return c;
          })
        };
        saveFinanceData(updated);
        return updated;
      });
    } 
    
    else if (type === 'SAVINGS_OPTIMIZATION' || type === 'TRANSFER_TO_SAVINGS') {
      setData(prev => {
        const updated = {
          ...prev,
          savingGoals: prev.savingGoals.map(g => 
            g.id === actionData.goalId || g.id === actionData.toGoalId 
              ? { ...g, current: g.current + actionData.amount } 
              : g
          )
        };
        // Deduct from source category limit if it was budget transfer
        if (actionData.from) {
          updated.categories = updated.categories.map(c => 
            c.name === actionData.from ? { ...c, limit: Math.max(0, c.limit - actionData.amount) } : c
          );
        }
        saveFinanceData(updated);
        return updated;
      });
    } 
    
    else if (type === 'BUDGET_ADJUST') {
      setData(prev => {
        const updated = {
          ...prev,
          categories: prev.categories.map(c => 
            c.name === actionData.category ? { ...c, limit: c.limit + actionData.increaseAmount } : c
          )
        };
        saveFinanceData(updated);
        return updated;
      });
    }
    
    else if (type === 'CREATE_GOAL') {
      handleAddGoal({
        name: actionData.name,
        target: actionData.target,
        current: actionData.current,
        deadline: actionData.deadline
      });
    }
  };

  const logger_debug = (msg, obj) => {
    console.log(`[AgentAction] ${msg}`, obj);
  };

  // --- Render Tab Views ---
  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard data={data} onAddExpense={handleAddExpense} alerts={alerts} />;
      case 'expenses':
        return <ExpenseTracker data={data} onAddExpense={handleAddExpense} onDeleteExpense={handleDeleteExpense} showToast={showToast} />;
      case 'goals':
        return <SavingsGoals data={data} onAddGoal={handleAddGoal} onContributeGoal={handleContributeGoal} />;
      case 'report':
        return <MonthlyReport data={data} />;
      case 'settings':
        return (
          <BudgetSettings 
            data={data} 
            onUpdateIncome={handleUpdateIncome} 
            onUpdateCategory={handleUpdateCategory} 
            onAddCategory={handleAddCategory}
            onResetData={handleResetData}
          />
        );
      default:
        return <Dashboard data={data} onAddExpense={handleAddExpense} alerts={alerts} />;
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-card">
          <div className="loading-spinner"></div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Connecting to Secure SQLite Database...</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Retrieving live budgeting records</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', marginTop: '1rem' }}>
            <div className="skeleton-bar long"></div>
            <div className="skeleton-bar medium"></div>
            <div className="skeleton-bar short"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div>
          <div className="logo-section">
            <div className="logo-icon">💰</div>
            <span className="logo-title">StudentFinance</span>
          </div>

          <ul className="nav-links">
            <li className="nav-item">
              <button 
                className={`nav-button ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                📊 Dashboard
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-button ${activeTab === 'expenses' ? 'active' : ''}`}
                onClick={() => setActiveTab('expenses')}
              >
                💸 Log Expenses
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-button ${activeTab === 'goals' ? 'active' : ''}`}
                onClick={() => setActiveTab('goals')}
              >
                🎯 Savings Goals
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-button ${activeTab === 'report' ? 'active' : ''}`}
                onClick={() => setActiveTab('report')}
              >
                📈 Monthly Report
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-button ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                ⚙️ Settings
              </button>
            </li>
          </ul>
        </div>
      </aside>

      {/* Main Panel View */}
      <main className="main-content">
        {isDbOffline && (
          <div className="error-banner">
            <div className="error-banner-content">
              <span>⚠️</span>
              <span><strong>Offline Mode:</strong> Connected to browser localStorage. Backend SQLite database is offline.</span>
            </div>
            <button 
              onClick={async () => {
                try {
                  const res = await fetch('http://localhost:5000/api/finance-data');
                  if (res.ok) {
                    const backendData = await res.json();
                    setData(backendData);
                    setIsDbOffline(false);
                    showToast('Reconnected to SQLite', 'success', '🔗');
                  }
                } catch (e) {
                  console.warn('SQLite reconnect attempt failed:', e);
                }
              }}
              className="btn-apply"
              style={{ width: 'auto', padding: '0.25rem 0.75rem', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
            >
              Retry Connection
            </button>
          </div>
        )}

        {renderView()}
      </main>

      {/* Global Toast Notification */}
      {toast.visible && (
        <div className={`sync-toast ${toast.type === 'error' ? 'toast-error' : ''}`} style={toast.type === 'error' ? { background: '#ef4444', color: '#fff', border: 'none' } : toast.type === 'warning' ? { background: '#f59e0b', color: '#fff', border: 'none' } : {}}>
          <span>{toast.icon}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );

}
