import { Link } from "react-router-dom";

function HomePage() {
  return (
    <main className="home-page">
      <nav className="navbar">
        <Link
          to="/"
          className="brand"
        >
          Ticket Booking
        </Link>

        <div className="nav-links">
          <Link
            to="/login"
            className="login-link"
          >
            Login
          </Link>

          <Link
            to="/register"
            className="nav-button"
          >
            Create account
          </Link>
        </div>
      </nav>

      <section className="hero-section">
        <p className="hero-label">
          LIVE EVENTS • EASY BOOKING
        </p>

        <h1>
          Find your next
          <span> unforgettable event.</span>
        </h1>

        <p className="hero-description">
          Discover concerts and live events, select
          your seats, reserve your booking, complete
          payment, and access your ticket—all in one
          place.
        </p>

        <div className="hero-actions">
          <Link
            to="/events"
            className="primary-button"
          >
            Browse Events
          </Link>

          <Link
            to="/login"
            className="secondary-button"
          >
            Login to Book
          </Link>
        </div>
      </section>

      <section className="steps-section">
        <h2>
          Book your ticket in four steps
        </h2>

        <div className="steps-grid">
          <article className="step-card">
            <span>01</span>

            <h3>Discover</h3>

            <p>
              Browse available concerts and events.
            </p>
          </article>

          <article className="step-card">
            <span>02</span>

            <h3>Select Seats</h3>

            <p>
              Choose the seats you want from the seat
              map.
            </p>
          </article>

          <article className="step-card">
            <span>03</span>

            <h3>Reserve &amp; Pay</h3>

            <p>
              Reserve your seats and complete the
              payment step.
            </p>
          </article>

          <article className="step-card">
            <span>04</span>

            <h3>Get Ticket</h3>

            <p>
              View your ticket and booking history
              anytime.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}

export default HomePage;