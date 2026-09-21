from decimal import Decimal

from django.core.management.base import BaseCommand

from events.models import MockEvent, Seat


class Command(BaseCommand):
    help = "Create missing seats for all events"

    def add_arguments(self, parser):
        parser.add_argument(
            "--rows",
            type=int,
            default=10,
        )

        parser.add_argument(
            "--seats-per-row",
            type=int,
            default=10,
        )

    def handle(self, *args, **options):
        rows_count = options["rows"]
        seats_per_row = options["seats_per_row"]

        events = MockEvent.objects.all()

        if not events.exists():
            self.stdout.write(
                self.style.WARNING(
                    "No events found. Run sync_ticketmaster first."
                )
            )
            return

        total_created = 0

        for event in events:
            existing_seats = set(
                Seat.objects.filter(
                    event=event,
                ).values_list(
                    "row",
                    "number",
                )
            )

            seats_to_create = []

            for row_index in range(rows_count):
                row_name = chr(ord("A") + row_index)

                for seat_number in range(1, seats_per_row + 1):
                    number = str(seat_number)

                    if (row_name, number) in existing_seats:
                        continue

                    seats_to_create.append(
                        Seat(
                            event=event,
                            row=row_name,
                            number=number,
                            status="available",
                            price=event.price_per_seat or Decimal("0.00"),
                        )
                    )

            if seats_to_create:
                Seat.objects.bulk_create(
                    seats_to_create,
                    batch_size=500,
                )

                total_created += len(seats_to_create)

            self.stdout.write(
                f"Finished event {event.id}: {event.name}"
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Created {total_created} missing seats."
            )
        )