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
const PDFDocument = require("pdfkit");
const fs = require("fs");
const axios = require("axios");

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
    const { foto, keterangan } = req.body;
    const id_pengawas = payload.id_pengawas;

    logger.log(
      "info",
      `${keterangan}, ${id_report}, ${tanggal}, ${id_pengawas}`
    );

    Connection.query(
      `INSERT INTO report (id_report, tanggal, foto, keterangan, id_pengawas) VALUES ("${id_report}", "${tanggal}", "${foto}", "${keterangan}", ${id_pengawas})`,
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

// get data report
router.get("/get-report", (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).send({
      message: "Cannot get data, login session or token is required",
    });
  }
  const doc = new PDFDocument({ size: "A4" });
  try {
    Connection.query("SELECT * FROM report", (err, result) => {
      if (err) {
        throw err;
        return res.status(500).send({ message: `Error: ${err.message}` });
      }
      const data = [];
      for (const row of result) {
        const { id_report, tanggal, foto, keterangan, id_pengawas } = row;
        data.push({
          id_report,
          tanggal,
          foto,
          keterangan,
          id_pengawas,
        });
      }

      const addImageFromURL = async (url) => {
        return new Promise((resolve, reject) => {
          axios
            .get(url, { responseType: "arraybuffer" })
            .then((response) => {
              const image = response.data;

              const imageWidth = 250; // Desired width of the image
              const imageHeight = 150; // Desired height of the image

              // Available Space
              const availableWidth =
                doc.page.width - doc.page.margins.left - doc.page.margins.right;
              const availableHeight =
                doc.page.height -
                doc.page.margins.top -
                doc.page.margins.bottom -
                doc.y;

              // Calculate the scale to fit the image within the available space
              const scale = Math.min(
                availableWidth / imageWidth,
                availableHeight / imageHeight
              );

              // Calculate the position to center the image within the available space
              const imageX =
                (availableWidth - imageWidth * scale) / 2 +
                doc.page.margins.left;
              const imageY = doc.y;

              // Centered and Scaled
              doc
                .image(image, imageX, imageY, {
                  width: imageWidth * scale,
                  height: imageHeight * scale,
                })
                .moveDown(1);
              resolve();
            })
            .catch((error) => {
              console.error("Gagal fetch gambar dari URL:", error);
              reject(error);
            });
        });
      };

      const addDescription = (x, y, z) => {
        //Hapus Line Break
        //Catatan: Jika tidak dihapus line break dari SQL maka akan terdapat "D" setelah kata.
        const removeLineBreak = y.replace(/\r\n/g, " ");
        doc.fontSize(20).text(z).moveDown(0.2);
        doc.fontSize(8).text(x).moveDown(2);
        doc.fontSize(12).text(removeLineBreak).moveDown(4);
      };

      for (const item of data) {
        const { id_report, tanggal, foto, keterangan, id_pengawas } = item;

        addImageFromURL(foto);
        addDescription(tanggal, keterangan, id_pengawas);
      }
      const today = new Date().toISOString().split("T")[0];

      // Save the PDF to a file
      doc.pipe(fs.createWriteStream(`Laporan Tanggal ${today}.pdf`));

      return res.status(200).send({
        message: "Success Generate Pdf",
      });
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: `Error: ${err.message}` });
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
    res.status(200).send({ message: "Instance started success!" });
  } catch (error) {
    console.log(
      `error at ${error} | ${requestInstance.project}, ${requestInstance.zone}`
    );
    res.status(500).send({ message: "failed start instance!" });
  }
});

router.post("/stop-instance", async (req, res) => {
  try {
    const authClient = await auth.getClient();
    google.options({ auth: authClient });
    await compute.instances.stop(requestInstance);
    res.status(200).send({ message: "Instance stopped success!" });
  } catch (error) {
    res.status(500).send({ message: "Instance stopped failed!" });
  }
});

module.exports = router;
