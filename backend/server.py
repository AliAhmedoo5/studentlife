import os
import re
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import sqlite3

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("finance-backend")

# Resolve the absolute path for the SQLite database file in the same directory as this server script
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "finance.db")

# Helper function to establish a connection to the SQLite database
def get_db_connection():
    # Connect to the SQLite file database
    conn = sqlite3.connect(DB_PATH)
    # Configure rows to be returned as dictionary-like objects (allows column lookup by name)
    conn.row_factory = sqlite3.Row
    return conn

# Database table initialization helper
def init_db():
    # Open a database connection
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Create 'settings' table to store key-value configurations like user income
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
    )
    """)
    
    # 2. Create 'categories' table to store budget limits and warning thresholds
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS categories (
        name TEXT PRIMARY KEY,
        "limit" REAL,
        threshold INTEGER
    )
    """)
    
    # 3. Create 'expenses' table to store student spending transactions
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        amount REAL,
        category TEXT,
        description TEXT,
        date TEXT
    )
    """)
    
    # 4. Create 'saving_goals' table to track milestones, amounts saved, and target dates
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS saving_goals (
        id TEXT PRIMARY KEY,
        name TEXT,
        target REAL,
        current REAL,
        deadline TEXT
    )
    """)
    
    # Save (commit) table schemas to SQLite
    conn.commit()
    
    # Check if the database has any pre-existing records; if empty, seed default data
    cursor.execute("SELECT COUNT(*) FROM settings")
    if cursor.fetchone()[0] == 0:
        logger.info("Database is empty. Seeding default data...")
        seed_db(conn)
        
    # Close the database connection
    conn.close()

# Database seeding helper to populate a mock student profile on fresh startup
def seed_db(conn):
    cursor = conn.cursor()
    
    # Start fresh with $0 income and no categories
    cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('income', '0')")
    
    # Save seeded records to tables
    conn.commit()

# Read the entire database state and return it as a single structured JSON response
def get_finance_data_from_db() -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Fetch user income setting
    cursor.execute("SELECT value FROM settings WHERE key = 'income'")
    row = cursor.fetchone()
    income = float(row['value']) if row else 1200.0
    
    # 2. Fetch all configured budget categories
    cursor.execute("SELECT name, \"limit\", threshold FROM categories")
    categories = [{"name": r['name'], "limit": r['limit'], "threshold": r['threshold']} for r in cursor.fetchall()]
    
    # 3. Fetch logged expenses
    cursor.execute("SELECT id, amount, category, description, date FROM expenses")
    expenses = [{"id": r['id'], "amount": r['amount'], "category": r['category'], "description": r['description'], "date": r['date']} for r in cursor.fetchall()]
    
    # 4. Fetch savings goals
    cursor.execute("SELECT id, name, target, current, deadline FROM saving_goals")
    savingGoals = [{"id": r['id'], "name": r['name'], "target": r['target'], "current": r['current'], "deadline": r['deadline']} for r in cursor.fetchall()]
    
    # Close connection
    conn.close()
    
    # Package into a unified payload matching the frontend schema
    return {
        "income": income,
        "categories": categories,
        "expenses": expenses,
        "savingGoals": savingGoals
    }

# Sync the entire frontend application state to the SQLite tables in a single transaction
def sync_finance_data_to_db(data: Dict[str, Any]):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # 1. Overwrite user income setting
        cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('income', ?)", (str(data.get('income', 1200.0)),))
        
        # 2. Clear and overwrite categories
        cursor.execute("DELETE FROM categories")
        categories = [(c['name'], c['limit'], c['threshold']) for c in data.get('categories', [])]
        cursor.executemany("INSERT INTO categories (name, \"limit\", threshold) VALUES (?, ?, ?)", categories)
        
        # 3. Clear and overwrite expenses
        cursor.execute("DELETE FROM expenses")
        expenses = [(e['id'], e['amount'], e['category'], e['description'], e['date']) for e in data.get('expenses', [])]
        cursor.executemany("INSERT INTO expenses (id, amount, category, description, date) VALUES (?, ?, ?, ?, ?)", expenses)
        
        # 4. Clear and overwrite savings goals
        cursor.execute("DELETE FROM saving_goals")
        goals = [(g['id'], g['name'], g['target'], g['current'], g['deadline']) for g in data.get('savingGoals', [])]
        cursor.executemany("INSERT INTO saving_goals (id, name, target, current, deadline) VALUES (?, ?, ?, ?, ?)", goals)
        
        # Commit all table overrides
        conn.commit()
    except Exception as e:
        # Roll back transaction if any error occurs to prevent corrupted data states
        conn.rollback()
        logger.error(f"Failed to sync finance data to SQLite: {str(e)}")
        raise e
    finally:
        # Guarantee connection closure
        conn.close()

app = FastAPI(title="Student Finance AI Backend")



# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FinanceDataContext(BaseModel):
    income: float
    categories: List[Dict[str, Any]]
    expenses: List[Dict[str, Any]]
    savingGoals: List[Dict[str, Any]]

class ParseExpenseRequest(BaseModel):
    text: str

class SyncDataRequest(BaseModel):
    income: float
    categories: List[Dict[str, Any]]
    expenses: List[Dict[str, Any]]
    savingGoals: List[Dict[str, Any]]

@app.on_event("startup")
def startup_event():
    logger.info("Initializing database...")
    init_db()


