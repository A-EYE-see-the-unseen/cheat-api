const { getLoginPengawas } = require("./handler");

const routes = [
  {
    method: "POST",
    path: "/api/login",
    handler: getLoginPengawas,
  },
];

module.exports = routes;
