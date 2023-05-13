const { dbconn } = require("./models");

const validatePengawas = async (username, password) => {
  const rows = await dbconn.execute(
    "SELECT * FROM pengawas WHERE username = ? AND password = ?",
    [username, password],
    function (err, results) {
      console.log(results);
    }
  );

  if (rows.length === 0) {
    return { pengawasValid: false };
  }
  const pengawasValid = rows[0];
  const credentials = {
    nip: pengawasValid.nip,
    username: pengawasValid.username,
  };
  return { pengawasValid, credentials };
};

const getLoginPengawas = async (request, h) => {
  const { usernameForm, passwordForm } = request.payload;

  try {
    const { pengawasValid, credentials } = await validatePengawas(
      usernameForm,
      passwordForm
    );
    if (!pengawasValid) {
      return h.response("Invalid username or password").code(401);
    }
    return h.response(`Login Success!`).code(200);
  } catch (err) {
    console.error("Error", err);
    throw err;
  }
};

module.exports = {
  getLoginPengawas,
};
