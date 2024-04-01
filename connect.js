const { MongoClient } = require('mongodb');
const config = require("./config");

// eslint-disable-next-line no-unused-vars
const { dbUrl } = config;

const client = new MongoClient(config.dbUrl);

async function connect() { //la conexión con la base de datos.
  try {
    await client.connect();
    const db = client.db('burgerqueen'); 
    console.log('conectado');
    return db;
  } catch (error) {
    console.error(error);//
  }
}

module.exports = { connect };
