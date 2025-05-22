const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const client = require("prom-client");

const port = 3001;
const routes = require("./routes");

main().catch((err) => console.log(err));

async function main() {
  await mongoose.connect("mongodb://mongo:27017/todos", {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    // авто-реконнект по умолчанию включен, можно явно указать:
    // autoReconnect: true, // но в новых версиях mongoose этот параметр не нужен
  });

  const app = express();

  app.use(cors());
  app.use(express.json());

  // Создаем реестр для метрик Prometheus
  const register = new client.Registry();

  // Счётчик ошибок подключения/отключения MongoDB
  const mongoErrors = new client.Counter({
    name: "mongodb_connection_errors_total",
    help: "Total number of MongoDB connection errors or disconnections",
  });

  register.registerMetric(mongoErrors);
  client.collectDefaultMetrics({ register });

  // Обработчики событий mongoose.connection
  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err.message);
    mongoErrors.inc();
  });

  mongoose.connection.on("disconnected", () => {
    console.error("MongoDB disconnected!");
    mongoErrors.inc();
  });

  mongoose.connection.on("reconnected", () => {
    console.log("MongoDB reconnected!");
  });

  // Эндпоинт для метрик Prometheus
  app.get("/metrics", async (req, res) => {
    try {
      res.set("Content-Type", register.contentType);
      res.end(await register.metrics());
    } catch (ex) {
      res.status(500).end(ex);
    }
  });

  app.use("/api", routes);

  app.listen(port, () => {
    console.log(`Server is listening on port: ${port}`);
  });
}