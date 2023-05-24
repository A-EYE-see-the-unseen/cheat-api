const express = require("express");
const router = express.Router();
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const routes = require("./routes");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("../swagger.json");
const app = express();

app.use(express.json());
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(cors());
router.get("/", (req, res) => {
  console.log("Hello World");
  res.sendFile(path.resolve("./style/index.html"));
});

app.use("/", router);
app.use("/api", routes);
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server running on http://localhost:3000");
});
