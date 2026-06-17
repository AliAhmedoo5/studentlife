# Demo Day Presentation Guide

Use this guide as a script during the 5-minute technical demo to showcase the MVP workflow and answer common judge questions.

---

## 🎭 Step-by-Step Demo Flow

### Step 1: Open the Application & Show the Seed Data
* **Action**: Open the application in the browser (`http://localhost:5173`).
* **Explanation**: *"We have seeded our personal finance dashboard with a standard student profile. This allows us to demonstrate a realistic financial state right away. You can see we have configured an allowance of $1,200.00, mapped category budgets (Food, Transport, Subscriptions, Entertainment), logged 9 transactions, and tracked savings goals."*

### Step 2: Set the Allowance & Category Limits
* **Action**: Navigate to **Settings** and update the monthly allowance to **$1,500.00**. Next, change the Food budget limit to **$200.00**. Click **Save Allowance**.
* **Explanation**: *"First, the student can set their allowance and category budget limits. I have updated the monthly allowance to $1,500.00 and restricted the Food budget to $200.00. The updates persist in localStorage and sync immediately with the Dashboard."*

### Step 3: Log an Expense using Natural Language
* **Action**: Navigate to **Log Expenses**. Type *"spent $14.50 on pizza yesterday"* into the natural language console and click **Parse**.
* **Explanation**: *"To reduce logging friction, we support natural language logging. I've entered a pizza expense. You can see the system parsed the amount $14.50, predicted the category 'Food', resolved the date to yesterday's date, and cleaned the description to 'Pizza'. In accordance with our human-in-the-loop safety policy, the student can review these suggested details, correct them if needed, and then click 'Confirm & Save'."*

### Step 4: Trigger an Overspending Alert
* **Action**: In the manual expense logger (or NLP console), log an expense of **$180.00** for **Food** (e.g. *"Bulk groceries"*).
* **Explanation**: *"Now, I'll log a grocery purchase of $180.00. Since we restricted our Food budget to $200.00 and had logged a prior food expense, this transaction pushes our Food category spent to $206.50—exceeding our limit. A warning alert banner automatically appears at the top of the dashboard."*

### Step 5: Check the Balance Forecast
* **Action**: Navigate to the **Dashboard** and scroll to **Month-End Forecast**.
* **Explanation**: *"Under the forecasting widget, the system projects our daily average spend to predict the remaining balance at the end of the month. Since we logged a large food expense, our projected month-end balance is negative, and the forecast widget highlights the overspending risk in red."*



## ❓ Frequently Asked Judge Questions

### Q1: Where is your business logic implemented?
- **Answer**: *"Our business logic is distributed across a React state-controller (frontend) and Python utility services (backend). Persistent data operations are handled by `storage.js` and NLP parsing is handled by Python logic in `server.py`."*

### Q2: What happens when the backend service fails or you have no internet?
- **Answer**: *"Our system is designed to be 100% resilient. The frontend API communicator (`api.js`) wraps all backend calls in catch blocks. If the FastAPI backend is offline, the frontend automatically falls back to local client-side Javascript implementations. The UI displays a warning banner, but the user experience never breaks."*

### Q3: How do you handle safety and privacy?
- **Answer**: *"Financial privacy is handled by storing all student records locally in the browser's `localStorage`—no data is uploaded to external database servers."*
