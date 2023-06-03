const mysql = require("mysql");
const Connection = mysql.createConnection({
  host: "34.128.124.77",
  user: "root",
  password: "12345",
  database: "cheating",
  port: 3306,
  //   multipleStatements: true,
});

Connection.connect(function (err) {
  if (err) {
    console.log("error in ");
  } else {
    console.log("Database connected!");
  }
});

module.exports = Connection;
