const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const path = require("path");

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API - Sistema de Venda de Ingressos",
      version: "1.0.0",
      description: "Documentação da API de Venda de Ingressos",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Servidor local",
      },
    ],
  },
  apis: [path.join(__dirname, "./routes/swaggerDocs.js")], // <- aqui fica toda a documentação
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

function setupSwagger(app) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

module.exports = { setupSwagger };
