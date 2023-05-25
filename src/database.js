const mysql = require("mysql");
const Connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "cheating",
});

Connection.connect(function (err) {
  if (err) {
    console.log(`Error in part ${err}`);
  } else {
    console.log("Database connected!");
  }
});

module.exports = Connection;
