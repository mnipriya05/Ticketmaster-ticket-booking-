# Ticketmaster Ticket Booking
A full-stack ticket booking application built with Django REST Framework and React.
## Features
- Browse events from Ticketmaster
- View event details
- Register and log in users
- JWT authentication
- Seat selection and booking
- Booking history
## Technologies
- Django
- Django REST Framework
- Simple JWT
- React
- Vite
- SQLite
- Ticketmaster Discovery API
## Backend setup
1. Create and activate a virtual environment.
2. Install dependencies with pip install -r requirements.txt.
3. Run python manage.py migrate.
4. Run python manage.py runserver.
## Frontend setup
1. Run cd ticket_frontend.
2. Run 
pm install.
3. Run 
pm run dev.
## Environment variables
Create a .env file in the project root with SECRET_KEY and TICKETMASTER_API_KEY.
Never upload .env to GitHub.
## Local URLs
- Django backend: http://127.0.0.1:8000/
- React frontend: http://localhost:5173/
