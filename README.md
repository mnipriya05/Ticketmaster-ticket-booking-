# Ticket Master — Full-Stack Event Ticket Reservation Platform

Ticket Master is a full-stack event ticket reservation platform where users can
discover events, view event details, select seats from a visual stadium-style
seat map, reserve seats for 10 minutes, complete a mock payment, and view
booking history and tickets.

The project uses a React frontend and a Django REST Framework backend with JWT
authentication, REST APIs, MySQL, and Ticketmaster Discovery API integration.

## Live Demo

- GitHub Repository: [Ticket Master Repository](https://github.com/mnipriya05/Ticketmaster-ticket-booking-)

> The frontend and backend live demo links will be added after deployment.

## Screenshots

Screenshots will be added after final UI testing and deployment.

> Planned screenshots: Home page, event details, visual seat selection,
> booking summary, and booking history.

## Features

- User registration and login.
- JWT-based authentication for protected routes and APIs.
- Event discovery through the Ticketmaster Discovery API.
- Event list and event-details pages.
- Stadium-style visual seat-selection interface.
- Seat statuses for available, selected, reserved, and sold/booked seats.
- 10-minute seat reservation timer.
- Automatic release of reserved seats when the 10-minute timer expires.
- Booking summary before payment confirmation.
- Mock payment workflow.
- Ticket display for completed bookings.
- Booking history for authenticated users.
- REST APIs for events, seats, reservations, bookings, and tickets.
- React frontend connected to Django REST APIs using Axios.

## 10-Minute Seat Reservation Flow

To prevent seats from being held indefinitely, Ticket Master uses a temporary
seat-reservation workflow.

1. A logged-in user selects one or more available seats.
2. The selected seats are temporarily reserved for 10 minutes.
3. The application displays a countdown timer to the user.
4. Other users cannot book seats while they are temporarily reserved.
5. If the user completes the mock payment within 10 minutes, the booking is
   confirmed and the seats become sold/booked.
6. If the timer expires before payment confirmation, the reservation expires
   and the seats become available again.
7. The user can then select available seats again and start a new reservation.

This workflow helps reduce duplicate seat booking and simulates common
reservation behavior used by real ticket-booking platforms.

## Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React, React Router, Axios, HTML, CSS |
| Backend | Python, Django, Django REST Framework, Django ORM |
| Authentication | JWT Authentication |
| Database | MySQL |
| External API | Ticketmaster Discovery API |
| Tools | Git, GitHub, VS Code, Postman |

## Project Architecture

```text
ticket_frontend (React)
      |
      | Axios HTTP requests
      v
ticket_master (Django REST Framework)
      |
      | Django ORM
      v
MySQL Database
      |
      +--> Ticketmaster Discovery API
```

## User Flow

```text
Register / Login
      |
      v
Discover Events
      |
      v
View Event Details
      |
      v
Select Available Seats
      |
      v
Reserve Seats for 10 Minutes
      |
      v
Complete Mock Payment
      |
      +--> Payment completed: Booking confirmed and ticket created
      |
      +--> Timer expired: Reservation removed and seats become available
```

## Seat Statuses

| Status | Meaning |
|---|---|
| Available | The seat can be selected and reserved by a user |
| Selected | The seat is selected by the current user before reservation |
| Reserved | The seat is temporarily held for a user during the 10-minute reservation period |
| Sold / Booked | The seat is confirmed after successful mock payment and cannot be selected |

## API Modules

| Module | Purpose |
|---|---|
| Authentication API | User registration, login, and JWT token management |
| Event API | Event listing, event details, and external-event discovery |
| Seat API | Seat availability, selection, status, and reservation management |
| Reservation API | Temporary 10-minute seat reservations and expiry handling |
| Booking API | Booking creation and booking-history retrieval |
| Ticket API | Ticket display for confirmed bookings |

## Installation and Setup

### Prerequisites

Install the following before running the project:

- Python 3.10 or later
- Node.js 18 or later
- npm
- MySQL
- Git

### Clone the Repository

```bash
git clone [https://github.com/mnipriya05/Ticketmaster-ticket-booking-.git](https://github.com/mnipriya05/Ticketmaster-ticket-booking-.git)
cd Ticketmaster-ticket-booking-
```

## Backend Setup

Move to the Django backend folder:

```bash
cd ticket_master
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate the virtual environment.

### Windows PowerShell

```powershell
.\venv\Scripts\Activate.ps1
```

### Windows Command Prompt

```cmd
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file inside the `ticket_master` folder. Use
`.env.example` as a guide.

Run migrations:

```bash
python manage.py makemigrations
python manage.py migrate
```

Start the Django server:

```bash
python manage.py runserver
```

The Django backend usually runs at:

```text
http://127.0.0.1:8000/
```

## Frontend Setup

Open a new terminal in the root project folder, then move to the React frontend
folder:

```bash
cd ticket_frontend
```

Install frontend dependencies:

```bash
npm install
```

Create a `.env` file inside `ticket_frontend` and set the backend API URL:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/
```

Start the React development server:

```bash
npm run dev
```

The React frontend usually runs at:

```text
http://localhost:5173/
```

## Environment Variables

Do not upload your real `.env` file, API keys, database passwords, or Django
secret key to GitHub.

Create `ticket_master/.env.example`:

```env
DJANGO_SECRET_KEY=your_django_secret_key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=ticketmaster_db
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=localhost
DB_PORT=3306

TICKETMASTER_API_KEY=your_ticketmaster_api_key
```

Create `ticket_frontend/.env.example`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/
```

## Example API Endpoints

> Update these endpoint URLs if your Django `urls.py` uses different paths.

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| `POST` | `/api/register/` | Register a new user | No |
| `POST` | `/api/login/` | Log in and obtain JWT tokens | No |
| `GET` | `/api/events/` | Get the event list | No |
| `GET` | `/api/events/<id>/` | Get event details | No |
| `GET` | `/api/events/<id>/seats/` | Get seats for an event | No |
| `POST` | `/api/reservations/` | Temporarily reserve selected seats | Yes |
| `POST` | `/api/bookings/` | Confirm booking after mock payment | Yes |
| `GET` | `/api/bookings/` | Get booking history for the logged-in user | Yes |
| `GET` | `/api/tickets/` | Get tickets for the logged-in user | Yes |

## Authentication

Protected API endpoints require a valid JWT access token in the request header:

```http
Authorization: Bearer your_access_token
```

## Reservation Expiry Logic

The seat reservation is valid for 10 minutes.

- A reservation includes an expiry time.
- The application checks whether the reservation has expired.
- Expired reservations are released so the related seats can become available.
- A booking can be confirmed only before the reservation expiry time.
- After successful mock payment, reserved seats are marked as sold/booked.

## Future Improvements

- Deploy the React frontend and Django backend.
- Use PostgreSQL for the production database.
- Add a real payment gateway such as Razorpay or Stripe.
- Send email confirmation after successful booking.
- Add automated tests for booking, reservation expiry, and duplicate-seat prevention.
- Add search, filters, pagination, and event categories.
- Add admin dashboard analytics.
- Add rate limiting and stronger API validation.
- Add Docker support for easier deployment.
- Add an automated scheduled task for releasing expired reservations.

## Author

**Priya K**

- LinkedIn: [Priya K LinkedIn](https://www.linkedin.com/in/priya-k-23093b35a)
- GitHub: [mnipriya05](https://github.com/mnipriya05)

## License

This project was created for learning and portfolio purposes.


