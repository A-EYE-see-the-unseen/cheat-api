const express = require("express");
const router = express.Router();
const Connection = require("./database");
const { signupValidation, loginValidation } = require("./validation");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

router.post(
  "/admin/register/S2FtdSBDaGVhdGluZw==",
  signupValidation,
  (req, res, next) => {
    Connection.query(
      `SELECT * FROM pengawas WHERE LOWER(email) = LOWER(${Connection.escape(
        req.body.email
      )});`,
      (err, result) => {
        if (result.length) {
          return res.status(409).send({
            msg: "This user is already in use!",
          });
        } else {
          bcrypt.hash(req.body.password, 10, (err, hash) => {
            if (err) {
              return res.status(500).send({
                msg: err,
              });
            } else {
              Connection.query(
                `INSERT INTO pengawas (nip, nama_pengawas, email, password) VALUES ('${
                  req.body.nip
                }','${req.body.nama_pengawas}', ${Connection.escape(
                  req.body.email
                )}, ${Connection.escape(hash)})`,
                (err, result) => {
                  if (err) {
                    throw err;
                    return res.status(400).send({
                      msg: err,
                    });
                  }
                  return res.status(201).send({
                    msg: "The user has been registerd with us!",
                  });
                }
              );
            }
          });
        }
      }
    );
  }
);

router.post("/login", loginValidation, (req, res, next) => {
  // const { username, password } = req.body;
  const check = Connection.query(
    `SELECT * FROM pengawas WHERE email = ${Connection.escape(req.body.email)}`,
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

      bcrypt.compare(
        req.body.password,
        result[0]["password"],
        (bErr, bResult) => {
          if (bErr) {
            throw bErr;
            return res.status(401).send({
              msg: "Email or password is incorrect!",
            });
          }
          if (bResult) {
            const token = jwt.sign(
              { nip: result[0].nip },
              "the-super-strong-secrect",
              { expiresIn: "1h" }
            );
            Connection.query(
              `UPDATE pengawas SET last_login = now() WHERE nip = '${result[0].nip}'`
            );
            return res.status(200).send({
              token,
              user: result[0],
            });
          }
          return res.status(401).send({
            msg: "Username or password is incorrect!",
          });
        }
      );
    }
  );
});

module.exports = router;
