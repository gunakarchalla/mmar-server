import * as TJS from "typescript-json-schema";
import * as fs from "fs";
import { resolve, join } from "path";

const metaFolderPath = resolve("../mmar-global-data-structure/models/meta");
const instanceFolderPath = resolve("../mmar-global-data-structure/models/instance");

const metaFiles = fs.readdirSync(metaFolderPath).filter(file => file.endsWith(".ts"));
const instanceFiles = fs.readdirSync(instanceFolderPath).filter(file => file.endsWith(".ts"));

const program = TJS.getProgramFromFiles([
  ...metaFiles.map(file => join(metaFolderPath, file)),
  ...instanceFiles.map(file => join(instanceFolderPath, file))
]);

var schema = TJS.generateSchema(program, "*");

schema.definitions = {
  ...schema.definitions,
  Error: {
    type: "object",
    properties: {
      error: {
        type: "string"
      }
    }
  }
};
const schemaString = JSON.stringify(schema, null, 2);

const outputPath = "schemas.json";

var updatedSchemaString = schemaString.replace("definitions", "schemas");
updatedSchemaString = updatedSchemaString.replace(/definitions/g, "components/schemas");



fs.writeFile(outputPath, updatedSchemaString, (err) => {
  if (err) throw err;
});

// console.log(updatedSchemaString);


