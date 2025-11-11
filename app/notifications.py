from datetime import datetime


def send_notification(channel: str, recipient: str, subject: str, message: str) -> None:
    # Placeholder: integrate with SMS/Email/Push here
    print(f"[{datetime.utcnow().isoformat()}] [{channel}] To: {recipient} | {subject} -> {message}")
