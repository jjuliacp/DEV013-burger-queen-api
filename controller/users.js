const { connect } = require("../connect");
const { ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");
const { isAdmin } = require("../middleware/auth");
module.exports = {
  getUsers: async (req, resp, next) => {
    // GET
    // lanza todos los usuarios
    try {
      const db = await connect(); //conecto con la db
      const usersdb = db.collection("users");
      // Obtener parámetros de paginación y límite de la solicitud
      const { page = 1, limit = 10 } = req.query;
      // Convertir los valores de página y límite a enteros
      const pageNumber = parseInt(page);
      const limitNumber = parseInt(limit);
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
      console.log("Usuarios encontrados:", users);
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
      console.log(uid); // Id del parámetro de la URL
      // Verificar si el ID es válido
      if (!ObjectId.isValid(uid)) {
        return resp.status(400).json({ error: "ID de usuario inválido" });
      }
      // Convierte la cadena hexadecimal a ObjectId
      const objectIdUid = new ObjectId(uid);
      // Busca el usuario por su ObjectId utilizando findOne
      const userFound = await usersdb.findOne({ _id: objectIdUid });

      if (!userFound) {
        return resp
          .status(404)
          .json({ error: "El usuario con la ID proporcionada no existe" });
      }

      console.log(userFound);
      resp.status(200).json({ user: userFound, message: "Operación exitosa" }); // Envía el usuario encontrado como respuesta JSON junto con un mensaje
    } catch (error) {
      // Manejo de errores
      console.error("Error al buscar el usuario:", error);
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

      // Antes hay que encriptarla antes de almacenarla en la base de datos
      const hashedPassword = await bcrypt.hash(password, 10);
      console.log("Contraseña encriptada:", hashedPassword);
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
      const { email, password } = req.body; // actualizar con la data del req.body ↓
      // Buscar el usuario por su ID
      const userToUpdate = await usersCollection.findOne({
        _id: new ObjectId(uid), // newObjectid asegura que el valor de uid se convierta en un objeto ObjectId válido.
      });

      // Verificar si se encontró el usuario
      if (!userToUpdate) {
        return res.status(404).json({ error: "Usuario no encontrado" });
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

      await usersCollection.updateOne(
        { _id: new ObjectId(uid) }, //Filtro: busca el usuario por su ID
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
      if (req.user !== uid) {
        console.log(req.user, uid);
        return res
          .status(403)
          .json({ error: "No tienes permisos para actualizar este usuario" });
      }
      const userToUpdate = await usersCollection.findOne({
        _id: new ObjectId(uid), // newObjectid asegura que el valor de uid se convierta en un objeto ObjectId válido.
      });

      // Verificar si se encontró el usuario
      if (!userToUpdate) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      await usersCollection.deleteOne(userToUpdate);
      res
        .status(200)
        .json({ message: "el usuario a sido eliminado exitosamente" });
    } catch (error) {
      next(error);
    }
  },
};
