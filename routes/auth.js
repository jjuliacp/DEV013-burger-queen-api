const jwt = require("jsonwebtoken");
const config = require("../config");
const { connect } = require("../connect");
const bcrypt = require("bcrypt"); //función de comparación segura bcrypt.compare

const { secret } = config;

module.exports = (app, nextMain) => {
  app.post("/login", async (req, resp, next) => {
    //escuchar solicitudes POST en la URL especificada.
    const { email, password, role } = req.body; //extrayendo el correo electrónico y la contraseña y roles enviados en el cuerpo de la solicitud HTTP POST

    if (!email || !password) {
      return next(400);
    }
    try {
      const db = await connect(); //conecto con la db
      // TODO: Authenticate the user
      // It is necessary to confirm if the email and password
      const adminCollection = db.collection("users");
      const user = await adminCollection.findOne({ email: email }); // match a user in the database
      //console.log("usuario", user);
      // Comparar la contraseña proporcionada con la contraseña encriptada que esta almacenada en la base de datos
      const passwordMatch = await bcrypt.compare(password, user.password);
      //console.log(password, user.password);
      if (!passwordMatch || !user) {
        return resp
          .status(401)
          .json({
            error: "El correo electrónico y/o la contraseña no son válidas ",
          });
      } else {
        // If they match, send an access token created with JWT
        const token = jwt.sign({id: user._id,  email, role }, secret); // Genera el token JWT con el correo electrónico del usuario
     
        // Envía el token JWT al cliente como respuesta
        resp.status(200).json({id: user._id, email, role, token });
         //console.log("id del usuario",  user._id);
      }
    } catch (error) {
      console.error("Error durante la autenticación:", error);
      return resp.status(500).json({ error: "Error durante la autenticación" });
    }
  });

  return nextMain();
};
