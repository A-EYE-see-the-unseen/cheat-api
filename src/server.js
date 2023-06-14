const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const router = require("./routes");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("../swagger.json");
const app = express();
const socket = require("socket.io");

app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(cors());
app.get("/", (req, res) => {
  res.send("Response Success!");
});

app.use("/api", router);
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

const io = socket(server);
app.io = io;
io.on("connection", (socket) => {
  console.log("socket connection id : " + socket.id);
});

// module.exports = { server, io };