# Local NLP fallback parser (regex & dictionary)
def parse_expense_local(text: str) -> Dict[str, Any]:
    text_lower = text.lower().strip()
    amount = 0.0
    category = "Emergencies" # Fallback
    description = ""
    date_obj = datetime.now()
    
    # 1. Extract amount
    # Matches $15.50, 15.50, 15, $15usd
    amounts = re.findall(r'(?:\$|usd)?\s*(\d+(?:\.\d{1,2})?)', text_lower)
    if amounts:
        # Check if there is a number preceded by a dollar sign
        dollar_match = re.search(r'\$\s*(\d+(?:\.\d{1,2})?)', text_lower)
        if dollar_match:
            amount = float(dollar_match.group(1))
        else:
            amount = float(amounts[0])
            
    # 2. Extract relative date
    if 'yesterday' in text_lower:
        date_obj -= timedelta(days=1)
    elif 'day before yesterday' in text_lower:
        date_obj -= timedelta(days=2)
    elif 'last week' in text_lower:
        date_obj -= timedelta(days=7)
        
    date_str = date_obj.strftime("%Y-%m-%d")
    
    # 3. Categorize
    category_keywords = {
        "Food": ['food', 'pizza', 'burger', 'lunch', 'dinner', 'breakfast', 'grocery', 'groceries', 'starbucks', 'coffee', 'cafe', 'mcdonalds', 'restaurant', 'subway', 'kfc', 'tacos', 'eat', 'sushi', 'snacks', 'snack', 'drink', 'drinks'],
        "Transport": ['bus', 'train', 'uber', 'taxi', 'cab', 'transport', 'ticket', 'gas', 'fuel', 'metro', 'subway ride', 'ride', 'flight', 'fare', 'commute', 'parking'],
        "Subscriptions": ['netflix', 'spotify', 'youtube', 'hulu', 'disney', 'subscription', 'subscriptions', 'gym', 'membership', 'github', 'cloud', 'aws', 'software', 'adobe'],
        "Entertainment": ['movie', 'cinema', 'concert', 'game', 'gaming', 'party', 'club', 'beer', 'bar', 'event', 'festival', 'show', 'museum', 'steam', 'xbox', 'playstation', 'pub', 'outing', 'bowling'],
        "Utilities": ['electricity', 'water', 'gas bill', 'internet', 'wifi', 'phone', 'mobile bill', 'bill', 'rent', 'heating', 'laundry'],
        "Emergencies": ['clinic', 'doctor', 'medicine', 'pharmacy', 'hospital', 'repair', 'emergency', 'dentist', 'pills', 'broken']
    }
    
    matched_cat = None
    for cat, keywords in category_keywords.items():
        for keyword in keywords:
            if re.search(r'\b' + re.escape(keyword) + r'\b', text_lower):
                matched_cat = cat
                break
        if matched_cat:
            break
            
    if matched_cat:
        category = matched_cat
    else:
        if 'eat' in text_lower or 'hungry' in text_lower or 'meal' in text_lower:
            category = "Food"
        elif 'travel' in text_lower or 'go to' in text_lower or 'drive' in text_lower:
            category = "Transport"
        elif 'watch' in text_lower or 'play' in text_lower or 'fun' in text_lower:
            category = "Entertainment"
            
    # 4. Description
    clean_desc = text_lower
    # Remove amount
    for amt in amounts:
        clean_desc = re.sub(rf'\b\$?{re.escape(amt)}\b', '', clean_desc)
    
    fillers = [
        'spent', 'cost', 'bought', 'paid', 'purchased', 'added', 'for', 'on', 'at', 'a', 'an', 'the',
        'yesterday', 'today', 'last week', 'day before yesterday', 'dollars', 'dollar', 'bucks', 'usd'
    ]
    for filler in fillers:
        clean_desc = re.sub(rf'\b{filler}\b', '', clean_desc)
        
    clean_desc = re.sub(r'[.,\/#!$%\^&\*;:{}=\-_`~()?]', ' ', clean_desc)
    clean_desc = re.sub(r'\s+', ' ', clean_desc).strip()
    
    if clean_desc:
        description = " ".join([word.capitalize() for word in clean_desc.split()])
    else:
        description = f"{category} Expense"
        
    return {
        "amount": amount,
        "category": category,
        "description": description,
        "date": date_str
    }


# ----------------- FastAPI Endpoints -----------------

@app.get("/api/health")
def health():
    return {
        "status": "ready"
    }


@app.get("/api/finance-data")
def get_finance_data():
    try:
        data = get_finance_data_from_db()
        return data
    except Exception as e:
        logger.error(f"Failed to fetch finance data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database read failed: {str(e)}")

@app.post("/api/sync-data")
def sync_data(req: SyncDataRequest):
    try:
        sync_finance_data_to_db(req.dict())
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Failed to sync data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database write failed: {str(e)}")

@app.post("/api/reset-data")
def reset_data():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM settings")
        cursor.execute("DELETE FROM categories")
        cursor.execute("DELETE FROM expenses")
        cursor.execute("DELETE FROM saving_goals")
        seed_db(conn)
        conn.close()
        
        data = get_finance_data_from_db()
        return data
    except Exception as e:
        logger.error(f"Failed to reset database: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database reset failed: {str(e)}")


@app.post("/api/parse-expense")
async def parse_expense(req: ParseExpenseRequest):
    # Parse expense text via local python logic
    logger.info(f"Parsing expense text via local python fallback: {req.text}")
    parsed = parse_expense_local(req.text)
    return parsed

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="127.0.0.1", port=5000, reload=False)
