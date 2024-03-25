const { MongoClient } = require('mongodb');
const config = require("./config");

// eslint-disable-next-line no-unused-vars
const { dbUrl } = config;

const client = new MongoClient(config.dbUrl);

async function connect() {
  try {
    await client.connect();
    const db = client.db('burgerqueen'); // Reemplaza <NOMBRE_DB> por el nombre del db
    console.log('conectado');
    return db;
  } catch (error) {
    console.error(error);//
  }
}

module.exports = { connect };
