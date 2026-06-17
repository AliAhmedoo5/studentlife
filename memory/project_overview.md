# Project Overview & Requirements

## 1. Selected Track & Domain
* **Track**: Project No. 2
* **Title**: Personal Finance and Micro-Budgeting System for Students
* **Domain**: FinTech / Student Life

## 2. Problem Statement
Students manage small, variable budgets (allowances, part-time jobs) and frequently lose track of high-friction categories: food, transport, digital subscriptions, online shopping, and emergencies. 
Manual logging has high friction, leading to user abandonment. The challenge is to build a private, assistant-enabled finance tracker that:
- Simplifies logging through natural language.
- Projects month-end balances dynamically based on spending velocity.
- Offers actionable savings optimizations.
- Keeps student financial records strictly private.

## 3. Target Users & Roles
1. **Student User (Core Persona)**: Log transactions, set limits, check forecasts, and review savings progress.
2. **Financial Mentor / Parent (Optional views)**: Provide oversight and verify budget discipline without exposing exact transaction details (privacy preservation).
3. **System Administrator**: Manage backend services and model variables.

## 4. Required MVP Workflow (Challenge Checklist)
The MVP must demonstrate this end-to-end user loop:
1. **Setup Allowance**: Student sets monthly income and assigns category budget limits.
2. **Natural Entry**: Student inputs an expense naturally (e.g. *"McDonalds dinner $14"*).
3. **AI Categorization**: System predicts the category, allows manual correction, and saves it.
4. **Budget Update**: Analytics and remaining category balances update instantly.
5. **Forecast Balance**: System uses current daily average to project month-end remaining balance.
6. **Trigger Alerts**: System flashes warning alerts when category budgets cross warning thresholds (e.g. 80%).
7. **Generate Report**: Summarize spending habits and costs driver categories at month-end.

## 5. Safety, Ethics, and Privacy Notes
- **Privacy-First**: The system stores transaction lists, budgets, and chat transcripts entirely in the browser (`localStorage`). No financial details are saved on external servers.
