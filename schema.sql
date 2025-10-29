PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  account_number TEXT UNIQUE NOT NULL,
  balance REAL NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_account_id INTEGER,
  to_account_id INTEGER,
  amount REAL NOT NULL,
  tx_type TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (from_account_id) REFERENCES accounts(id),
  FOREIGN KEY (to_account_id) REFERENCES accounts(id)
);

-- Investment Policies
CREATE TABLE IF NOT EXISTS policies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  risk_level TEXT CHECK (risk_level IN ('Low','Medium','High')) DEFAULT 'Medium',
  expected_return REAL DEFAULT 0,
  min_investment REAL DEFAULT 0,
  goal TEXT,
  lock_in TEXT,
  liquidity TEXT
);

-- User to Policy mapping (max 2 policies per user enforced by trigger)
CREATE TABLE IF NOT EXISTS user_policies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  policy_id INTEGER NOT NULL,
  invested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, policy_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (policy_id) REFERENCES policies(id) ON DELETE CASCADE
);

-- Trigger to enforce at most 2 policies per user
CREATE TRIGGER IF NOT EXISTS trg_limit_user_policies
BEFORE INSERT ON user_policies
FOR EACH ROW
BEGIN
  SELECT
    CASE WHEN (
      (SELECT COUNT(*) FROM user_policies WHERE user_id = NEW.user_id) >= 2
    ) THEN RAISE(ABORT, 'User can invest in at most 2 policies') END;
END;

-- Seeding is performed in application init to handle migrations safely