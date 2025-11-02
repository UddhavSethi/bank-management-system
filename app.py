print("--- THIS IS THE NEW FILE, TEST 123 ---")
from dotenv import load_dotenv
load_dotenv() # Loads the .env file

from flask import Flask, render_template, request, redirect, url_for, session, flash
import sqlite3
import os
import hashlib
from werkzeug.security import generate_password_hash, check_password_hash
import json
import urllib.request
import urllib.error
import google.generativeai as genai

DB_PATH = "/var/data/simple_bank.db"

def create_app() -> Flask:
    app = Flask(__name__)
    app.secret_key = "dev-secret"
    # Ensure templates and static files don't get cached while developing
    app.config["TEMPLATES_AUTO_RELOAD"] = True
    app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0
    # Configure Gemini API key from env
    app.config["GEMINI_API_KEY"] = os.getenv("GEMINI_API_KEY")
    print("Gemini key loaded:", bool(app.config["GEMINI_API_KEY"]))
    
    # --- ADD THIS NEW BLOCK ---
    global model  # Make the model globally accessible
    try:
        api_key = app.config["GEMINI_API_KEY"]
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found. Make sure it's in your .env file.")

        genai.configure(api_key=api_key)
        # Initialize the model here
        model = genai.GenerativeModel('gemini-2.5-flash')
        print("Gemini model initialized successfully.")
    except Exception as e:
        print(f"Error initializing Gemini model: {e}")
        model = None
    # --- END OF NEW BLOCK ---

    # ---------- Initialize Database ----------
    def init_db():
        """Create database and tables if they don't exist"""
        conn = sqlite3.connect(DB_PATH)
        conn.execute("PRAGMA foreign_keys = ON;")
        
        # Execute schema (CREATE TABLE IF NOT EXISTS handles duplicates)
        with open('schema.sql', 'r') as f:
            schema_sql = f.read()
        conn.executescript(schema_sql)
        # Lightweight migration: ensure new policy columns exist and reseed to 8 entries
        try:
            cur = conn.execute("PRAGMA table_info(policies)")
            cols = {row[1] for row in cur.fetchall()}
            to_add = []
            if 'min_investment' not in cols:
                to_add.append("ALTER TABLE policies ADD COLUMN min_investment REAL DEFAULT 0;")
            if 'goal' not in cols:
                to_add.append("ALTER TABLE policies ADD COLUMN goal TEXT;")
            if 'lock_in' not in cols:
                to_add.append("ALTER TABLE policies ADD COLUMN lock_in TEXT;")
            if 'liquidity' not in cols:
                to_add.append("ALTER TABLE policies ADD COLUMN liquidity TEXT;")
            for stmt in to_add:
                conn.execute(stmt)

            # Ensure exactly 8 policies exist as per latest defaults
            count = conn.execute("SELECT COUNT(*) FROM policies").fetchone()[0]
            if count != 8:
                conn.execute("DELETE FROM policies")
                conn.executescript("""
                INSERT OR IGNORE INTO policies (id, name, risk_level, expected_return, min_investment, description, goal, lock_in, liquidity) VALUES
                    (1, 'Safe Savings', 'Low', 3.0, 50, 'A secure, low-yield savings product backed by government or bank securities. Ideal for conservative investors or those maintaining emergency funds.', 'Capital preservation and quick liquidity.', 'None (withdraw anytime)', 'High');
                INSERT OR IGNORE INTO policies (id, name, risk_level, expected_return, min_investment, description, goal, lock_in, liquidity) VALUES
                    (2, 'Short-Term Bond Fund', 'Low', 4.0, 100, 'Invests in short-duration bonds and debt instruments. Slightly higher returns than savings accounts but minimal volatility.', 'Low-risk short-term growth (1–2 years).', NULL, 'Moderate');
                INSERT OR IGNORE INTO policies (id, name, risk_level, expected_return, min_investment, description, goal, lock_in, liquidity) VALUES
                    (3, 'Balanced Growth', 'Medium', 6.5, 200, 'A mix of equity (60%) and debt (40%) to balance risk and reward. Designed for users with medium risk tolerance and long-term goals.', 'Steady wealth growth.', '2 years recommended', NULL);
                INSERT OR IGNORE INTO policies (id, name, risk_level, expected_return, min_investment, description, goal, lock_in, liquidity) VALUES
                    (4, 'Aggressive Equity', 'High', 12.0, 300, 'Focuses on high-growth stocks and equity funds. Suitable for users willing to tolerate market volatility for higher returns.', 'Long-term capital appreciation.', '3 years recommended', NULL);
                INSERT OR IGNORE INTO policies (id, name, risk_level, expected_return, min_investment, description, goal, lock_in, liquidity) VALUES
                    (5, 'Global Opportunity Fund', 'High', 10.0, 250, 'Diversified portfolio across international markets and emerging economies. Offers global diversification and currency exposure.', 'Diversified long-term growth.', '3–5 years recommended', NULL);
                INSERT OR IGNORE INTO policies (id, name, risk_level, expected_return, min_investment, description, goal, lock_in, liquidity) VALUES
                    (6, 'Green Future Fund', 'Medium', 7.0, 150, 'Invests in renewable energy, EVs, and sustainable infrastructure. Great for eco-conscious investors seeking moderate returns with positive impact.', 'Ethical investing and stable growth.', '2 years recommended', NULL);
                INSERT OR IGNORE INTO policies (id, name, risk_level, expected_return, min_investment, description, goal, lock_in, liquidity) VALUES
                    (7, 'Digital Assets Index', 'High', 15.0, 200, 'Exposure to leading digital assets (crypto index) with auto-balancing and capped volatility. High reward potential but carries substantial risk.', 'Growth and diversification for tech-savvy investors.', '3–4 years', NULL);
                INSERT OR IGNORE INTO policies (id, name, risk_level, expected_return, min_investment, description, goal, lock_in, liquidity) VALUES
                    (8, 'Real Estate Mini Trust', 'Medium', 8.0, 250, 'Fractional real-estate investment in rental and commercial properties. Provides steady passive income through rent yields.', 'Passive income and inflation hedge.', '2 years', NULL);
                """)
                conn.commit()
        except sqlite3.Error:
            # Ignore migration errors in dev
            pass
        
        conn.close()
        print("Database initialized successfully!")

    # Initialize database on startup
    init_db()

    # ---------- Helper to connect to DB ----------
    def get_db():
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON;")
        return conn

    # ---------- ROUTES ----------
    @app.route("/")
    def home():
        return render_template("landing.html")

    @app.route("/register", methods=["GET", "POST"])
    def register():
        if request.method == "POST":
            username = request.form["username"]
            password = request.form["password"]

            # Validate input
            if not username or not password:
                flash("Username and password are required", "error")
                return render_template("register.html")

            if len(password) < 6:
                flash("Password must be at least 6 characters long", "error")
                return render_template("register.html")

            db = get_db()
            try:
                # Check if username already exists
                existing_user = db.execute(
                    "SELECT id FROM users WHERE username = ?", (username,)
                ).fetchone()
                
                if existing_user:
                    flash("Username already exists", "error")
                    return render_template("register.html")

                # Hash the password
                password_hash = generate_password_hash(password)
                
                # Insert user
                cur = db.execute(
                    "INSERT INTO users (username, password_hash) VALUES (?, ?)",
                    (username, password_hash)
                )
                user_id = cur.lastrowid
                
                # Create account with initial balance
                acc_no = f"AC{100000 + user_id}"
                initial_balance = 1000.00  # Give new users $1000 to test with
                db.execute(
                    "INSERT INTO accounts (user_id, account_number, balance) VALUES (?, ?, ?)",
                    (user_id, acc_no, initial_balance)
                )
                db.commit()
                
                flash("Registration successful! Please login.", "success")
                return redirect(url_for("login"))
                
            except sqlite3.Error as e:
                db.rollback()
                flash(f"Database error: {str(e)}", "error")
                return render_template("register.html")
            finally:
                db.close()
        
        return render_template("register.html")

    @app.route("/login", methods=["GET", "POST"])
    def login():
        if request.method == "POST":
            username = request.form["username"]
            password = request.form["password"]

            db = get_db()
            try:
                user = db.execute(
                    "SELECT id, username, password_hash FROM users WHERE username = ?",
                    (username,)
                ).fetchone()

                if user and check_password_hash(user["password_hash"], password):
                    session["user_id"] = user["id"]
                    session["username"] = user["username"]
                    flash("Login successful!", "success")
                    return redirect(url_for("dashboard"))
                else:
                    flash("Invalid username or password", "error")
                    return render_template("login.html")
                    
            except sqlite3.Error as e:
                flash(f"Database error: {str(e)}", "error")
                return render_template("login.html")
            finally:
                db.close()
        
        return render_template("login.html")

    @app.route("/dashboard")
    def dashboard():
        if "user_id" not in session:
            flash("Please login first", "error")
            return redirect(url_for("login"))
        
        db = get_db()
        try:
            account = db.execute(
                "SELECT account_number, balance FROM accounts WHERE user_id = ?",
                (session["user_id"],)
            ).fetchone()
            
            if not account:
                flash("Account not found", "error")
                return redirect(url_for("login"))
            
            # Fetch user's invested policies (if any)
            user_policies = db.execute(
                """
                SELECT up.invested_at, p.name, p.description, p.risk_level, p.expected_return
                FROM user_policies up
                JOIN policies p ON p.id = up.policy_id
                WHERE up.user_id = ?
                ORDER BY up.invested_at DESC
                """,
                (session["user_id"],)
            ).fetchall()
            
            return render_template("dashboard.html", 
                                   username=session["username"],
                                   account_number=account["account_number"],
                                   balance=account["balance"],
                                   user_policies=user_policies)
        except sqlite3.Error as e:
            flash(f"Database error: {str(e)}", "error")
            return redirect(url_for("login"))
        finally:
            db.close()

    @app.route("/send_money", methods=["GET", "POST"])
    def send_money():
        if "user_id" not in session:
            flash("Please login first", "error")
            return redirect(url_for("login"))
        
        db = get_db()
        try:
            # Get user's account info
            account = db.execute(
                "SELECT id, account_number, balance FROM accounts WHERE user_id = ?",
                (session["user_id"],)
            ).fetchone()
            
            if not account:
                flash("Account not found", "error")
                return redirect(url_for("login"))
            
            if request.method == "POST":
                recipient_account = request.form["recipient_account"].strip()
                amount = float(request.form["amount"])
                description = request.form.get("description", "").strip()
                
                # Validate input
                if not recipient_account:
                    flash("Recipient account number is required", "error")
                    return render_template("send_money.html", 
                                         username=session["username"],
                                         account_number=account["account_number"],
                                         balance=account["balance"])
                
                if amount <= 0:
                    flash("Amount must be greater than zero", "error")
                    return render_template("send_money.html", 
                                         username=session["username"],
                                         account_number=account["account_number"],
                                         balance=account["balance"])
                
                if amount > account["balance"]:
                    flash("Insufficient funds", "error")
                    return render_template("send_money.html", 
                                         username=session["username"],
                                         account_number=account["account_number"],
                                         balance=account["balance"])
                
                # Check if recipient account exists
                recipient = db.execute(
                    "SELECT id, account_number FROM accounts WHERE account_number = ?",
                    (recipient_account,)
                ).fetchone()
                
                if not recipient:
                    flash("Recipient account not found", "error")
                    return render_template("send_money.html", 
                                         username=session["username"],
                                         account_number=account["account_number"],
                                         balance=account["balance"])
                
                if recipient["id"] == account["id"]:
                    flash("Cannot send money to yourself", "error")
                    return render_template("send_money.html", 
                                         username=session["username"],
                                         account_number=account["account_number"],
                                         balance=account["balance"])
                
                # Perform transaction
                try:
                    # Update sender's balance
                    db.execute(
                        "UPDATE accounts SET balance = balance - ? WHERE id = ?",
                        (amount, account["id"])
                    )
                    
                    # Update recipient's balance
                    db.execute(
                        "UPDATE accounts SET balance = balance + ? WHERE id = ?",
                        (amount, recipient["id"])
                    )
                    
                    # Record transaction
                    db.execute(
                        "INSERT INTO transactions (from_account_id, to_account_id, amount, tx_type, description) VALUES (?, ?, ?, ?, ?)",
                        (account["id"], recipient["id"], amount, "transfer", description)
                    )
                    
                    db.commit()
                    
                    flash(f"Successfully sent ${amount:.2f} to {recipient_account}", "success")
                    return redirect(url_for("transaction_history"))
                    
                except sqlite3.Error as e:
                    db.rollback()
                    flash(f"Transaction failed: {str(e)}", "error")
                    return render_template("send_money.html", 
                                         username=session["username"],
                                         account_number=account["account_number"],
                                         balance=account["balance"])
            
            return render_template("send_money.html", 
                                   username=session["username"],
                                   account_number=account["account_number"],
                                   balance=account["balance"])
                                   
        except sqlite3.Error as e:
            flash(f"Database error: {str(e)}", "error")
            return redirect(url_for("dashboard"))
        finally:
            db.close()

    @app.route("/transaction_history")
    def transaction_history():
        if "user_id" not in session:
            flash("Please login first", "error")
            return redirect(url_for("login"))
        
        db = get_db()
        try:
            # Get user's account info
            account = db.execute(
                "SELECT id, account_number, balance FROM accounts WHERE user_id = ?",
                (session["user_id"],)
            ).fetchone()
            
            if not account:
                flash("Account not found", "error")
                return redirect(url_for("login"))
            
            # Get all transactions for this account
            transactions = db.execute("""
                SELECT 
                    t.id,
                    t.amount,
                    t.tx_type,
                    t.description,
                    t.created_at,
                    t.from_account_id,
                    t.to_account_id,
                    fa.account_number as from_account_number,
                    ta.account_number as to_account_number
                FROM transactions t
                LEFT JOIN accounts fa ON t.from_account_id = fa.id
                LEFT JOIN accounts ta ON t.to_account_id = ta.id
                WHERE t.from_account_id = ? OR t.to_account_id = ?
                ORDER BY t.created_at DESC
            """, (account["id"], account["id"])).fetchall()
            
            return render_template("transaction_history.html", 
                                   username=session["username"],
                                   account_number=account["account_number"],
                                   balance=account["balance"],
                                   account_id=account["id"],
                                   transactions=transactions)
                                   
        except sqlite3.Error as e:
            flash(f"Database error: {str(e)}", "error")
            return redirect(url_for("dashboard"))
        finally:
            db.close()

    @app.route("/profile", methods=["GET", "POST"])
    def profile():
        if "user_id" not in session:
            flash("Please login first", "error")
            return redirect(url_for("login"))
        
        db = get_db()
        try:
            if request.method == "POST":
                action = request.form.get("action")
                
                if action == "update_info":
                    # Update email and phone
                    email = request.form.get("email", "").strip()
                    phone = request.form.get("phone", "").strip()
                    
                    # Validate email format if provided
                    if email and "@" not in email:
                        flash("Please enter a valid email address", "error")
                        return redirect(url_for("profile"))
                    
                    # Update user info
                    db.execute(
                        "UPDATE users SET email = ?, phone = ? WHERE id = ?",
                        (email if email else None, phone if phone else None, session["user_id"])
                    )
                    db.commit()
                    flash("Profile updated successfully!", "success")
                    return redirect(url_for("profile"))
                
                elif action == "change_password":
                    # Change password
                    current_password = request.form.get("current_password")
                    new_password = request.form.get("new_password")
                    confirm_password = request.form.get("confirm_password")
                    
                    # Validate input
                    if not current_password or not new_password or not confirm_password:
                        flash("All password fields are required", "error")
                        return redirect(url_for("profile"))
                    
                    if new_password != confirm_password:
                        flash("New passwords do not match", "error")
                        return redirect(url_for("profile"))
                    
                    if len(new_password) < 6:
                        flash("New password must be at least 6 characters long", "error")
                        return redirect(url_for("profile"))
                    
                    # Get current user
                    user = db.execute(
                        "SELECT password_hash FROM users WHERE id = ?",
                        (session["user_id"],)
                    ).fetchone()
                    
                    # Verify current password
                    if not check_password_hash(user["password_hash"], current_password):
                        flash("Current password is incorrect", "error")
                        return redirect(url_for("profile"))
                    
                    # Update password
                    new_password_hash = generate_password_hash(new_password)
                    db.execute(
                        "UPDATE users SET password_hash = ? WHERE id = ?",
                        (new_password_hash, session["user_id"])
                    )
                    db.commit()
                    flash("Password changed successfully!", "success")
                    return redirect(url_for("profile"))
            
            # Get user info
            user = db.execute(
                "SELECT username, email, phone, created_at FROM users WHERE id = ?",
                (session["user_id"],)
            ).fetchone()
            
            # Get account info
            account = db.execute(
                "SELECT account_number, balance FROM accounts WHERE user_id = ?",
                (session["user_id"],)
            ).fetchone()
            
            return render_template("profile.html",
                                   username=user["username"],
                                   email=user["email"] or "",
                                   phone=user["phone"] or "",
                                   created_at=user["created_at"],
                                   account_number=account["account_number"],
                                   balance=account["balance"])
                                   
        except sqlite3.Error as e:
            flash(f"Database error: {str(e)}", "error")
            return redirect(url_for("dashboard"))
        finally:
            db.close()

    @app.route("/policies", methods=["GET", "POST"])
    def policies():
        if "user_id" not in session:
            flash("Please login first", "error")
            return redirect(url_for("login"))

        db = get_db()
        try:
            # Get account for header
            account = db.execute(
                "SELECT account_number, balance FROM accounts WHERE user_id = ?",
                (session["user_id"],)
            ).fetchone()

            if request.method == "POST":
                policy_id = request.form.get("policy_id")
                if not policy_id:
                    flash("No policy selected", "error")
                    return redirect(url_for("policies"))

                # Check current count
                count_row = db.execute(
                    "SELECT COUNT(*) AS c FROM user_policies WHERE user_id = ?",
                    (session["user_id"],)
                ).fetchone()
                if count_row["c"] >= 2:
                    flash("You can invest in at most 2 policies", "error")
                    return redirect(url_for("policies"))

                # Insert selection
                try:
                    db.execute(
                        "INSERT INTO user_policies (user_id, policy_id) VALUES (?, ?)",
                        (session["user_id"], int(policy_id))
                    )
                    db.commit()
                    flash("Policy added to your investments", "success")
                except sqlite3.IntegrityError as ie:
                    msg = str(ie)
                    if "at most 2" in msg:
                        flash("You can invest in at most 2 policies", "error")
                    elif "UNIQUE" in msg:
                        flash("You have already invested in this policy", "info")
                    else:
                        flash(f"Unable to invest: {msg}", "error")
                return redirect(url_for("policies"))

            # Fetch available policies
            all_policies = db.execute(
                "SELECT id, name, description, risk_level, expected_return, min_investment, goal, lock_in, liquidity FROM policies ORDER BY id"
            ).fetchall()

            # Fetch user's policies
            user_policies = db.execute(
                """
                SELECT p.id, p.name, p.description, p.risk_level, p.expected_return, p.min_investment, p.goal, p.lock_in, p.liquidity, up.invested_at
                FROM user_policies up
                JOIN policies p ON p.id = up.policy_id
                WHERE up.user_id = ?
                ORDER BY up.invested_at DESC
                """,
                (session["user_id"],)
            ).fetchall()

            return render_template(
                "policies.html",
                username=session["username"],
                account_number=account["account_number"],
                balance=account["balance"],
                policies=all_policies,
                user_policies=user_policies
            )
        finally:
            db.close()

    @app.route("/chatbot")
    def chatbot():
        if "user_id" not in session:
            flash("Please login first", "error")
            return redirect(url_for("login"))

        db = get_db()
        try:
            account = db.execute(
                "SELECT account_number, balance FROM accounts WHERE user_id = ?",
                (session["user_id"],)
            ).fetchone()
            return render_template(
                "chatbot.html",
                username=session["username"],
                account_number=account["account_number"],
                balance=account["balance"]
            )
        finally:
            db.close()

    def call_gemini_api(messages: list, policy_list: list, user_context: dict) -> str:
        """
        Calls the Gemini API using the 'google-generativeai' library.
        """
        global model # Access the model we created in create_app
        if model is None:
            return "Gemini API is not configured on the server."

        # Build the system instruction and prompt
        system_instructions = (
            "You are an AI investment assistant for Apex Bank. "
            "First, ask the user about their preferences (risk level, time horizon, liquidity needs). "
            "Then, recommend the top two policies from the provided list that best match. "
            "Respond clearly with brief reasoning and the two choices."
        )

        # Create a combined prompt for the model
        full_prompt = (
            f"{system_instructions}\n\n"
            f"--- AVAILABLE POLICIES ---\n{json.dumps(policy_list, indent=2)}\n\n"
            f"--- USER CONTEXT ---\n{json.dumps(user_context, indent=2)}\n\n"
            f"--- CONVERSATION HISTORY ---\n"
        )

        # Add conversation history
        for m in messages:
            # Change 'model' to 'assistant' for the prompt
            role = m.get("role", "user").replace("model", "assistant")
            full_prompt += f"{role}: {m.get('content', '')}\n"
    
        # Add the final "assistant:" prefix to prompt the model to respond
        full_prompt += "assistant:"

        try:
            # The library's generate_content method is much simpler
            response = model.generate_content(full_prompt)
            return response.text
        except Exception as e:
            # Handle potential API errors
            print(f"Gemini API Error: {e}")
            return f"Gemini API error: {str(e)}"

    @app.route("/api/chatbot", methods=["POST"])
    def chatbot_api():
        if "user_id" not in session:
            return {"error": "unauthorized"}, 401

        body = request.get_json(silent=True) or {}
        user_message = (body.get("message") or "").strip()
        if not user_message:
            return {"error": "empty_message"}, 400

        db = get_db()
        try:
            # Load policy list
            policies = db.execute(
                "SELECT id, name, description, risk_level, expected_return, min_investment, goal, lock_in, liquidity FROM policies ORDER BY id"
            ).fetchall()
            policy_list = [dict(p) for p in policies]

            # Load user context
            account = db.execute(
                "SELECT account_number, balance FROM accounts WHERE user_id = ?",
                (session["user_id"],)
            ).fetchone()
            user_pols = db.execute(
                """
                SELECT p.id, p.name, p.risk_level, p.expected_return, p.min_investment, up.invested_at
                FROM user_policies up
                JOIN policies p ON p.id = up.policy_id
                WHERE up.user_id = ?
                ORDER BY up.invested_at DESC
                """,
                (session["user_id"],)
            ).fetchall()
            user_context = {
                "username": session.get("username"),
                "balance": account["balance"] if account else None,
                "invested_policies": [dict(x) for x in user_pols]
            }

            # Maintain chat history in session
            history = session.get("chat_history", [])
            history.append({"role": "user", "content": user_message})

            reply_text = call_gemini_api(history, policy_list, user_context)

            # Save assistant reply to history
            history.append({"role": "model", "content": reply_text})
            session["chat_history"] = history

            return {"reply": reply_text}
        finally:
            db.close()
            
    @app.route("/logout")
    def logout():
        session.clear()
        flash("You have been logged out", "info")
        return redirect(url_for("home"))

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)