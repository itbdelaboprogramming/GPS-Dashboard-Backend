import socketio
import json
import time
import threading
import logging
import signal
import sys
import serial
import pynmea2

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s: %(message)s')

sio = socketio.Client(logger=True)

user_id = "your_id"
secret = "your_secret"
name = "Device name"
url = "http://localhost:3000"

def main():
    while True:
        try:
            lon, lat = get_lon_lat(serial)
            if lon is None or lat is None:
                continue
            payload = {
                "id": user_id,
                "latitude": lat,
                "longitude": lon,
                "status": "GPS Not Ready",
                "name": name
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

def setup_gps():
    try:
        serial = serial.Serial('/dev/ttyUSB1', baudrate=9600, timeout=1)
        print("Connected to GPS SE100 NMEA")
    except:
        print("Disconnected to GPS SE100 NMEA")
        sys.exit(0)
    return serial

def get_lon_lat(serial):
    line = serial.readline().decode('utf-8', errors='replace')
    line = line.strip()
    if '$GNGGA' in line:
        msg = pynmea2.parse(line)
        lat = msg.latitude
        lon = msg.longitude
        return lon, lat
    else: 
        return None, None
    


signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

if __name__ == "__main__":
    logging.info("Attempting to connect to the server...")
    sio.connect(url, namespaces=["/producer"], transports=["websocket"])
    sio.emit("authenticate", {"id": user_id, "secret": secret}, namespace="/producer")
    sio.wait()

