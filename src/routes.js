const express = require("express");
const router = express.Router();
const db = require("./database");
const { registerValidation, loginValidation, logoutValidation } = require("./validation");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const logger = require("./logger");
const { google } = require("googleapis");
const { Logger } = require("winston");
const compute = google.compute("v1");
const requestInstance = require("./secret/instance");

// ====== Public Variables =======
const auth = new google.auth.GoogleAuth({
  keyFile: "./src/secret/credential.json",
  scopes: ["https://www.googleapis.com/auth/compute"],
});

// ====== Handler ========

// Register Pengawas
router.post("/register", registerValidation, (req, res) => {
  const { nip, nama_pengawas, email, password } = req.body;
  logger.log("info", `${nip} ${nama_pengawas} ${email} ${password}`);

  db.query(
    `SELECT * FROM pengawas WHERE LOWER(email) = LOWER(${db.escape(email)});`,
    (err, result) => {
      if (result.length) {
        return res.status(409).send({
          msg: "This user is already in use!",
        });
      } else {
        bcrypt.hash(password, 10, (err, hash) => {
          if (err) {
            return res.status(500).send({
              msg: `error at ${err}`,
            });
          } else {
            db.query(
              `INSERT INTO pengawas (nip, nama_pengawas, email, password) VALUES (${nip}, '${nama_pengawas}', ${db.escape(
                email
              )}, ${db.escape(hash)})`,
              (err, result) => {
                if (err) {
                  throw err;
                  return res.status(400).send({
                    msg: err,
                  });
                }
                return res.status(201).send({
                  msg: "Pengawas Success Register!",
                });
              }
            );
          }
        });
      }
    }
  );
});

// Login Pengawas
router.post("/login", loginValidation, (req, res) => {
  const { email, password } = req.body;
  db.query(
    `SELECT * FROM pengawas WHERE email = ${db.escape(email)};`,
    (err, result) => {
      if (err) {
        throw err;
        return res.status(400).send({
          msg: err,
        });
      }
      if (!result.length) {
        return res.status(401).send({
          msg: "Email or password is incorrect!",
        });
      }
      bcrypt.compare(password, result[0]["password"], (bError, bResult) => {
        if (bError) {
          throw bError;
          return res.status(401).send({
            msg: "Email or password is incorrect!",
          });
        }
        if (bResult) {
          const token = jwt.sign(
            { id_pengawas: result[0].id_pengawas },
            "the-super-strong-secrect",
            { expiresIn: "1h" }
          );
          Logger.log("info", `Sucees Login ${email}`);
          return res.status(200).send({
            token,
            user: result[0],
          });
        }
        return res.status(401).send({
          msg: "Username or password is incorrect!",
        });
      });
    }
  );
});
router.post("/logout", logoutValidation, (req, res) => {
  const { token } = req.body;

  // Verify and decode the token
  jwt.verify(token, "the-super-strong-secrect", (err, decoded) => {
    if (err) {
      return res.status(401).send({
        msg: "Invalid token",
      });
    }

    // Perform logout actions (if any)
    // ...

    logger.log("info", `User logged out: ${decoded.id_pengawas}`);

    return res.status(200).send({
      msg: "Logout successful",
    });
  });
});

router.post("/start-instance", async (req, res) => {
  try {
    const authClient = await auth.getClient();
    google.options({ auth: authClient });
    await compute.instances.start(requestInstance);
    res.status(200).send("Instance started success!");
  } catch (error) {
    console.log(
      `error at ${error} | ${requestInstance.project}, ${requestInstance.zone}`
    );
    res.status(500).send("Failed to start instance.");
  }
});

router.post("/stop-instance", async (req, res) => {
  try {
    const authClient = await auth.getClient();
    google.options({ auth: authClient });
    await compute.instances.stop(requestInstance);
    res.status(200).send("Instance stopped success!");
  } catch (error) {
    res.status(500).send("Failed to stop instance.");
  }
});

module.exports = router;
