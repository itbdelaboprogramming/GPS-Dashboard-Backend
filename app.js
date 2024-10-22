import express from "express";
import cors from "cors";
import { setupSocket } from './services/socketService.js';
import { CONFIG } from './bootstrap/envLoader.js';

const app = express()

app.use(express.json())

/* Setting Up CORS */
app.use(cors())
app.all("/", function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "X-Requested-With")
  next()
})

/* Running the server on port */
const port = process.env.PORT || 3000
const server = app.listen(port, () => {
  console.log("App now running on port", server.address().port)
})

/* Setup WebSocket */
setupSocket(server)
