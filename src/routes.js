const express = require("express");
const router = express.Router();
const Connection = require("./database");
const { registerValidation, loginValidation } = require("./validation");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const logger = require("./logger");
const { google } = require("googleapis");
const shortId = require("short-uuid");
const compute = google.compute("v1");
const requestInstance = require("./secret/instance");
const moment = require("moment");

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

  Connection.query(
    `SELECT * FROM pengawas WHERE LOWER(email) = LOWER(${Connection.escape(
      email
    )});`,
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
            Connection.query(
              `INSERT INTO pengawas (nip, nama_pengawas, email, password) VALUES (${nip}, '${nama_pengawas}', ${Connection.escape(
                email
              )}, ${Connection.escape(hash)})`,
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
  Connection.query(
    `SELECT * FROM pengawas WHERE email = ${Connection.escape(email)};`,
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
          const id_pengawas = result[0].id_pengawas;
          const token = jwt.sign({ id_pengawas }, "the-super-strong-secrect", {
            expiresIn: "1d",
          });
          res.cookie("token", token);
          logger.log("info", `Succees Login ${email}`);
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

// verify token JWT
router.get("/verify-token", (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).send({
      message: "need login or token!",
    });
  } else {
    jwt.verify(token, "the-super-strong-secrect", (err, decoded) => {
      if (err) {
        return res.status(400).send({
          message: "Auth Error!",
        });
      } else {
        const id = decoded.id_pengawas;
        return res
          .status(200)
          .send({ id_pengawas: id, message: "still in session auth" });
      }
    });
  }
});

// store report cheating
router.post("/store-report", (req, res) => {
  const token = req.cookies.token;
  if (!token)
    return res.status(401).send({
      message: "cannot store data, need login session or token",
    });
  const payload = jwt.verify(token, "the-super-strong-secrect");
  try {
    const id_report = shortId.generate();
    const tanggal = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
    const { keterangan } = req.body;
    const id_pengawas = payload.id_pengawas;

    logger.log(
      "info",
      `${keterangan}, ${id_report}, ${tanggal}, ${id_pengawas}`
    );

    Connection.query(
      `INSERT INTO report (id_report, tanggal, keterangan, id_pengawas) VALUES ("${id_report}", "${tanggal}", "${keterangan}", ${id_pengawas})`,
      (err, result) => {
        if (err) {
          throw err;
          return res.status(500).send({ message: `error in ${err}` });
        }
        return res.status(200).send({
          message: `Success store report with id report ${id_report}!`,
        });
      }
    );
  } catch (err) {
    return res.status(500).send({ message: `error in ${err}` });
  }
});

// Logout Pengawas
router.get("/logout", (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).send({
        message: "need login or token null",
      });
    } else {
      res.clearCookie("token");
      return res.status(200).send({
        message: "Success Logout!",
      });
    }
  } catch (err) {
    return res.status(500).send({
      message: `${err}`,
    });
  }
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
