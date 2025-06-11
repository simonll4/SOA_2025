from apscheduler.schedulers.background import BackgroundScheduler
import time
import logging

from sync.sync_users import sync_users
from sync.config import SYNC_INTERVAL

logging.basicConfig(level=logging.INFO)


def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(sync_users, "interval", seconds=SYNC_INTERVAL)
    sync_users()
    scheduler.start()
    return scheduler


if __name__ == "__main__":
    scheduler = start_scheduler()

    try:
        while True:
            time.sleep(60)
    except (KeyboardInterrupt, SystemExit):
        scheduler.shutdown()
