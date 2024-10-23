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

global user_id
global secret
global name
global url

def setup_config(): 
    global user_id
    global secret
    global name
    global url
    try:
        with open("config.json", "r") as f:
            config = json.load(f)
            user_id = config["id"]
            name = config["name"]
            url = config["url"]
    except Exception as e:
        logging.error(f"Error reading config: {e}")
        sys.exit(0)
    
    try:
        with open("secret.key", "r") as f:
            secret = f.read().strip()
    except Exception as e:
        logging.error(f"Error reading secret: {e}")
        sys.exit(0)

def main():
    print(secret)
    serial_channel = setup_gps()
    while True:
        try:
            lon, lat = get_lon_lat(serial_channel)
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
        serial_channel = serial.Serial('/dev/ttyUSB1', baudrate=9600, timeout=1)
        print("Connected to GPS SE100 NMEA")
    except:
        print("Disconnected to GPS SE100 NMEA")
        sys.exit(0)
    return serial_channel

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
    setup_config()
    logging.info("Attempting to connect to the server...")
    sio.connect(url, namespaces=["/producer"], transports=["websocket"])
    sio.emit("authenticate", {"id": user_id, "secret": secret}, namespace="/producer")
    sio.wait()

