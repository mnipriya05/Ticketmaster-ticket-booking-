from django.core.management.base import BaseCommand

from events.models import Seat


class Command(BaseCommand):
    help = "Update seat prices from event prices"

    def handle(self, *args, **options):
        updated_count = 0

        seats = Seat.objects.select_related("event").iterator(
            chunk_size=500
        )

        for seat in seats:
            new_price = seat.event.price_per_seat

            Seat.objects.filter(
                id=seat.id
            ).update(
                price=new_price
            )

            updated_count += 1

            if updated_count % 500 == 0:
                self.stdout.write(
                    f"Updated {updated_count} seats..."
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"Updated {updated_count} seat prices."
            )
        )