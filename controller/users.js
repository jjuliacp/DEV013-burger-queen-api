const { connect } = require("../connect");
const { ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");
const { isAdmin } = require("../middleware/auth");
// Función para validar el formato del correo electrónico
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

module.exports = {
  getUsers: async (req, resp, next) => {
    // GET
    // lanza todos los usuarios
    try {
      const db = await connect(); //conecto con la db
      const usersdb = db.collection("users");
      // Obtener parámetros de paginación y límite de la solicitud
      const { _page = 1, _limit = 10 } = req.query;
      // Convertir los valores de página y límite a enteros
      const pageNumber = parseInt(_page);
      const limitNumber = parseInt(_limit);
      // Calcular el índice de inicio de la página
      const startIndex = (pageNumber - 1) * limitNumber;

      const users = await usersdb
        .find()
        .skip(startIndex)
        .limit(limitNumber)
        .toArray(); // buscar todos los usuarios de la base de datos
      // Verificar si se encontraron usuarios en la base de datos
      if (users.length === 0) {
        //console.log("No se encontraron usuarios en la base de datos");
        return resp.status(404).json({ message: "No se encontraron usuarios" });
      }
      resp.status(200).json(users);
      //  console.log("Usuarios encontrados:", users);
    } catch (error) {
      next(error);
    }
  },
  getUsersId: async (req, resp, next) => {
    // GET
    try {
      // GET
      const db = await connect(); // Conexión a la base de datos
      const usersdb = db.collection("users");
      const { uid } = req.params;
      // console.log("con lo que busca", uid);
      // console.log("Usuario autenticado: la info", req.user);
      // console.log("Correo electrónico de la info", req.user.id);
      // Verificar si el usuario autenticado es administrador o es el mismo usuario own
      if (!isAdmin(req) && uid !== req.user.id && uid !== req.user.email) {
        return resp.status(403).json({
          error:
            "No tienes permisos de administrador para realizar esta acción",
        });
      }

      const query = ObjectId.isValid(uid)
        ? { _id: new ObjectId(uid) }
        : { email: uid };

      //  Buscar al usuario en la base de datos utilizando el campo de búsqueda determinado
      const userFound = await usersdb.findOne(query);

      // Verificar si se encontró al usuario
      if (!userFound) {
        return resp
          .status(404)
          .json({ error: "El usuario con la ID proporcionada no existe" });
      }

      //console.log(userFound);
      resp.status(200).json({ email: userFound.email });

      // Envía el usuario encontrado como respuesta JSON junto con un mensaje
    } catch (error) {
      // Manejo de errores
      //console.error("Error al buscar el usuario:", error);
      resp.status(500).json({ error: "Error interno del servidor" });
    }
  },

  createUser: async (req, res, next) => {
    // POST

    try {
      const db = await connect(); //conecto con la db
      const usersdb = db.collection("users");
      const { email, password, role } = req.body;
      const userExists = await usersdb.findOne({ email: email });
      if (userExists) {
        return res.status(403).json({ error: "El usuario ya esta registrado" });
      }
      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "el usuario debe llenar el email y/o contraseña" });
      }
      // Verificar el formato del correo electrónico
      if (!isValidEmail(email)) {
        return res.status(400).json({ error: "Correo electrónico inválido" });
      }

      // Verificar la fortaleza de la contraseña
      if (password.length < 5) {
        return res.status(400).send("password: mínimo 8 caracteres");
      }

      // Antes hay que encriptarla antes de almacenarla en la base de datos
      const hashedPassword = await bcrypt.hash(password, 10);
      //console.log("Contraseña encriptada:", hashedPassword);
      const newUser = {
        email: email,
        password: hashedPassword,
        role: role,
      };
      // Inserta el nuevo usuario en la colección
      const createNew = await usersdb.insertOne(newUser);
      // Envía una respuesta con la información del usuario creado y un mensaje de éxito
      res.status(200).json({
        _id: createNew.insertedId, // Accede al _id del documento recién insertado
        email: email,
        role: role,
        message: "Usuario creado exitosamente",
      });
    } catch (error) {
      next(error);
    }
  },
  updateUser: async (req, res, next) => {
    // PUT
    try {
      const db = await connect();
      const usersCollection = db.collection("users");
      const { uid } = req.params; // extraer el id

      // Verificar si el usuario autenticado es administrador o el dueño
      if (!isAdmin(req) && uid !== req.user.id && uid !== req.user.email) {
        return res.status(403).json({
          error:
            "No tienes permisos de administrador para realizar esta acción",
        });
      }
      //Determinar el campo de búsqueda basado en si el uid es un ObjectId válido
      let query;
      if (ObjectId.isValid(uid)) {
        query = { _id: new ObjectId(uid) };
      } else {
        query = { email: uid };
      }

      // // Buscar el usuario por su ID
      // const userToUpdate = await usersCollection.findOne({
      //   _id: new ObjectId(uid), // newObjectid asegura que el valor de uid se convierta en un objeto ObjectId válido.
      // });
      //  console.log("Query:", query);
      const userToUpdate = await usersCollection.findOne(query);

      // Verificar si se encontró el usuario
      if (userToUpdate) {
        //console.log(userToUpdate.email);
      } else {
        // console.log("Usuario no encontrado");
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      const { email, password, role } = req.body; // actualizar con la data del req.body ↓
      // Verificar si se proporcionaron datos para actualizar
      if (!email && !password && !role ) {
        console.log("entra al error 400");
        return res.status(400).json({
          error:
            "Se requiere al menos un campo para actualizar: email y/o contraseña",
        });
      }
      // Actualizar los campos del usuario
      const updateFields = {};
      if (email) {
        updateFields.email = email;
      }
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateFields.password = hashedPassword;
      }
      
      // Si el usuario autenticado no es administrador, no puede cambiar el rol de otro usuario
      if (!isAdmin(req) && role) {
        return res
          .status(403)
          .json({ error: "No tienes permisos para cambiar el rol" });
      }
      await usersCollection.updateOne(
        query, //Filtro: busca el usuario por su ID
        { $set: updateFields } // actualiza
      );
      res.status(200).json({ message: "Usuario actualizado exitosamente" });
    } catch (error) {
      next(error);
    }
  },

  deleteUser: async (req, res, next) => {
    // DELETE
    // eliminar uno
    try {
      const db = await connect();
      const usersCollection = db.collection("users");
      const { uid } = req.params;

      // Verificar si el token de autenticación no es de una usuario administradora o no es de la misma usuaria que corresponde al parametro uid
      if (!isAdmin(req)) {
        return res.status(403).json({
          error:
            "No tienes permisos de administrador para realizar esta acción",
        });
      }

      //Determinar el campo de búsqueda basado en si el uid es un ObjectId válido
      let query;
      if (ObjectId.isValid(uid)) {
        query = { _id: new ObjectId(uid) };
      } else if (isValidEmail(uid)) {
        query = { email: uid };
      } else {
        return res.status(400).json({ error: "ID de usuario inválido" });
      }

      const userToDelete = await usersCollection.findOne(query); // newObjectid asegura que el valor de uid se convierta en un objeto ObjectId válido.

      if (!userToDelete) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      // Verificar si se encontró el usuario
      await usersCollection.deleteOne(userToDelete);

      res
        .status(200)
        .json({ message: "el usuario a sido eliminado exitosamente" });
    } catch (error) {
      next(error);
    }
  },
};
