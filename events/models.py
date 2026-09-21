import json
import uuid

from django.conf import settings
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")

        email = self.normalize_email(email)

        user = self.model(
            email=email,
            **extra_fields,
        )

        user.set_password(password)
        user.save(using=self._db)

        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")

        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(
            email,
            password,
            **extra_fields,
        )


class User(AbstractUser):
    username = None

    email = models.EmailField(
        unique=True,
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return self.email


class MockEvent(models.Model):
    tm_event_id = models.CharField(
        max_length=100,
        unique=True,
        null=True,
        blank=True,
    )

    name = models.CharField(
        max_length=255,
    )

    description = models.TextField(
        blank=True,
    )

    event_date = models.DateTimeField(
        null=True,
        blank=True,
    )

    venue_name = models.CharField(
        max_length=255,
        blank=True,
    )

    city = models.CharField(
        max_length=100,
        blank=True,
    )

    price_per_seat = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
    )

    seatmap_url = models.URLField(
        blank=True,
    )

    raw_data = models.TextField(
        default="{}",
        blank=True,
    )

    def __str__(self):
        return f"{self.name} @ {self.venue_name}"


class Seat(models.Model):
    STATUS_CHOICES = [
        ("available", "Available"),
        ("reserved", "Reserved"),
        ("sold", "Sold"),
    ]

    event = models.ForeignKey(
        MockEvent,
        on_delete=models.CASCADE,
        related_name="seats",
    )

    row = models.CharField(
        max_length=10,
    )

    number = models.CharField(
        max_length=10,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="available",
    )

    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
    )

    pos_x = models.FloatField(
        null=True,
        blank=True,
        help_text="X position percentage",
    )

    pos_y = models.FloatField(
        null=True,
        blank=True,
        help_text="Y position percentage",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=[
                    "event",
                    "row",
                    "number",
                ],
                name="unique_event_seat",
            ),
        ]

        ordering = [
            "row",
            "number",
        ]

    def __str__(self):
        return f"{self.event.name} - {self.row}{self.number}"


class Booking(models.Model):
    STATUS_CHOICES = [
        ("reserved", "Reserved"),
        ("confirmed", "Confirmed"),
        ("cancelled", "Cancelled"),
        ("expired", "Expired"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="bookings",
    )

    mock_event = models.ForeignKey(
        MockEvent,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="bookings",
    )

    tm_event_id = models.CharField(
        max_length=100,
        blank=True,
    )

    event_name = models.CharField(
        max_length=255,
    )

    event_date = models.DateTimeField(
        null=True,
        blank=True,
    )

    venue_name = models.CharField(
        max_length=255,
        blank=True,
    )

    city = models.CharField(
        max_length=100,
        blank=True,
    )

    num_tickets = models.PositiveIntegerField(
        default=1,
    )

    price_per_ticket = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
    )

    total_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="reserved",
    )

    seats = models.TextField(
        default="[]",
        blank=True,
        help_text='JSON list such as ["A1", "A2"]',
    )

    ticket_id = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        unique=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    expires_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    def __str__(self):
        return f"{self.user.email} - {self.event_name} ({self.status})"

    def seats_list(self):
        if not self.seats:
            return []

        try:
            return json.loads(self.seats)
        except (ValueError, TypeError):
            return []


class FavoriteEvent(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="favorite_events",
    )

    tm_event_id = models.CharField(
        max_length=100,
    )

    name = models.CharField(
        max_length=255,
    )

    url = models.URLField(
        blank=True,
    )

    event_date = models.DateTimeField(
        null=True,
        blank=True,
    )

    venue_name = models.CharField(
        max_length=255,
        blank=True,
    )

    city = models.CharField(
        max_length=100,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=[
                    "user",
                    "tm_event_id",
                ],
                name="unique_user_favorite_event",
            ),
        ]

        ordering = [
            "-created_at",
        ]

    def __str__(self):
        return f"{self.user.email} - {self.name}"