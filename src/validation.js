const { check } = require("express-validator");

const registerValidation = [
  check("nip", "NIP is required").not().isEmpty().isNumeric().isLength({
    min: 15,
  }),
  check("nama_pengawas", "Nama Pengawas is requied").not().isEmpty(),
  check("email", "Please include a valid email")
    .isEmail()
    .normalizeEmail({ gmail_remove_dots: true }),
  check("password", "Password must be 6 or more characters").isLength({
    min: 6,
  }),
];

const loginValidation = [
  check("email", "Please include a valid email")
    .isEmail()
    .normalizeEmail({ gmail_remove_dots: true }),
  check("password", "Password must be 6 or more characters").isLength({
    min: 6,
  }),
];

const logoutValidation = [
  check("token", "Token is required").not().isEmpty(),
];

module.exports = { registerValidation, loginValidation, logoutValidation };
