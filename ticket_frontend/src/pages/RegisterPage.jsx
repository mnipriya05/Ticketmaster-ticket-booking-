import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../api/api";

function RegisterPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must contain at least 8 characters."
      );
      return;
    }

    if (password !== password2) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await api.post(
        "/api/auth/register/",
        {
          email: email.trim(),
          password,
          password2,
        }
      );

      setSuccess(
        "Account created successfully. Redirecting to login..."
      );

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (requestError) {
      console.error(
        "Registration error:",
        requestError.response?.data ||
          requestError.message
      );

      const responseData =
        requestError.response?.data;

      if (typeof responseData === "object") {
        const firstError = Object.values(
          responseData
        ).flat()[0];

        setError(
          firstError ||
            "Could not create account."
        );
      } else {
        setError("Could not create account.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="simple-page">
      <section className="simple-card register-card">
        <p className="hero-label">
          JOIN TICKET MASTER
        </p>

        <h1>Create account</h1>

        <p>
          Create an account to reserve seats and
          manage your bookings.
        </p>

        <form
          className="login-form register-form"
          onSubmit={handleSubmit}
        >
          <label htmlFor="register-email">
            Email

            <input
              id="register-email"
              type="email"
              name="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="Enter your email"
              autoComplete="email"
              required
            />
          </label>

          <label htmlFor="register-password">
            Password

            <input
              id="register-password"
              type="password"
              name="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="At least 8 characters"
              autoComplete="new-password"
              required
            />
          </label>

          <label htmlFor="register-password2">
            Confirm password

            <input
              id="register-password2"
              type="password"
              name="password2"
              value={password2}
              onChange={(event) =>
                setPassword2(event.target.value)
              }
              placeholder="Repeat your password"
              autoComplete="new-password"
              required
            />
          </label>

          {error && (
            <p className="error-message">
              {error}
            </p>
          )}

          {success && (
            <p className="success-message">
              {success}
            </p>
          )}

          <button
            type="submit"
            className="primary-button full-button"
            disabled={loading}
          >
            {loading
              ? "Creating account..."
              : "Create account"}
          </button>
        </form>

        <p className="register-login-text">
          Already have an account?{" "}
          <Link
            to="/login"
            className="back-link"
          >
            Login
          </Link>
        </p>

        <Link
          to="/"
          className="back-link"
        >
          ← Back to home
        </Link>
      </section>
    </main>
  );
}

export default RegisterPage;