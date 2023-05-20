const express = require("express");
const cors = require("cors");
const Router = require("./routes");
const app = express();

app.use(express.json());
app.use(cors());
app.use("/api", Router);

const port = process.env.port || 3000;
app.listen(port, () => {
  console.log("Server running on http://localhost:3000");
});
