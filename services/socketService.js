import { Server } from "socket.io";
import { registerMovingTimeout, registerConnectionTimeout, resetTimeout, MOVING_TIMEOUT, WORKING } from "./timeoutService.js";
import { getVehicleById } from "./databaseService.js";
import { time } from "console";
import bcrypt from "bcrypt";

const POLLING_INTERVAL = 1000;
export let vehicles = new Map();
let socketToVehicles = new Map();
const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:4200"],
      methods: ["GET", "POST"],
      credentials : true,
    },
  });

  /* The GPS consumer assumed no need to be authenticated */
  const consumerIo = io.of("/consumer");
  consumerIo.on("connection", (socket) => {
        console.log("Connecting consumer", socket.id);
        socket.on("disconnect", () => {
        console.log("Disconnected socket", socket.id);
        });
    });
    setInterval(() => {
        console.log("vehicle-list", Array.from(vehicles.values()));
        consumerIo.emit("vehicle-list", Array.from(vehicles.values()));
    }, POLLING_INTERVAL);

  /* The GPS producer need to be authenticated */
  const producerIo = io.of("/producer");
  producerIo.on("connection", (socket) => {
    console.log("Connecting producer", socket.id);
    setTimeout(() => { 
        if (!socketToVehicles.has(socket.id)) {
            socket.disconnect();
            console.log("Disconnected socket timeout", socket.id);
        }
    }, 10000);
    socket.on("authenticate", async (data) => {
        console.log("Authenticating", socket.id);
        const { id, secret } = data;
        const vehicleResultSet = await getVehicleById(id);
        if (!vehicleResultSet) {
            socket.disconnect();
            return;
        }
        const vehicle = vehicleResultSet[0];
        bcrypt.compare(secret, vehicle.secret, (err, match) => {
            if (err) {
                console.error('Error comparing passwords:', err);
                return;
            }
        if (match) {
            console.log("Authenticated", id);
            if (vehicles.has(id)) { /* Reconnect */
                vehicles.get(id).state = WORKING;
            } else { /* New connection */
                vehicles.set(id, {
                    id: id,
                    name: "Connecting...",
                });
                socketToVehicles.set(socket.id, id);
            }
            socket.emit("authenticated", true);
            registerConnectionTimeout(id);
            registerMovingTimeout(id);
        } else {
            console.log("Authentication failed", id);
            socket.disconnect();
        }
        });
    });

    socket.on("gps", (data) => {
        if (socketToVehicles[socket.id] !== data.id ) return;
        handleGpsData(JSON.parse(data));
    });
  });
};

function handleGpsData(data) {
    console.log("[GPS]", data);
    const existingVehicle = vehicles.get(data.id);
    if (!existingVehicle) {
        console.log("[GPS] Data dropped");
        return;
    }
    resetTimeout(data.id, "connection");
    if (existingVehicle.longitude !== data.longitude || existingVehicle.latitude !== data.latitude) {
        resetTimeout(data.id, "moving");
    }  
    existingVehicle.name = data.name;
    existingVehicle.latitude = data.latitude;
    existingVehicle.longitude = data.longitude;
    existingVehicle.status = data.status;
};

export { setupSocket };