import { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import api from "../api/api";

function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await api.post(
        "/api/token/",
        {
          email,
          password,
        }
      );

      localStorage.setItem(
        "access_token",
        response.data.access
      );

      localStorage.setItem(
        "refresh_token",
        response.data.refresh
      );

      navigate("/events");
    } catch (requestError) {
      console.error(
        "Login error:",
        requestError.response?.data ||
          requestError.message
      );

      const responseData =
        requestError.response?.data;

      if (responseData?.detail) {
        setError(responseData.detail);
      } else if (responseData?.email) {
        setError(
          responseData.email.join(" ")
        );
      } else if (responseData?.password) {
        setError(
          responseData.password.join(" ")
        );
      } else {
        setError(
          "Login failed. Check your email and password."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="simple-page">
      <section className="simple-card">
        <Link
          to="/"
          className="back-link"
        >
          ← Back to home
        </Link>

        <p className="hero-label">
          WELCOME BACK
        </p>

        <h1>Login</h1>

        <p>
          Log in to browse events and book your seats.
        </p>

        {error && (
          <p className="error-message">
            {error}
          </p>
        )}

        <form
          className="login-form"
          onSubmit={handleSubmit}
        >
          <label htmlFor="login-email">
            Email

            <input
              id="login-email"
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

          <label htmlFor="login-password">
            Password

            <input
              id="login-password"
              type="password"
              name="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </label>

          <button
            type="submit"
            className="primary-button full-button"
            disabled={loading}
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>
        </form>

        <p className="register-login-text">
          Don&apos;t have an account?{" "}

          <Link
            to="/register"
            className="create-account-link"
          >
            Create account
          </Link>
        </p>
      </section>
    </main>
  );
}

export default LoginPage;