# 💰 Savings Tracker

A simple and user-friendly **Savings Tracker** for managing savings accounts, tracking deposits and withdrawals, and setting savings goals.

The project has been enhanced with **savings goals and progress tracking**, allowing each savings account to have its own target amount and visual progress bar.

## ✨ Features

### 🏦 Savings Accounts

* Add multiple savings accounts.
* Track the current balance of each account.
* Deposit money into an account.
* Withdraw money from an account.
* View all savings accounts in one place.

### 🎯 Savings Goals

Each savings account can have an optional savings goal.

When adding an account, you can enter a **goal amount**. You can also add or change the goal later using:

* **Set goal**
* **Edit goal**

If you don't want to use a savings goal, simply leave the goal amount empty.

### 📊 Savings Progress

Accounts with a savings goal display a visual progress bar showing how close you are to reaching your target.

For example:

> **40% of ₱50,000.00 goal**

The progress automatically updates when you:

* 💵 Deposit money
* 💸 Withdraw money
* 🎯 Change the savings goal

The progress bar grows as you save and decreases when you withdraw.

### 💰 Total Savings

The main dashboard displays your combined savings under:

**Total savings**

This provides a quick overview of how much money is currently saved across all accounts.

### 📝 Updated Interface

The application terminology has been updated to focus specifically on savings tracking.

* Page title: **Savings tracker**
* Main summary: **Total savings**
* Account form: **Add savings account**

## 🎯 How It Works

1. Add a savings account.
2. Enter an optional savings goal.
3. Save the account.
4. Make deposits as you save money.
5. Make withdrawals when needed.
6. Monitor the progress bar toward your goal.
7. Edit or update your goal at any time.

### Example

If you create an account with:

```text
Account: Emergency Fund
Goal: ₱50,000.00
Current Savings: ₱20,000.00
```

The tracker will display approximately:

```text
40% of ₱50,000.00 goal
```

After depositing another ₱10,000:

```text
60% of ₱50,000.00 goal
```

If you later withdraw ₱5,000:

```text
50% of ₱50,000.00 goal
```

The progress is automatically calculated based on the current account balance.

## 🛠️ Project Status

The savings-goal functionality has been implemented and the script successfully passes a syntax check.

> **Note:** The page has not yet been fully tested by opening it in a web browser, so additional browser/UI testing may still be needed.

## 📌 Future Improvements

Possible future enhancements include:

* [ ] Browser and mobile testing
* [ ] Persistent data storage
* [ ] LocalStorage support
* [ ] Savings goal completion notifications
* [ ] Transaction history
* [ ] Monthly savings tracking
* [ ] Savings charts and statistics
* [ ] Multiple currency support
* [ ] Export savings data
* [ ] Dark mode

## 📄 License

This project is available for personal and educational use. Add your preferred license here if you plan to distribute the project publicly.
