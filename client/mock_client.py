import socketio
import json
import time
import threading
import logging
import signal
import sys

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s: %(message)s')

sio = socketio.Client(logger=True)

client_id = "your_id"
secret = "your_secret"

def main():
    while True:
        try:
            payload = {
                "id": client_id,
                "latitude": 6.89,
                "longitude": 107.6,
                "status": "GPS Not Ready",
                "name": "Car A"
            }
            json_payload = json.dumps(payload)
            logging.info(f"Sending GPS data: {json_payload}")
            sio.emit("gps", json_payload, namespace="/producer")
        except Exception as e:
            logging.error(f"Error sending data: {e}")
        finally:
            time.sleep(1)


@sio.on("authenticated", namespace="/producer")
def authenticated(data):
    logging.info("Authenticated successfully")
    threading.Thread(target=main, daemon=True).start()

@sio.event
def connect_error(data):
    logging.error(f"Failed to connect: {data}")

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
    logging.info("Attempting to connect to the server...")
    sio.connect("http://localhost:3000", namespaces=["/producer"], transports=["websocket"])
    sio.emit("authenticate", {"id": client_id, "secret": secret}, namespace="/producer")
    sio.wait()