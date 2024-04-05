const { adminEmail } = require("../config");
const { connect } = require("../connect");

module.exports = {
  getUsers: async (req, resp, next) => {
    // TODO: Implement the necessary function to fetch the `users` collection or table

    try {
     // console.log("Recibida solicitud para obtener usuarios");
      const db = await connect(); //conecto con la db
      const usersdb = db.collection("users");
      const usersCollection = usersdb.find(); // buscar todos los usuarios de la base de datos
      const users = await usersCollection.toArray(); // Convertir el cursor en un array de usuarios
      console.log("Usuarios encontrados:", users);
      return resp.status(200).json(users);
    } catch (error) {
      next(error);
    }
  },

  createUser: async (req, res, next) => {
    try {
      const db = await connect(); //conecto con la db
      const usersdb = db.collection("users");
      await usersdb.insertOne(req.body); // Insertar un nuevo usuario en la colección
      res.status(201).json({ message: "User created successfully" });
    } catch (error) {
      next(error);
     }
  },
  deleteUser: async (req, res, next) => {
    try {
      const db = await connect();
      const usersCollection = db.collection("users");
      const { userId } = req.params;
      await usersCollection.deleteOne({ _id: userId });
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      next(error);
    }
  },
  updateUser: async (req, res, next) => {
    try {
      const db = await connect();
      console.log("Conexión a la base de datos establecida");
      const usersCollection = db.collection("users");
      const { userId } = req.params; // extraer el id
      const { newData } = req.body; // actualizar con la data del req.body ↓
      console.log("Actualizando usuario con ID:", userId);
      console.log("Actualizando usuario con ID:", newData);
      await usersCollection.updateOne({ _id: userId }, { $set: newData }); // actualizar y construir el objeto para actualizar
      console.log("Usuario actualizado con éxito");
      res.status(200).json({ message: "User updated successfully" }); 
    } catch (error) {
      next(error);
    }
  }
}

// }
//getAllUsers
//updateUser:
//deleteUser
