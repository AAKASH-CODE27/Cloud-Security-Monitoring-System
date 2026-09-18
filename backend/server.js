const http = require("http");
require("dotenv").config();

const app = require("./src/app");
const connectDB = require("./src/config/db");
const { startScheduler } = require("./src/scheduler/assetDiscoveryScheduler");
const { initSocket } = require("./src/socket");

const PORT = process.env.PORT || 8080;

async function start() {
  await connectDB();

  const httpServer = http.createServer(app);
  initSocket(httpServer);

  httpServer.listen(PORT, () => {
    console.log("============================================");
    console.log("SentinelCore SecureOps (Node/Express) running");
    console.log(`Port: ${PORT}`);
    console.log("Socket.IO initialized and listening");
    console.log("============================================");
  });

  startScheduler();
}

start();
