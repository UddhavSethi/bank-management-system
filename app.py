from flask import Flask, render_template


def create_app() -> Flask:
    app = Flask(__name__)

    @app.route("/")
    def home():
        # Renders the landing page as the home route
        return render_template("landing.html")

    @app.route("/login")
    def login():
        # Renders the login page
        return render_template("login.html")

    @app.route("/register")
    def register():
        # Renders the registration page
        return render_template("register.html")

    return app


if __name__ == "__main__":
    # Create and run the Flask app for local development
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)


