const MOVING_TIMEOUT = 5000;
const CONNECTION_TIMEOUT = 10000;

const DISCONNECTED = "Disconnected";
const IDLE = "Idle";
const WORKING = "Working";

import { vehicles } from './socketService.js';
const timeouts = new Map();
function setState(id, state) {
    const vehicle = vehicles.get(id);
    vehicles.get(id).state = (state === IDLE && vehicle.state === DISCONNECTED) ? DISCONNECTED : state;
}

function registerMovingTimeout(id) {
    console.log("Registering moving timeout for ", id);
    let timeout = timeouts.get(id);
    if (!timeout) {
        timeout = {};
    }
    timeout.movingTimeout = setTimeout(() => {
        console.log("Moving timeout for ", id);
        setState(id, IDLE);
    }, MOVING_TIMEOUT);
    timeouts.set(id, timeout);
}

function registerConnectionTimeout(id) {
    console.log("Registering connection timeout for ", id);
    let timeout = timeouts.get(id);
    if (!timeout) {
        timeout = {};
    }
    timeout.connectionTimeout = setTimeout(() => {
        console.log("Connection timeout for ", id);
        setState(id, DISCONNECTED);
    }, CONNECTION_TIMEOUT);    
    timeouts.set(id, timeout);
}

function resetTimeout(id, type) {
  const timeout = timeouts.get(id);
  if (type === "moving") {
    console.log("Resetting moving timeout for ", id);
    if (timeout.movingTimeout) {
        clearTimeout(timeout.movingTimeout);
    }
    registerMovingTimeout(id);
  } else if (type === "connection") {
    console.log("Resetting connection timeout for ", id);
    if (vehicle.connectionTimeout) {
        clearTimeout(timeout.connectionTimeout);
    }
    registerConnectionTimeout(id);
  }
}
export {
  MOVING_TIMEOUT,
  CONNECTION_TIMEOUT,
  DISCONNECTED,
  IDLE,
  WORKING,
  registerMovingTimeout,
  registerConnectionTimeout,
  resetTimeout
};
