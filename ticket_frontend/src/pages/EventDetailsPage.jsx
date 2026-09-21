import { useEffect, useMemo, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../api/api";

function EventDetailsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadEvent = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          `/api/mock-events/${eventId}/seats/`
        );

        const data = response.data;

        if (data.event) {
          setEvent({
            ...data.event,
            seats: data.seats || [],
          });
        } else {
          setEvent(data);
        }
      } catch (requestError) {
        console.error(
          "Event loading error:",
          requestError.response?.data ||
            requestError.message
        );

        if (requestError.response?.status === 401) {
          navigate("/login");
          return;
        }

        setError(
          requestError.response?.data?.detail ||
            "Could not load event."
        );
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      loadEvent();
    }
  }, [eventId, navigate]);

  const getSeatStatus = (seat) => {
    const status = String(
      seat.status ||
        seat.state ||
        "available"
    ).toLowerCase();

    if (
      status === "booked" ||
      status === "sold" ||
      status === "occupied"
    ) {
      return "booked";
    }

    if (
      status === "reserved" ||
      status === "pending"
    ) {
      return "reserved";
    }

    if (
      status === "unavailable" ||
      status === "blocked" ||
      status === "disabled"
    ) {
      return "unavailable";
    }

    if (selectedSeats.includes(seat.id)) {
      return "selected";
    }

    return "available";
  };

  const getRowLetter = (index) => {
    let result = "";
    let number = index + 1;

    while (number > 0) {
      number -= 1;

      result =
        String.fromCharCode(
          65 + (number % 26)
        ) + result;

      number = Math.floor(number / 26);
    }

    return result;
  };

  const getSeatNumber = (seat, indexInRow) => {
    const number =
      seat.seat_number ??
      seat.seatNumber ??
      seat.number;

    if (
      number !== undefined &&
      number !== null &&
      number !== ""
    ) {
      return number;
    }

    return indexInRow + 1;
  };

  const groupedRows = useMemo(() => {
    const allSeats = Array.isArray(event?.seats)
      ? event.seats
      : [];

    if (allSeats.length === 0) {
      return [];
    }

    const rowsWithBackendData = allSeats.some(
      (seat) =>
        seat.row ||
        seat.row_label ||
        seat.row_name
    );

    if (rowsWithBackendData) {
      const rowMap = {};

      allSeats.forEach((seat) => {
        const rowKey =
          seat.row ||
          seat.row_label ||
          seat.row_name ||
          "A";

        if (!rowMap[rowKey]) {
          rowMap[rowKey] = [];
        }

        rowMap[rowKey].push(seat);
      });

      return Object.entries(rowMap)
        .sort(([firstRow], [secondRow]) =>
          firstRow.localeCompare(secondRow)
        )
        .map(([rowLabel, rowSeats]) => ({
          rowLabel,
          seats: [...rowSeats].sort(
            (firstSeat, secondSeat) => {
              const firstNumber =
                firstSeat.seat_number ??
                firstSeat.seatNumber ??
                firstSeat.number ??
                0;

              const secondNumber =
                secondSeat.seat_number ??
                secondSeat.seatNumber ??
                secondSeat.number ??
                0;

              return (
                Number(firstNumber) -
                Number(secondNumber)
              );
            }
          ),
        }));
    }

    const seatsPerRow = 10;
    const generatedRows = [];

    for (
      let index = 0;
      index < allSeats.length;
      index += seatsPerRow
    ) {
      generatedRows.push({
        rowLabel: getRowLetter(
          index / seatsPerRow
        ),
        seats: allSeats.slice(
          index,
          index + seatsPerRow
        ),
      });
    }

    return generatedRows;
  }, [event]);

  const toggleSeat = (seat) => {
    const status = getSeatStatus(seat);

    const cannotSelect =
      status === "booked" ||
      status === "reserved" ||
      status === "unavailable";

    if (cannotSelect) {
      return;
    }

    setSelectedSeats((currentSeats) => {
      if (currentSeats.includes(seat.id)) {
        return currentSeats.filter(
          (seatId) => seatId !== seat.id
        );
      }

      return [...currentSeats, seat.id];
    });
  };

  const reserveSeats = async () => {
    if (selectedSeats.length === 0) {
      setError(
        "Please select at least one seat."
      );
      return;
    }

    if (reserving) {
      return;
    }

    try {
      setReserving(true);
      setError("");

      const response = await api.post(
        `/api/mock-events/${eventId}/reserve/`,
        {
          seat_ids: selectedSeats,
        }
      );

      const bookingId =
        response.data.booking_id ||
        response.data.booking?.id ||
        response.data.id;

      if (!bookingId) {
        setError(
          "Reservation succeeded, but no booking ID was returned."
        );
        return;
      }

      navigate(`/bookings/${bookingId}`);
    } catch (requestError) {
      console.error(
        "Reservation error:",
        requestError.response?.data ||
          requestError.message
      );

      if (requestError.response?.status === 401) {
        navigate("/login");
        return;
      }

      setError(
        requestError.response?.data?.detail ||
          requestError.response?.data?.error ||
          "Could not reserve seats."
      );
    } finally {
      setReserving(false);
    }
  };

  if (loading) {
    return (
      <main className="event-details-page">
        <section className="event-details-container">
          <div className="event-details-card state-card">
            <div className="loading-spinner"></div>
            <h1>Loading event...</h1>
          </div>
        </section>
      </main>
    );
  }

  if (error && !event) {
    return (
      <main className="event-details-page">
        <section className="event-details-container">
          <div className="event-details-card state-card">
            <p className="error-message">
              {error}
            </p>

            <Link
              to="/events"
              className="back-link"
            >
              ← Back to events
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="event-details-page">
        <section className="event-details-container">
          <div className="event-details-card state-card">
            <h1>Event not found</h1>

            <Link
              to="/events"
              className="back-link"
            >
              ← Back to events
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const eventName =
    event.name ||
    event.title ||
    event.event_name ||
    "Event";

  const eventDate =
    event.date ||
    event.event_date ||
    event.start_time;

  const eventPrice =
    event.price ??
    event.ticket_price ??
    event.price_per_ticket ??
    event.price_per_seat ??
    0;

  const selectedSeatObjects = (
    event.seats || []
  ).filter((seat) =>
    selectedSeats.includes(seat.id)
  );

  const selectedTotal =
    selectedSeatObjects.reduce(
      (total, seat) =>
        total +
        Number(
          seat.price ??
            eventPrice ??
            0
        ),
      0
    );

  return (
    <main className="event-details-page">
      <section className="event-details-container">
        <div className="event-details-card">
          <header className="event-details-header">
            <div className="event-details-image-wrapper">
              {event.image_url ? (
                <img
                  className="event-details-image"
                  src={event.image_url}
                  alt={eventName}
                  width="1200"
                  height="675"
                  loading="eager"
                  decoding="async"
                  onError={(imageEvent) => {
                    imageEvent.currentTarget.style.display =
                      "none";
                  }}
                />
              ) : (
                <div className="event-details-image-placeholder">
                  <span>LIVE EVENT</span>
                </div>
              )}

              <div className="event-details-image-overlay"></div>
            </div>

            <div className="event-details-header-content">
              <Link
                to="/events"
                className="details-back-link"
              >
                ← All events
              </Link>

              <p className="section-eyebrow">
                LIVE EVENT
              </p>

              <h1>{eventName}</h1>

              <div className="event-details-meta">
                <span>
                  📅{" "}
                  {eventDate
                    ? new Date(
                        eventDate
                      ).toLocaleString()
                    : "Date to be announced"}
                </span>

                <span>
                  📍{" "}
                  {event.venue_name ||
                    event.venue ||
                    "Venue unavailable"}
                </span>

                <span>
                  🌍{" "}
                  {event.city ||
                    event.location ||
                    "Location unavailable"}
                </span>
              </div>
            </div>
          </header>

          <div className="event-details-body">
            <section className="seat-map-section">
              <div className="seat-section-heading">
                <div>
                  <p className="section-eyebrow">
                    SELECT YOUR EXPERIENCE
                  </p>

                  <h2 className="seat-map-title">
                    Choose your seats
                  </h2>

                  <p className="seat-map-description">
                    Select the available seats you
                    want to reserve.
                  </p>
                </div>

                <div className="base-price">
                  From ₹
                  {Number(
                    eventPrice || 0
                  ).toFixed(2)}
                </div>
              </div>

              <div className="seat-map-shell">
                <div className="stage-label">
                  STAGE
                </div>

                <div className="seat-legend">
                  <span className="seat-legend-item">
                    <span className="seat-legend-color available"></span>
                    Available
                  </span>

                  <span className="seat-legend-item">
                    <span className="seat-legend-color selected"></span>
                    Selected
                  </span>

                  <span className="seat-legend-item">
                    <span className="seat-legend-color reserved"></span>
                    Reserved
                  </span>

                  <span className="seat-legend-item">
                    <span className="seat-legend-color unavailable"></span>
                    Unavailable
                  </span>

                  <span className="seat-legend-item">
                    <span className="seat-legend-color booked"></span>
                    Booked
                  </span>
                </div>

                {groupedRows.length === 0 ? (
                  <div className="no-seats-message">
                    <span className="no-seats-icon">
                      ◎
                    </span>

                    <h3>No seats available</h3>

                    <p>
                      Seats are not available for
                      this event right now.
                    </p>
                  </div>
                ) : (
                  <div className="seat-rows">
                    {groupedRows.map((row) => (
                      <div
                        className="seat-row"
                        key={row.rowLabel}
                      >
                        <span className="seat-row-label">
                          {row.rowLabel}
                        </span>

                        <div className="row-seats">
                          {row.seats.map(
                            (seat, index) => {
                              const seatStatus =
                                getSeatStatus(seat);

                              const seatNumber =
                                getSeatNumber(
                                  seat,
                                  index
                                );

                              const displayLabel =
                                `${row.rowLabel}${seatNumber}`;

                              const isDisabled =
                                seatStatus ===
                                  "booked" ||
                                seatStatus ===
                                  "reserved" ||
                                seatStatus ===
                                  "unavailable";

                              return (
                                <button
                                  type="button"
                                  key={seat.id}
                                  className={`stadium-seat ${seatStatus}`}
                                  onClick={() =>
                                    toggleSeat(seat)
                                  }
                                  disabled={
                                    isDisabled
                                  }
                                  title={`${displayLabel}: ${seatStatus}`}
                                  aria-label={`${displayLabel}, ${seatStatus}`}
                                >
                                  {seatNumber}
                                </button>
                              );
                            }
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <aside className="booking-summary-card">
              <div className="summary-icon">
                🎟️
              </div>

              <h2>Your selection</h2>

              <p className="summary-subtitle">
                Review your seats before continuing.
              </p>

              <div className="booking-summary-row">
                <span>Event</span>
                <strong>{eventName}</strong>
              </div>

              <div className="booking-summary-row">
                <span>Seats selected</span>
                <strong>
                  {selectedSeats.length}
                </strong>
              </div>

              <div className="booking-summary-row">
                <span>Price per seat</span>
                <strong>
                  ₹{Number(
                    eventPrice || 0
                  ).toFixed(2)}
                </strong>
              </div>

              <div className="selected-seat-list">
                {selectedSeats.length === 0 ? (
                  <p>No seats selected yet.</p>
                ) : (
                  selectedSeatObjects.map(
                    (seat, index) => (
                      <span
                        className="selected-seat-chip"
                        key={seat.id}
                      >
                        {seat.row ||
                          getRowLetter(0)}
                        {getSeatNumber(
                          seat,
                          index
                        )}
                      </span>
                    )
                  )
                )}
              </div>

              <div className="summary-total">
                <span>Total</span>

                <strong>
                  ₹{selectedTotal.toFixed(2)}
                </strong>
              </div>

              {error && (
                <p className="error-message">
                  {error}
                </p>
              )}

              <button
                type="button"
                className="reserve-button"
                onClick={reserveSeats}
                disabled={
                  reserving ||
                  selectedSeats.length === 0
                }
              >
                {reserving
                  ? "Reserving seats..."
                  : "Reserve selected seats"}
              </button>

              <p className="secure-note">
                🔒 Your seats are held securely
                during checkout.
              </p>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}

export default EventDetailsPage;