import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/api";
import "./EventsPage.css";

function EventsPage() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const accessToken = localStorage.getItem("access_token");

    if (!accessToken) {
      navigate("/login");
      return;
    }

    const loadEvents = async () => {
      try {
        const response = await api.get("/api/mock-events/");
        setEvents(response.data);
      } catch (requestError) {
        console.error(
          "Events error:",
          requestError.response?.data || requestError.message
        );

        if (requestError.response?.status === 401) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          navigate("/login");
          return;
        }

        setError("Could not load events.");
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [navigate]);

  const cities = useMemo(() => {
    return [...new Set(events.map((event) => event.city).filter(Boolean))];
  }, [events]);

  const filteredEvents = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return events.filter((event) => {
      const searchableText = [
        event.name,
        event.venue_name,
        event.city,
        event.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchableText.includes(normalizedSearch);
      const matchesCity =
        cityFilter === "" || event.city === cityFilter;

      return matchesSearch && matchesCity;
    });
  }, [events, searchText, cityFilter]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/login");
  };

  if (loading) {
    return (
      <main className="loading-page">
        <div className="loading-card">
          <div className="loading-spinner"></div>
          <h2>Finding amazing events...</h2>
          <p>Please wait.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="events-page">

      {/* TOP HEADER */}
      <nav className="events-navbar">
        <Link to="/" className="brand">
          TICKET<span>HUB</span>
        </Link>

        <div className="category-links">
          <button onClick={() => setSearchText("")}>
            All Events
          </button>

          <button onClick={() => setSearchText("concert")}>
            Concerts
          </button>

          <button onClick={() => setSearchText("sport")}>
            Sports
          </button>

          <button onClick={() => setSearchText("theatre")}>
            Arts & Theatre
          </button>

          <button onClick={() => setSearchText("comedy")}>
            Comedy
          </button>
        </div>

        <div className="nav-actions">
          <Link to="/bookings/history" className="history-link">
            My Bookings
          </Link>

          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </nav>

      {/* HERO / SEARCH AREA */}
      <section className="events-hero">

        <div className="hero-content">
          <p className="hero-label">LIVE EVENTS • CONCERTS • SPORTS</p>

          <h1>
            Find your next
            <br />
            <span>experience.</span>
          </h1>

          <p className="hero-description">
            Discover music, sports, theatre and live entertainment.
          </p>
        </div>

        {/* SEARCH BOX */}
        <div className="search-panel">

          <div className="search-field search-main">
            <span className="search-icon">⌕</span>

            <div>
              <label>SEARCH</label>

              <input
                type="search"
                value={searchText}
                onChange={(event) =>
                  setSearchText(event.target.value)
                }
                placeholder="Artist, event or venue"
              />
            </div>
          </div>

          <div className="search-field">
            <span className="search-icon">⌖</span>

            <div>
              <label>LOCATION</label>

              <select
                value={cityFilter}
                onChange={(event) =>
                  setCityFilter(event.target.value)
                }
              >
                <option value="">All cities</option>

                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            className="search-button"
            onClick={() => {}}
          >
            Search
          </button>
        </div>
      </section>

      {/* EVENTS SECTION */}
      <section className="events-container">

        <div className="events-title-row">
          <div>
            <p className="section-label">DISCOVER</p>

            <h2>Events near you</h2>
          </div>

          <p className="event-count">
            {filteredEvents.length} events
          </p>
        </div>

        {error && (
          <p className="error-message">
            {error}
          </p>
        )}

        {!error && filteredEvents.length === 0 && (
          <div className="empty-events">
            <h2>No matching events</h2>

            <p>
              Try another search term or select a different city.
            </p>

            <button
              onClick={() => {
                setSearchText("");
                setCityFilter("");
              }}
            >
              Show all events
            </button>
          </div>
        )}

        {/* EVENT GRID */}
        <div className="events-grid">

          {filteredEvents.map((event) => (

            <article
              className="event-card"
              key={event.id}
            >

              {/* IMAGE AREA */}
<div className="event-image">
  {event.image_url ? (
    <img
      src={event.image_url}
      alt={event.name || "Live event"}
      loading="lazy"
      decoding="async"
      width="800"
      height="450"
      onError={(imageEvent) => {
        imageEvent.currentTarget.style.display = "none";
      }}
    />
  ) : (
    <div className="image-placeholder">
      <span>LIVE EVENT</span>
    </div>
  )}

  <span className="event-badge">
    LIVE
  </span>
</div>
              {/* CARD CONTENT */}
              <div className="event-card-content">

                <p className="event-date">
                  {new Date(
                    event.event_date
                  ).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </p>

                <h3>{event.name}</h3>

                <div className="event-location">

                  <span>📍</span>

                  <div>
                    <strong>
                      {event.venue_name}
                    </strong>

                    <p>{event.city}</p>
                  </div>

                </div>

                <div className="event-card-bottom">

                  <div>
                    <span className="price-label">
                      Tickets from
                    </span>

                    <strong className="event-price">
                      ₹{event.price_per_seat}
                    </strong>
                  </div>

                  <Link
                    to={`/events/${event.id}`}
                    className="event-details-button"
                  >
                    View Event
                  </Link>

                </div>

              </div>

            </article>

          ))}

        </div>

      </section>

    </main>
  );
}

export default EventsPage;

