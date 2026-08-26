import { AsyncLocalStorage } from "async_hooks";
import { Pool, PoolClient } from "pg";
import { environment } from "./environment";

/**
 * @description - Run something against a database connection, borrowing one only
 * if the caller did not already have one.
 *
 * The rule engine nests: verifying a scene verifies its classes, which verify
 * their attributes. Each level used to open a connection of its own and hold it
 * while the level below did the same, so one request could occupy four at once
 * for work that is entirely sequential. Passing the client down collapses that to
 * one, which is what keeps a small pool sufficient.
 * @param {PoolClient | undefined} client - The caller's connection, if it has one.
 * @param {(client: PoolClient) => Promise<T>} run - The work to perform.
 * @returns {Promise<T>} - Whatever the work returned.
 */
export async function with_client<T>(
    client: PoolClient | undefined,
    run: (client: PoolClient) => Promise<T>
): Promise<T> {
    if (client) return await run(client);

    const borrowed = await database_connection.getInstance().getPool().connect();
    try {
        // A fresh memo for this borrow, and only this borrow. Callers that ask
        // the database the same question repeatedly - the rule engine asks "does
        // this meta object exist" once per object in the body, for a handful of
        // distinct uuids - can answer from it instead. Scoping it to the borrow
        // rather than to the connection matters: pool clients are recycled, so a
        // cache keyed on the client object would outlive the work that filled it
        // and answer the next request from a metamodel that may have changed.
        return await memos.run(new Map(), () => run(borrowed));
    } finally {
        borrowed.release();
    }
}

/**
 * @description - What has already been looked up during the current borrow.
 */
const memos = new AsyncLocalStorage<Map<string, unknown>>();

/**
 * @description - Answer from the current borrow's memo, or compute and remember.
 *
 * Outside a borrow there is nothing to scope a memo to, so the value is computed
 * every time. That is slower and never wrong, which is the right way round.
 * @param {string} key - Identifies the question being asked.
 * @param {() => Promise<T>} compute - How to answer it against the database.
 * @returns {Promise<T>} - The answer.
 */
export async function memoised<T>(key: string, compute: () => Promise<T>): Promise<T> {
    const store = memos.getStore();
    if (!store) return await compute();
    if (store.has(key)) return store.get(key) as T;

    const value = await compute();
    store.set(key, value);
    return value;
}

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
