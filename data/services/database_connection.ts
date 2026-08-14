import { Pool } from "pg";
import { environment } from "./environment";

/**
 * @description - The connection pool to the database, shared by the whole server.
 *
 * The configuration comes from the environment through environment.ts, which
 * validates it while the process starts. It used to be read from
 * config/DBConfig.json, a file that was committed to the repository along with
 * its password.
 * @export - This class is exported so that it can be used by other files.
 * @class database_connection
 */
export class database_connection {
    private static instance: database_connection;
    private readonly pool: Pool;

    constructor() {
        this.pool = new Pool(environment.database);

        // An idle pooled connection can be dropped by the database or by anything
        // between the two. pg surfaces that here rather than on a query, and the
        // pool discards the connection on its own; the handler exists so that the
        // event does not reach the process as an unhandled 'error'.
        this.pool.on("error", (err) => {
            console.error("Idle database connection failed:", err.message);
        });
    }

    public static getInstance(): database_connection {
        if (!database_connection.instance) {
            database_connection.instance = new database_connection();
        }
        return database_connection.instance;
    }

    /**
     * @description - Close every connection of the pool, so that a shutdown does
     * not leave sessions behind on the database. It does not stop the process:
     * that is the caller's decision.
     * @memberof database_connection
     * @method
     * @async
     * @return {Promise<void>} - Resolves once the pool is drained.
     */
    async releaseDriver(): Promise<void> {
        await this.pool.end();
        console.log(
            `Pool ${environment.database.database}@${environment.database.host} has been shut down.`
        );
    }

    /**
     * @description - The pool of connections to the database.
     * @memberof database_connection
     * @method
     * @return {Pool} - The pool of connections to the database.
     */
    getPool(): Pool {
        return this.pool;
    }
}
