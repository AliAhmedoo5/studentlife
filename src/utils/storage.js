import CryptoJS from 'crypto-js';

const STORAGE_KEY = 'student_finance_data';
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'fallback-key-do-not-use-in-production';

const DEFAULT_DATA = {
  income: 0,
  categories: [],
  expenses: [],
  savingGoals: [],
  alerts: []
};

export const getFinanceData = () => {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (!rawData) {
      // Seed default data if none exists
      const data = { ...DEFAULT_DATA };
      data.alerts = checkBudgetAlerts(data.expenses, data.categories);
      saveFinanceData(data);
      return data;
    }
    
    // Decrypt the data using AES
    const bytes = CryptoJS.AES.decrypt(rawData, ENCRYPTION_KEY);
    const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    return decryptedData;
  } catch (error) {
    console.warn('Decryption failed or old unencrypted data found. Resetting local buffer...', error);
    window.dispatchEvent(new CustomEvent('storage-error', { detail: { message: 'Security update: Local data buffer reset.' } }));
    localStorage.removeItem(STORAGE_KEY);
    const data = { ...DEFAULT_DATA };
    data.alerts = checkBudgetAlerts(data.expenses, data.categories);
    saveFinanceData(data);
    return data;
  }
};

export const saveFinanceData = (data) => {
  try {
    // Encrypt the JSON string before saving
    const ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
    localStorage.setItem(STORAGE_KEY, ciphertext);
    
    // Sync to backend SQLite database
    fetch('http://localhost:5000/api/sync-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        income: Number(data.income) || 0,
        categories: data.categories || [],
        expenses: data.expenses || [],
        savingGoals: data.savingGoals || [],
      }),
    })
      .then((res) => {
        if (!res.ok) {
          console.warn('Sync failed on backend SQLite:', res.statusText);
          window.dispatchEvent(new CustomEvent('db-sync-status', { detail: { status: 'error' } }));
        } else {
          window.dispatchEvent(new CustomEvent('db-sync-status', { detail: { status: 'success' } }));
        }
      })
      .catch((err) => {
        console.warn('Network error syncing data to backend SQLite:', err);
        window.dispatchEvent(new CustomEvent('db-sync-status', { detail: { status: 'error', error: err } }));
      });
  } catch (error) {
    console.error('Error writing to localStorage', error);
  }
};


export const checkBudgetAlerts = (expenses, categories) => {
  const alerts = [];
  const currentMonthExpenses = expenses.filter(exp => {
    const expDate = new Date(exp.date);
    const now = new Date();
    // Simple filter for the same month and year
    return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
  });

  // Calculate totals by category
  const categoryTotals = {};
  categories.forEach(cat => {
    categoryTotals[cat.name] = 0;
  });

  currentMonthExpenses.forEach(exp => {
    if (categoryTotals[exp.category] !== undefined) {
      categoryTotals[exp.category] += exp.amount;
    }
  });

  // Check limits
  categories.forEach(cat => {
    const total = categoryTotals[cat.name];
    const limit = cat.limit;
    if (limit > 0) {
      const percentage = (total / limit) * 100;
      if (percentage >= 100) {
        alerts.push({
          id: `alert-over-${cat.name}-${Date.now()}`,
          category: cat.name,
          message: `🚨 Overspent! You have spent $${total.toFixed(2)} of your $${limit} ${cat.name} budget. (${percentage.toFixed(0)}%)`,
          type: 'danger',
          date: new Date().toISOString()
        });
      } else if (percentage >= cat.threshold) {
        alerts.push({
          id: `alert-warn-${cat.name}-${Date.now()}`,
          category: cat.name,
          message: `⚠️ Warning: You have used ${percentage.toFixed(0)}% of your ${cat.name} budget ($${total.toFixed(2)} / $${limit}).`,
          type: 'warning',
          date: new Date().toISOString()
        });
      }
    }
  });

  return alerts;
};
