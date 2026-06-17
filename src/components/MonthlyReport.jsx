import React from 'react';

export default function MonthlyReport({ data }) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Filter current month expenses
  const currentMonthExpenses = data.expenses.filter(exp => {
    const expDate = new Date(exp.date);
    return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
  });

  // Calculate stats
  const totalSpent = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const transactionCount = currentMonthExpenses.length;
  const averageSpend = transactionCount > 0 ? totalSpent / transactionCount : 0;

  // Breakdown by category
  const categorySummary = {};
  data.categories.forEach(c => {
    categorySummary[c.name] = { spent: 0, count: 0, limit: c.limit };
  });

  currentMonthExpenses.forEach(exp => {
    if (categorySummary[exp.category]) {
      categorySummary[exp.category].spent += exp.amount;
      categorySummary[exp.category].count += 1;
    }
  });

  // Peak spending category
  let peakCategory = 'None';
  let peakAmount = 0;
  Object.entries(categorySummary).forEach(([name, val]) => {
    if (val.spent > peakAmount) {
      peakCategory = name;
      peakAmount = val.spent;
    }
  });

  // Find top spending day of the month
  const dailySpend = {};
  currentMonthExpenses.forEach(exp => {
    const d = exp.date; // YYYY-MM-DD
    dailySpend[d] = (dailySpend[d] || 0) + exp.amount;
  });

  let topDay = 'None';
  let topDayAmount = 0;
  Object.entries(dailySpend).forEach(([dateStr, amt]) => {
    if (amt > topDayAmount) {
      topDay = dateStr;
      topDayAmount = amt;
    }
  });

  // Format date nicely
  const formatNiceDate = (dateStr) => {
    if (dateStr === 'None') return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Optimization recommendations
  const optimizationTips = [
    {
      title: "Variable Cost Audit (Food & Entertainment)",
      detail: `Your variable expenses total $${((categorySummary['Food']?.spent || 0) + (categorySummary['Entertainment']?.spent || 0)).toFixed(2)}. Preparing lunch at home and planning social activities around student discounts can reduce this by 40%.`
    },
    {
      title: "Subscription Pruning",
      detail: `You've spent $${(categorySummary['Subscriptions']?.spent || 0).toFixed(2)} on monthly subscriptions. Deactivating one streaming platform for a month can save you over $15 directly.`
    },
    {
      title: "Buffer Management",
      detail: `Keep a minimum $50 emergency buffer in your allowance account to avoid dipping into credit or borrow lines for unexpected transport/medical expenses.`
    }
  ];

  return (
    <div className="monthly-report-view">
      <div className="header-container">
        <h2 className="page-title">Monthly Spending Report</h2>
        <span className="badge success">Calculated from Real Ledger</span>
      </div>

      {/* Overview stats */}
      <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
        <div className="glass-card card-stat">
          <span className="stat-label">Total Transactions</span>
          <span className="stat-value remaining" style={{ color: 'var(--color-purple)' }}>{transactionCount}</span>
        </div>
        <div className="glass-card card-stat">
          <span className="stat-label">Average Expense Size</span>
          <span className="stat-value remaining">${averageSpend.toFixed(2)}</span>
        </div>
        <div className="glass-card card-stat">
          <span className="stat-label">Top Spending Day</span>
          <span className="stat-value spent" style={{ fontSize: '1.2rem', padding: '0.8rem 0', fontWeight: 600 }}>
            {formatNiceDate(topDay)}<br/>
            <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>(${topDayAmount.toFixed(2)})</span>
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '1.5rem' }}>
        {/* Category Breakdown Table */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '1.25rem', fontWeight: 600 }}>Spending by Category</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Total Spent</th>
                  <th>Limit</th>
                  <th>Transactions</th>
                  <th>Budget Used</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(categorySummary).map(([name, val]) => {
                  const pct = val.limit > 0 ? (val.spent / val.limit) * 100 : 0;
                  return (
                    <tr key={name}>
                      <td style={{ fontWeight: 600 }}>{name}</td>
                      <td style={{ color: val.spent > 0 ? 'var(--color-danger)' : 'var(--text-muted)' }}>
                        ${val.spent.toFixed(2)}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>${val.limit}</td>
                      <td>{val.count}</td>
                      <td>
                        <span className={`badge ${pct >= 100 ? 'danger' : pct >= 80 ? 'warning' : 'success'}`} style={{ fontSize: '0.7rem' }}>
                          {pct.toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actionable Savings Takeaways */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontWeight: 600 }}>AI Savings Takeaways</h3>

          <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-glass)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Highest Cost Driver</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-danger)' }}>{peakCategory}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Totaling <strong>${peakAmount.toFixed(2)}</strong>. This is <strong>{totalSpent > 0 ? ((peakAmount/totalSpent)*100).toFixed(0) : 0}%</strong> of your entire monthly spending.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {optimizationTips.map((tip, i) => (
              <div key={i} style={{ borderLeft: '3px solid var(--color-cyan)', paddingLeft: '0.75rem' }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>{tip.title}</div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{tip.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
