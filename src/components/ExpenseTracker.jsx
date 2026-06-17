import React, { useState } from 'react';
import { apiParseExpense } from '../utils/api';

export default function ExpenseTracker({ data, onAddExpense, onDeleteExpense, showToast }) {
  // Manual form state
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(data.categories[0]?.name || 'Food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // NLP form state
  const [nlpText, setNlpText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parsedExpense, setParsedExpense] = useState(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  // Trigger natural language parse
  const handleNlpParse = async (e) => {
    e.preventDefault();
    if (!nlpText.trim()) return;

    setParsing(true);
    setParsedExpense(null);
    try {
      const result = await apiParseExpense(nlpText);
      
      // Smart category mapping for custom user categories
      let matchedCategory = result.category;
      const validCategories = data.categories.map(c => c.name.toLowerCase());
      
      if (!validCategories.includes(matchedCategory.toLowerCase())) {
        // If the backend's generic category isn't in the user's custom list,
        // check if any of the user's custom categories are mentioned explicitly in the text.
        const textLower = nlpText.toLowerCase();
        const customMatch = data.categories.find(c => textLower.includes(c.name.toLowerCase()));
        
        if (customMatch) {
          matchedCategory = customMatch.name;
        } else {
          // Fallback to the first available category
          matchedCategory = data.categories.length > 0 ? data.categories[0].name : 'Other';
        }
      } else {
        // Ensure exact case matching for the dropdown to select properly
        matchedCategory = data.categories.find(c => c.name.toLowerCase() === matchedCategory.toLowerCase()).name;
      }
      
      setParsedExpense({ ...result, category: matchedCategory });
    } catch (error) {
      console.error('NLP Parsing failed', error);
      showToast('Could not parse text. Please check the backend.', 'error', '⚠️');
    } finally {
      setParsing(false);
    }
  };

  const handleNlpConfirm = () => {
    if (!parsedExpense || parsedExpense.amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    
    // Add parsed expense
    onAddExpense(parsedExpense);
    
    // Clean up
    setParsedExpense(null);
    setNlpText('');
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!desc || !amount || parseFloat(amount) <= 0) return;

    onAddExpense({
      description: desc,
      amount: parseFloat(amount),
      category,
      date
    });

    setDesc('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  // Filtered Expenses list
  const filteredExpenses = data.expenses.filter(exp => {
    const matchesSearch = exp.description.toLowerCase().includes(search.toLowerCase()) || 
                          exp.category.toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterCategory === 'All' || exp.category === filterCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="expense-tracker-view">
      <div className="header-container">
        <h2 className="page-title">Expenses Ledger</h2>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <input 
            type="text" 
            placeholder="Search descriptions..." 
            className="form-input" 
            style={{ width: '200px', padding: '0.5rem 0.75rem', fontSize: '0.9rem' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select 
            className="form-select"
            style={{ width: '150px', padding: '0.5rem 0.75rem', fontSize: '0.9rem' }}
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            {data.categories.map(c => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '1.5rem' }}>
        
        {/* Left column: Logging forms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Natural Language entry */}
          <div className="glass-card" style={{ borderLeft: '4px solid var(--color-cyan)' }}>
            <h3 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Log with Natural Language</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Type an expense naturally: e.g. <em>"Netflix cost 1500 today"</em> or <em>"bus ticket Rs 300 yesterday"</em>.
            </p>
            <form onSubmit={handleNlpParse} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input 
                type="text" 
                className="chat-input"
                style={{ borderRadius: 'var(--radius-md)', padding: '0.6rem 0.85rem' }}
                placeholder="e.g. pizza party yesterday 25"
                value={nlpText}
                onChange={(e) => setNlpText(e.target.value)}
                disabled={parsing}
              />
              <button type="submit" className="btn-send" style={{ borderRadius: 'var(--radius-md)', padding: '0 1.25rem' }} disabled={parsing}>
                {parsing ? 'Parsing...' : 'Parse'}
              </button>
            </form>

            {/* NLP Confirmation Box */}
            {parsedExpense && (
              <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.25)', display: 'flex', flexDirectory: 'column', flexDirection: 'column', gap: '0.75rem' }}>
                <h4 style={{ color: 'var(--color-cyan)', fontSize: '0.95rem', fontWeight: 600 }}>Review Parser Suggestions</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Description</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                      value={parsedExpense.description}
                      onChange={(e) => setParsedExpense({ ...parsedExpense, description: e.target.value })}
                    />
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '0.5rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Amount (Rs)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        className="form-input" 
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                        value={parsedExpense.amount}
                        onChange={(e) => setParsedExpense({ ...parsedExpense, amount: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Category</label>
                      <select 
                        className="form-select"
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                        value={parsedExpense.category}
                        onChange={(e) => setParsedExpense({ ...parsedExpense, category: e.target.value })}
                      >
                        {data.categories.map(c => (
                          <option key={c.name} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button onClick={handleNlpConfirm} className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', flexGrow: 1 }}>
                    Confirm & Save
                  </button>
                  <button onClick={() => setParsedExpense(null)} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                    Discard
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Manual Entry Form */}
          <div className="glass-card">
            <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>Log Expense Manually</h3>
            <form onSubmit={handleManualSubmit}>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Gas Station fillup"
                  value={desc} 
                  onChange={(e) => setDesc(e.target.value)} 
                  required
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '0.5rem' }}>
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
              
              <div className="form-group">
                <label className="form-label">Date</label>
                <input 
                  type="date" 
                  className="form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              
              <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>Add Record</button>
            </form>
          </div>
        </div>

        {/* Right column: Ledger list */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1.25rem', fontWeight: 600 }}>Transaction History</h3>
          
          {filteredExpenses.length === 0 ? (
            <div className="empty-state" style={{ border: 'none', background: 'transparent', padding: '5rem 1rem' }}>
              <div className="empty-state-icon">💸</div>
              <div className="empty-state-title">No Transactions Found</div>
              <p className="empty-state-text">
                {search || filterCategory !== 'All' 
                  ? "We couldn't find any expenses matching your filters." 
                  : "Your ledger is currently empty. Use the quick log forms on the left or the AI advisor to start tracking your cash flow!"}
              </p>
            </div>
          ) : (

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '550px', paddingRight: '0.25rem' }}>
              {filteredExpenses.map((exp) => (
                <div key={exp.id} className="list-item">
                  <div>
                    <div className="list-item-title">{exp.description}</div>
                    <div className="list-item-subtitle">
                      <span className="badge info" style={{ padding: '0.1rem 0.35rem', fontSize: '0.65rem', marginRight: '0.5rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                        {exp.category}
                      </span>
                      {exp.date}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-danger)' }}>-Rs {exp.amount.toFixed(2)}</span>
                    <button 
                      onClick={() => onDeleteExpense(exp.id)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', transition: 'var(--transition-smooth)' }}
                      onMouseEnter={(e) => e.target.style.color = 'var(--color-danger)'}
                      onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
                      title="Delete expense"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
