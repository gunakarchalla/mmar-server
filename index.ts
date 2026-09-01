import express, {json, urlencoded} from "express";
import {readFileSync} from "fs";
import swaggerUi from "swagger-ui-express";
import {database_connection} from "./data/services/database_connection";
import {sql_queries_parser} from "./data/services/sql_queries_parser";
import "reflect-metadata";
import cors from "cors";
import helmet from "helmet";
import compress from "compression";
import {errorHandler, logError, logger,} from "./data/services/middleware/error_handling/error_handling.middleware";
import * as path from "path";
import routes from "./routes/all.routes";
import {environment} from "./data/services/environment";
import cookieParser from "cookie-parser";
import {testDatabaseConnection} from "./data/services/middleware/database_test";

export {postgres as database_connection, queries, http_server};
/*
     \    /\
      )  ( ')
     (  /  )
      \(__)|
      Here is a cat to cheer you up if you are reading this code.
*/

/**
 * @description - The unsecured HTTP server. TLS is terminated by the reverse
 * proxy in front of it.
 */
const http_server = express();

/** @description - This is the creation of the list of the sql queries */
const queries = new sql_queries_parser();

/** @description - This is the creation of the database connection */
const postgres = database_connection.getInstance()

// EJS setup
// view engine setup
http_server.set("views", path.join(__dirname, "views"));
http_server.set("view engine", "ejs");

// req.ip and the rate limiter both depend on this being right: see
// TRUST_PROXY_HOPS in .env.example.
http_server.set("trust proxy", environment.trust_proxy_hops);

// Security headers first, so that they are set on every response including the
// ones produced by the middleware below.
http_server.use(helmet());
// Disable to improve security by obfuscating the technology used
http_server.disable("x-powered-by");

// The API authenticates with a cookie as well as with a bearer token, so it
// cannot both reflect every origin and allow credentials. With CORS_ORIGINS set,
// only those origins are accepted and cookies are allowed to travel to them.
// Left unset, any origin may call the API but credentials are refused, which is
// what a browser already enforces for a wildcard origin.
// TEMPORARY: CORS is opened to reflect any origin while still allowing
// credentials. This echoes back the caller's Origin header, so every site can
// call the API with cookies. Revert to the environment.cors_origins allow-list
// before this goes anywhere near production.
http_server.use(
    cors({ origin: true, credentials: true })
);

// This is used to enable the compression and avoid some errors related to compression.
http_server.use(compress());

// Credentials are a few hundred bytes, so the authentication routes get a tight
// ceiling of their own. It has to be mounted before the general one: body-parser
// marks a request as parsed and every later parser then leaves it alone, so a
// stricter limit declared further down the chain would never be reached.
http_server.use("/login", json({type: "application/json", limit: "16kb"}));
http_server.use("/login", urlencoded({extended: true, limit: "16kb"}));

// Whole metamodels are posted as a single JSON document and legitimately reach
// several megabytes, so the general ceiling is high by necessity.
http_server.use(json({type: "application/json", limit: environment.max_body_bytes}));
http_server.use(urlencoded({extended: true, limit: environment.max_body_bytes}));

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

// The error handler closes the chain, so it has to be registered after every
// route that can raise into it.
http_server.use(logError);

http_server.listen(environment.http_port, async () => {
    console.log(
        `⚡️[server]: Unsecured server is running at http://localhost:${environment.http_port}`
    );
    await testDatabaseConnection(1)
});

// A rejected promise nobody awaited is a bug in this server, not a reason to end
// the process: throwing here used to turn any one of them into an uncaught
// exception and take the whole server down with it. It is recorded instead, and
// the request that caused it fails on its own.
process.on("unhandledRejection", (reason: unknown) => {
    errorHandler.handleError(reason);
    logger.error("Unhandled promise rejection. The server keeps running.");
});

// An uncaught exception means the process is in a state it does not model, so it
// stops and lets the supervisor restart it.
process.on("uncaughtException", (error: Error) => {
    errorHandler.handleError(error);
    if (!errorHandler.isTrustedError(error)) {
        console.error("Uncaught exception, shutting down server. Error: ", error);
        void shutdown(1);
    }
});

/**
 * @description - Close the database pool and end the process.
 * @param {number} code - The exit code to report to the supervisor.
 */
async function shutdown(code: number): Promise<void> {
    try {
        await postgres.releaseDriver();
    } catch (err) {
        console.error("Failed to close the database pool cleanly:", err);
    }
    process.exit(code);
}

process.once("SIGINT", async function () {
    console.warn("SIGINT received...");
    await shutdown(0);
});

process.once("SIGTERM", async function () {
    console.warn("SIGTERM received...");
    await shutdown(0);
});
