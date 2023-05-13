var db = require("mysql2");

const db_name = "cheating";
const db_user = "root";
const db_pass = "";
const db_host = "localhost";

var dbconn = db.createConnection({
  host: db_host,
  user: db_user,
  //   password: db_pass,
  database: db_name,
});

dbconn.connect(function (err) {
  if (err) {
    console.error("[mysql error]" + err.stack);
    return;
  }
  console.log("Connected!");
});

module.exports = dbconn;
