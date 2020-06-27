const { ApolloServer } = require("apollo-server");
const jwt = require("jsonwebtoken");
require("dotenv").config("variables.env");

const typeDefs = require("./db/schema");
const resolvers = require("./db/resolvers");

const conectarDb = require("./config/db");

// Conectar a la BD
conectarDb();

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    const token = req.headers["authorization"] || "";
    
    
    if (token) {
      try {
        const usuario = jwt.verify(token.replace('Bearer ', ''), process.env.SECRETA);
        console.log("usuario", usuario);
        
        return {usuario};
        
      } catch (error) {
        console.log(error);
      }
    }
  },
});

server.listen().then(({ url }) => {
  console.log(`Servidor Listo en la URL ${url}`);
});
