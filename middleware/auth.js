const jwt = require("jsonwebtoken");

module.exports = (secret) => (req, resp, next) => {
  const { authorization } = req.headers; // Extrae el encabezado de autorización de la solicitud HTTP.

  if (!authorization) {
    console.log("No se recibió token de autorización");
    return next();
  }

  const [type, token] = authorization.split(" ");

  if (type.toLowerCase() !== "bearer") {
    console.log("El tipo de token no es Bearer");
    return next();
  }

  jwt.verify(token, secret, (err, decodedToken) => {
    if (err) {
      console.error("Error verify JWT token:", err);
      return next(403);
    } // TODO: Verify user identity using `decodeToken.uid`
   // console.log("Token JWT verificado entro al verify");
    //console.log("Token JWT decodificado:", decodedToken);
    req.user = decodedToken.id; // Almacena el ID del usuario en req.user
   
    req.role = decodedToken.role
    //console.log(typeof(req.role));
    next()
  });
};

module.exports.isAuthenticated = (req) => {
  // TODO: Decide based on the request information whether the user is authenticated
  if (!req.user) { // basado en la info de la request   
    return false;
  } else {
    return true;
  }
};

module.exports.isAdmin = (req) => {
  // TODO: Decide based on the request information whether the user is an admin
  if (req.user &&  req.role === "admin") {
    //console.log('tiene el role de admin')
    return true;
  } else return false;
};

module.exports.requireAuth = (req, resp, next) =>
  !module.exports.isAuthenticated(req) ? next(401) : next();

module.exports.requireAdmin = (req, resp, next) =>
  // eslint-disable-next-line no-nested-ternary
  !module.exports.isAuthenticated(req)
    ? next(401)
    : !module.exports.isAdmin(req)
    ? next(403)
    : next();
