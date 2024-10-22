import { Server } from "socket.io";
import { registerMovingTimeout, registerConnectionTimeout, resetTimeout, MOVING_TIMEOUT } from "./timeoutService.js";
import { getVehicleById } from "./databaseService.js";
import { time } from "console";

const POLLING_INTERVAL = 1000;
export let vehicles = new Map();
let socketToVehicles = new Map();
const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:4200"],
      methods: ["GET", "POST"],
      allowedHeaders: ["my-custom-header"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Connected socket", socket.id);
    setTimeout(() => { 
        if (!socketToVehicles.has(socket.id)) {
            socket.disconnect();
            console.log("Disconnected socket", socket.id);
        }
    }, 10000);

    socket.on("authenticate", async (data) => {
        const { id, secret } = data;
        const vehicle = await getVehicleById(id);
        if (vehicle && vehicle[0].secret === secret) {
            console.log("Authenticated", id);
            if (vehicles.has(id)) { /* Reconnect */
                vehicles.get(id).state = "Working";
            } else { /* New connection */
                vehicles.set(id, {
                    latitude: 0,
                    longitude: 0,
                    state: "Working"
                });
                socketToVehicles.set(socket.id, id);
            }
            socket.emit("authenticated", true);
            registerConnectionTimeout(id);
            registerMovingTimeout(id);
        } else {
            socket.disconnect();
        }
    });

    socket.on("gps", (data) => {
        if (socketToVehicles[socket.id] !== data.id ) return;
        handleGpsData(JSON.parse(data));
    });
  });

  setInterval(() => {
    console.log("vehicle-list", Array.from(vehicles.values()));
    io.emit("vehicle-list", Array.from(vehicles.values()));
  }, POLLING_INTERVAL);
};

function handleGpsData(data) {
    const existingVehicle = vehicles.get(data.id);
    if (!existingVehicle) {
        return;
    }
    resetTimeout(data.id, vehicles, "connection");
    if (existingVehicle.longitude !== data.longitude || existingVehicle.latitude !== data.latitude) {
        resetTimeout(data.id, vehicles, "moving");
    }  
    existingVehicle.latitude = data.latitude;
    existingVehicle.longitude = data.longitude;
    existingVehicle.status = data.status;
};

export { setupSocket };