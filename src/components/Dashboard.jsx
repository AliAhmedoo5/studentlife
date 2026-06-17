import React, { useState } from 'react';

export default function Dashboard({ data, onAddExpense, alerts }) {
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(data.categories[0]?.name || 'Food');

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Filter current month expenses
  const currentMonthExpenses = data.expenses.filter(exp => {
    const expDate = new Date(exp.date);
    return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
  });

  const totalSpent = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const remaining = Math.max(0, data.income - totalSpent);

  // Month-end Forecast calculation
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const averageDailySpend = dayOfMonth > 0 ? totalSpent / dayOfMonth : 0;
  const projectedSpend = averageDailySpend * daysInMonth;
  const projectedBalance = data.income - projectedSpend;
  const isOverprojected = projectedSpend > data.income;

  // Calculate spent per category
  const categorySpent = {};
  data.categories.forEach(c => {
    categorySpent[c.name] = 0;
  });
  currentMonthExpenses.forEach(exp => {
    if (categorySpent[exp.category] !== undefined) {
      categorySpent[exp.category] += exp.amount;
    }
  });

  const handleQuickSubmit = (e) => {
    e.preventDefault();
    if (!desc || !amount || parseFloat(amount) <= 0) return;
    
    onAddExpense({
      description: desc,
      amount: parseFloat(amount),
      category,
      date: now.toISOString().split('T')[0]
    });
    
    setDesc('');
    setAmount('');
  };

  // Helper for progress bar classes
  const getProgressColorClass = (spent, limit, threshold) => {
    const pct = limit > 0 ? (spent / limit) * 100 : 0;
    if (pct >= 100) return 'danger';
    if (pct >= threshold) return 'warning';
    return 'success';
  };

  return (
    <div className="dashboard-view">
      <div className="header-container">
        <h2 className="page-title">Personal Finance Dashboard</h2>
        <span className="badge info">{now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
      </div>

      {/* Warning Alerts Banner */}
      {alerts.length > 0 && (
        <div className="warning-section">
          {alerts.map((alert) => (
            <div key={alert.id} className="warning-banner" style={{ borderLeft: '4px solid ' + (alert.type === 'danger' ? 'var(--color-danger)' : 'var(--color-warning)') }}>
              <span>{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Top Cards Grid */}
      <div className="dashboard-grid">
        <div className="glass-card card-stat">
          <span className="stat-label">Monthly Income</span>
          <span className="stat-value income">Rs {data.income.toFixed(2)}</span>
        </div>
        <div className="glass-card card-stat">
          <span className="stat-label">Total Spent</span>
          <span className="stat-value spent">Rs {totalSpent.toFixed(2)}</span>
        </div>
        <div className="glass-card card-stat">
          <span className="stat-label">Remaining Balance</span>
          <span className="stat-value remaining">Rs {remaining.toFixed(2)}</span>
        </div>
      </div>

      <div className="dashboard-details">
        {/* Category Budget Tracker */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '1.25rem', fontWeight: 600 }}>Category Budgets</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {data.categories.map((cat) => {
              const spent = categorySpent[cat.name] || 0;
              const pct = cat.limit > 0 ? (spent / cat.limit) * 100 : 0;
              const colorClass = getProgressColorClass(spent, cat.limit, cat.threshold);
              
              return (
                <div key={cat.name} className="progress-container">
                  <div className="progress-header">
                    <span style={{ fontWeight: 500 }}>{cat.name}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Rs {spent.toFixed(2)} / Rs {cat.limit} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="progress-track">
                    <div 
                      className={`progress-fill ${colorClass}`} 
                      style={{ width: `${Math.min(100, pct)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Forecast and Quick Add */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Forecast Box */}
          <div className="glass-card">
            <h3 style={{ marginBottom: '0.75rem', fontWeight: 600 }}>Month-End Forecast</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              We project your spending speed using your average daily spend of <strong>Rs {averageDailySpend.toFixed(2)}</strong> (Day {dayOfMonth}/{daysInMonth}).
            </p>
            <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-glass)', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Projected Month-End Balance</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: isOverprojected ? 'var(--color-danger)' : 'var(--color-success)' }}>
                Rs {projectedBalance.toFixed(2)}
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
              {isOverprojected ? (
                <span style={{ color: 'var(--color-danger)' }}>
                  ⚠️ <strong>Overspending risk:</strong> At this rate, you will exceed your allowance by <strong>Rs {Math.abs(projectedBalance).toFixed(2)}</strong>. Try cutting down variable expenses.
                </span>
              ) : (
                <span style={{ color: 'var(--color-success)' }}>
                  🎉 <strong>On track!</strong> At your current rate, you will save approximately <strong>Rs {projectedBalance.toFixed(2)}</strong> this month.
                </span>
              )}
            </p>
          </div>

          {/* Quick Add Expense */}
          <div className="glass-card">
            <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>Quick Log Expense</h3>
            <form onSubmit={handleQuickSubmit}>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Starbucks Coffee"
                  value={desc} 
                  onChange={(e) => setDesc(e.target.value)} 
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Amount (Rs)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="form-input" 
                    placeholder="0.00"
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)} 
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select 
                    className="form-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {data.categories.map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>Save Expense</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
