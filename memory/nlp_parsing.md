# Natural Language Processing & Parsing

To simplify expense logging, the application supports natural language parsing (NLP). Students type descriptions like *"Walmart grocery $23.50 yesterday"* or *"netflix cost 15"*, and the system automatically extracts the details.

---

## 1. Unified Python Parsing Pipeline

The NLP parsing pipeline is executed exclusively in the backend server in **`backend/server.py`** via the `parse_expense_local` function. The client-side JavaScript duplicate parser (`nlpParser.js`) has been deleted.

### 1. Amount Extraction (Regex)
The system extracts numeric values using a regular expression designed to match currency values:
```regex
(?:\$|usd)?\s*(\d+(?:\.\d{1,2})?)
```
- Matches integer values (`15`, `250`) and decimals (`12.50`, `3.99`).
- Detects leading `$` or trailing `usd` symbols to prioritize currency numbers over other numeric parts (such as dates).

### 2. Relative Date Parsing
The parser scans the string for keywords representing relative dates and computes the calendar date offset:
- *"yesterday"* -> Subtracts 1 day from current date.
- *"day before yesterday"* -> Subtracts 2 days.
- *"last week"* -> Subtracts 7 days.
- Defaults to the current date if no relative date keywords are detected.

### 3. Category Dictionary Mapping
A dictionary maps specific keywords to their respective budget categories:
- **`Food`**: pizza, burger, lunch, dinner, breakfast, grocery, groceries, starbucks, coffee, cafe, mcdonalds, restaurant, subway, kfc, tacos, eat, sushi, snacks, snack, drink, drinks.
- **`Transport`**: bus, train, uber, taxi, cab, transport, ticket, gas, fuel, metro, ride, flight, fare, commute, parking.
- **`Subscriptions`**: netflix, spotify, youtube, hulu, disney, subscription, subscriptions, gym, membership, github, cloud, aws, software, adobe.
- **`Entertainment`**: movie, cinema, concert, game, gaming, party, club, beer, bar, event, festival, show, museum, steam, xbox, playstation, pub, outing, bowling.
- **`Utilities`**: electricity, water, gas bill, internet, wifi, phone, mobile bill, bill, rent, heating, laundry.
- **`Emergencies`**: clinic, doctor, medicine, pharmacy, hospital, repair, emergency, dentist, pills, broken.

### 4. Description Cleaning
To isolate the description, the parser filters out the extracted amount, date keywords, and helper/action verbs:
- **Filters**: *spent, cost, bought, paid, purchased, added, for, on, at, a, an, the, dollars, dollar, bucks, usd*.
- **Punctuation**: Removes symbols and cleans up excess whitespace.
- **Capitalization**: Capitalizes the first letter of each word to create clean entries (e.g. *"Starbucks Coffee"*).

---

## 2. Human-in-the-Loop Confirmation

The application emphasizes that AI/NLP outputs must not make final decisions and should allow human override:
1. When the student clicks **"Parse"** in the NLP entry panel, the suggested fields (Amount, Category, Description) are populated into a review card.
2. **The expense is NOT added to the database yet.**
3. The student can edit any of the fields (e.g. changing the predicted category from "Emergencies" to "Food" or fixing a typo in the amount).
4. Once satisfied, the student clicks **"Confirm & Save"** to add the expense, satisfying all safety and explainability requirements.
