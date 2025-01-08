import express, {json, urlencoded} from "express";
import {readFileSync} from "fs";
import swaggerUi from "swagger-ui-express";
import {database_connection} from "./data/services/database_connection";
import {sql_queries_parser} from "./data/services/sql_queries_parser";
import "reflect-metadata";
import cors from "cors";
import helmet from "helmet";
import compress from "compression";
import {errorHandler, logError,} from "./data/services/middleware/error_handling/error_handling.middleware";
import * as path from "path";
import routes from "./routes/all.routes";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import {testDatabaseConnection} from "./data/services/middleware/database_test";
import swaggerAutogen from "swagger-autogen";

dotenv.config();

export {postgres as database_connection, queries, http_server};
/*
     \    /\
      )  ( ')
     (  /  )
      \(__)|
      Here is a cat to cheer you up if you are reading this code.
*/

/**
 * @description - This is the creation of the unsecured server
 * @param {express} http_server - The express server running on port 8000 (unsecured) : http://localhost:8000
 */
const http_server = express();
// This is the unsecured port that the server will listen on
const HTTPPORT = process.env.HTTPPORT || 8000;

/** @description - This is the creation of the list of the sql queries */
const queries = new sql_queries_parser();

/** @description - This is the creation of the database connection */
const postgres = database_connection.getInstance()

// EJS setup
// view engine setup
http_server.set("views", path.join(__dirname, "views"));
http_server.set("view engine", "ejs");

// This is used to enable the cors and avoid some errors related to cross origin requests.
http_server.use(cors());
// Disable to improve security by obfuscating the technology used
http_server.disable("x-powered-by");

// This is used to enable the helmet and avoid some errors related to security.
http_server.use(helmet());

// This is used to enable the compression and avoid some errors related to compression.
http_server.use(compress());

// used do decode the body of post requests that uses the 'application/json' in header
http_server.use(json({type: "application/json", limit: "100mb"}));
// We extend the limit to 10mb to avoid memory issues when sending large json objects
http_server.use(urlencoded({extended: true, limit: "100mb"}));

http_server.use(cookieParser());

// This is the reference to the routes of instances and metamodel
http_server.use(routes);

// This is the parsing of the documentation swagger from the json configuration
const swaggerDocument = JSON.parse(
    readFileSync(
        path.join(__dirname, "config", "swagger-output.json"),
        "utf-8"
    )
);

// This is the creation of the documentation swagger page
http_server.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

http_server.listen(HTTPPORT, async () => {
    console.log(
        `⚡️[server]: Unsecured server is running at http://localhost:${HTTPPORT}`
    );
    await testDatabaseConnection(1)
});

//handle the error raised by the code
http_server.use(logError);

//executed if a promise is rejected but not handled
process.on("unhandledRejection", (reason: Error) => {
    throw reason;
});

//if this code is called the server either handle the error or shut down
process.on("uncaughtException", (error: Error) => {
    errorHandler.handleError(error);
    if (!errorHandler.isTrustedError(error)) {
        //exit the server with exit code 1 to be catch outside the server to restart
        console.error("Uncaught exception, shutting down server. Error: ", error);
        process.exit(1);
    }
});

// if the server is closed the database connection is closed nicely
process.once("SIGINT", async function () {
    console.warn("SIGINT received...");
    await postgres.releaseDriver();
    process.exit(0);
});
