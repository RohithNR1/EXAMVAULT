import uuid

from django.db import migrations, models


def populate_anonymous_ids(apps, schema_editor):
    Request = apps.get_model("exams", "Request")
    for request in Request.objects.filter(anonymous_id__isnull=True).iterator():
        request.anonymous_id = uuid.uuid4()
        request.save(update_fields=["anonymous_id"])


class Migration(migrations.Migration):

    dependencies = [
        ("exams", "0006_auditlog"),
    ]

    operations = [
        migrations.AddField(
            model_name="request",
            name="anonymous_id",
            field=models.UUIDField(
                editable=False,
                null=True,
            ),
        ),
        migrations.RunPython(
            populate_anonymous_ids,
            reverse_code=migrations.RunPython.noop,
        ),
        migrations.AlterField(
            model_name="request",
            name="anonymous_id",
            field=models.UUIDField(
                db_index=True,
                default=uuid.uuid4,
                editable=False,
                unique=True,
            ),
        ),
    ]
