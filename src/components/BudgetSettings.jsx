import React, { useState } from 'react';

export default function BudgetSettings({ data, onUpdateIncome, onUpdateCategory, onAddCategory, onResetData }) {
  const [income, setIncome] = useState(data.income);
  const [newCatName, setNewCatName] = useState('');
  const [newCatLimit, setNewCatLimit] = useState('');
  const [newCatThreshold, setNewCatThreshold] = useState('80');
  const [statusMsg, setStatusMsg] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleIncomeSubmit = (e) => {
    e.preventDefault();
    if (parseFloat(income) <= 0) return;
    onUpdateIncome(parseFloat(income));
    showStatus('Monthly income updated successfully!');
  };

  const handleCategoryChange = (name, field, value) => {
    let parsedVal = parseFloat(value);
    if (isNaN(parsedVal)) parsedVal = 0;
    onUpdateCategory(name, { [field]: parsedVal });
  };

  const handleAddCategorySubmit = (e) => {
    e.preventDefault();
    if (!newCatName || !newCatLimit || parseFloat(newCatLimit) <= 0) return;
    
    // Check for duplicates
    if (data.categories.some(c => c.name.toLowerCase() === newCatName.trim().toLowerCase())) {
      alert('This category already exists.');
      return;
    }

    onAddCategory({
      name: newCatName.trim(),
      limit: parseFloat(newCatLimit),
      threshold: parseInt(newCatThreshold) || 80
    });

    setNewCatName('');
    setNewCatLimit('');
    setNewCatThreshold('80');
    showStatus('New category added successfully!');
  };

  const showStatus = (msg) => {
    setStatusMsg(msg);
    setTimeout(() => {
      setStatusMsg('');
    }, 3000);
  };

  const handleResetClick = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    setShowResetConfirm(false);
    onResetData();
    showStatus('All local finance data has been deleted.');
  };

  const cancelReset = () => {
    setShowResetConfirm(false);
  };

  return (
    <div className="budget-settings-view">
      <div className="header-container">
        <h2 className="page-title">Budget Settings</h2>
        {statusMsg && <span className="badge success">{statusMsg}</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Income Allowance Setup */}
          <div className="glass-card">
            <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>Monthly Allowance</h3>
            <form onSubmit={handleIncomeSubmit}>
              <div className="form-group">
                <label className="form-label">Allowance Amount ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="form-input"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-primary">Save Allowance</button>
            </form>
          </div>

          {/* Add Custom Category */}
          <div className="glass-card">
            <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>Add Category</h3>
            <form onSubmit={handleAddCategorySubmit}>
              <div className="form-group">
                <label className="form-label">Category Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Books, Gifts"
                  className="form-input"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Limit ($)</label>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    className="form-input"
                    value={newCatLimit}
                    onChange={(e) => setNewCatLimit(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Warn At (%)</label>
                  <input 
                    type="number" 
                    placeholder="80"
                    className="form-input"
                    value={newCatThreshold}
                    onChange={(e) => setNewCatThreshold(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>Create Category</button>
            </form>
          </div>

          {/* Privacy & Reset */}
          <div className="glass-card" style={{ borderLeft: '4px solid var(--color-danger)' }}>
            <h3 style={{ marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-danger)' }}>Privacy & Safety</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Your financial records are stored entirely in your web browser local storage. We respect your privacy and never upload transaction details to any central database.
            </p>
            <button className="btn-secondary" onClick={handleResetClick} style={{ color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)' }}>
              Clear All Data (Factory Reset)
            </button>
          </div>
        </div>

        {/* Categories Editor Panel */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>Manage Category Limits</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Modify budget limits and alert warning thresholds below. Changes take effect on the dashboard instantly.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {data.categories.map((cat) => (
              <div key={cat.name} className="list-item" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '1rem', alignItems: 'center' }}>
                <div style={{ fontWeight: 600 }}>{cat.name}</div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <span className="form-label" style={{ fontSize: '0.75rem' }}>Limit ($)</span>
                  <input 
                    type="number" 
                    className="form-input" 
                    style={{ padding: '0.5rem 0.75rem', fontSize: '0.9rem' }}
                    value={cat.limit}
                    onChange={(e) => handleCategoryChange(cat.name, 'limit', e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <span className="form-label" style={{ fontSize: '0.75rem' }}>Warn At (%)</span>
                  <input 
                    type="number" 
                    className="form-input" 
                    style={{ padding: '0.5rem 0.75rem', fontSize: '0.9rem' }}
                    value={cat.threshold}
                    onChange={(e) => handleCategoryChange(cat.name, 'threshold', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Reset Confirmation Modal */}
      {showResetConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="glass-card" style={{ maxWidth: '400px', width: '90%', textAlign: 'center', borderTop: '4px solid var(--color-danger)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', lineHeight: 1 }}>⚠️</div>
            <h3 style={{ marginBottom: '1rem', fontWeight: 700 }}>Are you absolutely sure?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
              This will permanently delete all your logged expenses, custom budgets, savings goals, and clear your SQLite database. This action cannot be undone!
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-secondary" onClick={cancelReset}>Cancel</button>
              <button className="btn-primary" style={{ background: 'var(--color-danger)', boxShadow: 'var(--glow-danger)' }} onClick={confirmReset}>Yes, Delete Everything</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
