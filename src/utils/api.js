const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Parses natural language expense text
 * POST /api/parse-expense -> { amount, category, description, date }
 */
export const apiParseExpense = async (text) => {
  const response = await fetch(`${API_BASE_URL}/parse-expense`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  
  if (!response.ok) {
    throw new Error(`Server returned ${response.status}`);
  }
  
  const data = await response.json();
  return { ...data, source: 'backend' };
};

/**
 * Checks the status of the backend server
 * GET /api/health -> { status, api_key_configured, api_key_valid }
 */
export const apiCheckHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) throw new Error();
    return await response.json();
  } catch (error) {
    return { status: 'offline' };
  }
};
