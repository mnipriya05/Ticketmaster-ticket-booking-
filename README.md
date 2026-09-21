# Ticketmaster Ticket Booking
A full-stack ticket booking application built with Django REST Framework and React.
## Features
- Browse events from Ticketmaster.
- View event details.
- Register and log in users.
- Authenticate with JWT.
- Select seats and create bookings.
- View booking history.
## Technologies
- Django
- Django REST Framework
- Simple JWT
- React
- Vite
- SQLite
- Ticketmaster Discovery API
## Backend setup
`powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
`
## Frontend setup
`powershell
cd ticket_frontend
npm install
npm run dev
`
## Environment variables
Create a .env file in the project root:
`env
SECRET_KEY=replace_with_your_secret_key
TICKETMASTER_API_KEY=replace_with_your_ticketmaster_api_key
`
Do not upload .env to GitHub.
## Local URLs
- Django backend: http://127.0.0.1:8000/
- React frontend: http://localhost:5173/
