import React, { useState } from 'react';

export default function SavingsGoals({ data, onAddGoal, onContributeGoal }) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');

  // Contribution state
  const [selectedGoalId, setSelectedGoalId] = useState(data.savingGoals[0]?.id || '');
  const [contribAmount, setContribAmount] = useState('');
  const [isWithdraw, setIsWithdraw] = useState(false);

  const handleCreateGoal = (e) => {
    e.preventDefault();
    if (!name || !target || parseFloat(target) <= 0 || !deadline) return;

    onAddGoal({
      name: name.trim(),
      target: parseFloat(target),
      current: 0,
      deadline
    });

    setName('');
    setTarget('');
    setDeadline('');
    
    // Automatically select the new goal if it was empty
    if (!selectedGoalId) {
      setSelectedGoalId(data.savingGoals[0]?.id || '');
    }
  };

  const handleContribSubmit = (e) => {
    e.preventDefault();
    if (!selectedGoalId || !contribAmount || parseFloat(contribAmount) <= 0) return;

    const amount = parseFloat(contribAmount) * (isWithdraw ? -1 : 1);
    onContributeGoal(selectedGoalId, amount);

    setContribAmount('');
  };

  return (
    <div className="savings-goals-view">
      <div className="header-container">
        <h2 className="page-title">Savings Goals Tracker</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '1.5rem' }}>
        
        {/* Left column: Add Goal & Log Contributions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Contribute Form */}
          {data.savingGoals.length > 0 && (
            <div className="glass-card" style={{ borderLeft: '4px solid var(--color-success)' }}>
              <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>Log Contribution</h3>
              <form onSubmit={handleContribSubmit}>
                <div className="form-group">
                  <label className="form-label">Select Goal</label>
                  <select 
                    className="form-select"
                    value={selectedGoalId}
                    onChange={(e) => setSelectedGoalId(e.target.value)}
                  >
                    {data.savingGoals.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Amount ($)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00"
                    className="form-input"
                    value={contribAmount}
                    onChange={(e) => setContribAmount(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="contrib_type" 
                      checked={!isWithdraw} 
                      onChange={() => setIsWithdraw(false)} 
                    />
                    Add Contribution
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', cursor: 'pointer', color: 'var(--color-danger)' }}>
                    <input 
                      type="radio" 
                      name="contrib_type" 
                      checked={isWithdraw} 
                      onChange={() => setIsWithdraw(true)} 
                    />
                    Withdraw Savings
                  </label>
                </div>

                <button type="submit" className="btn-primary" style={{ background: isWithdraw ? 'linear-gradient(135deg, var(--color-danger), #f87171)' : 'linear-gradient(135deg, var(--color-success), var(--color-cyan))', boxShadow: isWithdraw ? 'var(--glow-danger)' : 'var(--glow-success)' }}>
                  {isWithdraw ? 'Withdraw Funds' : 'Save Money'}
                </button>
              </form>
            </div>
          )}

          {/* Create Savings Goal */}
          <div className="glass-card">
            <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>New Savings Target</h3>
            <form onSubmit={handleCreateGoal}>
              <div className="form-group">
                <label className="form-label">Goal Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Flight Home, Winter Jacket"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Target Amount ($)</label>
                <input 
                  type="number" 
                  placeholder="0.00"
                  className="form-input"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Target Deadline</label>
                <input 
                  type="date" 
                  className="form-input"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>Create Target</button>
            </form>
          </div>
        </div>

        {/* Right column: Goals List */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1.25rem', fontWeight: 600 }}>Active Savings Goals</h3>

          {data.savingGoals.length === 0 ? (
            <div className="empty-state" style={{ border: 'none', background: 'transparent', padding: '5rem 1rem' }}>
              <div className="empty-state-icon">🎯</div>
              <div className="empty-state-title">No Savings Goals</div>
              <p className="empty-state-text">
                You do not have any active savings goals yet. Create a target on the left to start budgeting for items like a laptop or vacation!
              </p>
            </div>
          ) : (

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {data.savingGoals.map(g => {
                const pct = g.target > 0 ? (g.current / g.target) * 100 : 0;
                const remaining = Math.max(0, g.target - g.current);
                
                return (
                  <div key={g.id} style={{ padding: '1rem', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.01)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '1.05rem' }}>{g.name}</span>
                      <span className="badge success" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                        Target: ${g.target.toFixed(2)}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Saved: <strong>${g.current.toFixed(2)}</strong> (${remaining.toFixed(2)} left)</span>
                      <span>Deadline: {g.deadline}</span>
                    </div>

                    <div className="progress-track" style={{ height: '10px' }}>
                      <div 
                        className="progress-fill success" 
                        style={{ width: `${Math.min(100, pct)}%` }}
                      ></div>
                    </div>

                    <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                      {pct >= 100 ? (
                        <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>🎉 Target Achieved!</span>
                      ) : (
                        <span>{pct.toFixed(0)}% Complete</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
