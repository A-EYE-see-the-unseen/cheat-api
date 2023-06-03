const mysql = require("mysql");
const Connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "cheating",
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
