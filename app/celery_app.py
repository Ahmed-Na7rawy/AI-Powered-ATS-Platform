import logging
from app.config import settings

logger = logging.getLogger("ats_tasks")

# If Redis is not available, use a stub instead of Celery
if settings.REDIS_URL:
    from celery import Celery

    celery_app = Celery(
        "ats_tasks",
        broker=settings.REDIS_URL,
    )

    celery_app.conf.update(
        task_serializer='json',
        accept_content=['json'],
        result_serializer='json',
        timezone='UTC',
        enable_utc=True,
    )

    @celery_app.task(name="send_email")
    def send_email_task(recipient_email: str, subject: str, body: str):
        # Mock sending logic. In a real app, this integrates with SendGrid/SMTP
        logger.info(f"[Celery] Sending email to {recipient_email} | Subject: {subject}")
        return True
else:
    celery_app = None

    class _StubTask:
        """Stub that logs locally when Redis/Celery is unavailable."""
        @staticmethod
        def delay(recipient_email: str, subject: str, body: str):
            logger.info(f"[Local Stub] Would send email to {recipient_email} | Subject: {subject}")
            return True

    send_email_task = _StubTask()
