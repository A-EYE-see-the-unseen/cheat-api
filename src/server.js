const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const router = require("./routes");
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

app.use("/api", router);
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
