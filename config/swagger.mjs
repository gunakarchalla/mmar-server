import swaggerAutogen from "swagger-autogen";
import json_doc from "../schemas.json" with { type: 'json' };

const doc = {
  "info": {
    "title": "ThreeJS-modeling-toolkit-backend",
    "description": "This is the REST API backend of the main project ThreeJS-modeling-toolkit",
    "contact": {
      "name": "Digitalization and Information Systems Group,",
      "url": "https://www.unifr.ch/inf/digits/en/group/profile.html,",
      "email": "hans-georg.fill@unifr.ch"
    },
    "license": {
      "name": "MIT",
      "url": "https://opensource.org/licenses/MIT"
    },
    "version": "0.1.0"
  },
  servers: [
    {
      url: '',              // by default: 'http://localhost:3000'
      description: ''       // by default: ''
    },
  ],
  tags: [                   // Set the order here
    {
      name: 'Metamodel',             // Tag name
      description: 'Operations on the metamodel level'       // Tag description
    },
    {
      name: 'Instance',             // Tag name
      description: 'Operations on the instance level'       // Tag description
    },
    {
      name: 'Login',             // Tag name
      description: ''       // Tag description
    },
    {
      name: 'User Groups',             // Tag name
      description: ''       // Tag description
    },
    {
      name: 'Users',             // Tag name
      description: ''       // Tag description
    },
    {
      name: 'default',             // Tag name
      description: ''       // Tag description
    },
    // { ... }
  ],
  components: {
    "schemas": json_doc.schemas,
  }            // by default: empty object
};

const outputFile = './config/swagger-output.json';
const routes = ["./routes/all.routes.ts", "./routes/other.routes.ts"];

/* NOTE: If you are using the express Router, you must pass in the 'routes' only the 
root file where the route starts, such as index.js, app.js, routes.js, etc ... */

const options = {
  openapi: '3.0.0',     // Enable/Disable OpenAPI.                        By default is null
  autoHeaders: false,    // Enable/Disable automatic headers recognition.  By default is true
  autoQuery: false,    // Enable/Disable automatic query recognition.    By default is true
};

swaggerAutogen(options)(outputFile, routes, doc);