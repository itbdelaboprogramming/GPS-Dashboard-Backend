import socketio
import json
import time
import threading
import logging
import signal
import sys

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s: %(message)s')

sio = socketio.Client()
user_id = "your_id"
secret = "your_secret"

def main():
    while True:
        try:
            payload = {
                "id": user_id,
                "latitude": 6.89,
                "longitude": 107.6,
                "status": "GPS Not Ready",
                "vehicleName": "Car A"
            }
            json_payload = json.dumps(payload)
            logging.info(json_payload)
            sio.emit("gps", json_payload)
            time.sleep(1)
        except Exception as e:
            logging.error(f"Error sending data: {e}")

@sio.event
def connect():
    try:
        sio.emit("authenticate", {"id": user_id, "secret": secret})
        logging.info("Connected to the server")
    except Exception as e:
        logging.error(f"Error connecting to the server: {e}")

@sio.event
def authenticated(data):
    logging.info("Authenticated successfully")
    threading.Thread(target=main, daemon=True).start()

@sio.event
def disconnect():
    logging.info("Disconnected from server")

def signal_handler(sig, frame):
    logging.info("Shutting down...")
    sio.disconnect()
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

if __name__ == "__main__":
    sio.connect("http://localhost:3000")
    sio.wait()
