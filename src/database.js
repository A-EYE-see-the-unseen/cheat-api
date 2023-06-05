const mysql = require("mysql");
const Connection = mysql.createConnection({
  host: "",
  user: "",
  password: "",
  database: "",
  port: 3306,
});

Connection.connect(function (err) {
  if (err) {
    console.log("error");
  } else {
    console.log("Database connected!");
  }
});

module.exports = Connection;
