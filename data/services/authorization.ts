import { PoolClient } from "pg";
import { database_connection } from "./database_connection";
import type { UUID } from "../../../mmar-global-data-structure";

/**
 * @description - Whether a user belongs to any group flagged as administrative.
 *
 * Administrator status is membership of a user group whose is_administrator
 * column is set, and public.is_administrator() in the database is the single
 * definition of that: the right checks in the SQL query files call the same
 * function, so authorisation cannot drift between the two.
 *
 * It is read from the database rather than from the isAdmin claim of the token,
 * so that revoking someone's administrator status takes effect on their next
 * request rather than when their token happens to expire.
 *
 * This lives in a module of its own, importing nothing but the pool, so that the
 * authentication middleware does not have to pull in the user data layer — which
 * imports back from index.ts and would close a require cycle through the routes.
 * @param {PoolClient} client - An open client, to run inside the caller's transaction.
 * @param {UUID} userUuid - The user to test.
 * @returns {Promise<boolean>} - True if the user is an administrator.
 */
export async function is_administrator(
    client: PoolClient,
    userUuid: UUID,
): Promise<boolean> {
    const res = await client.query(
        "SELECT public.is_administrator($1) AS is_administrator",
        [userUuid],
    );
    return res.rows[0]?.is_administrator === true;
}

/**
 * @description - The same check on a connection of its own, for callers that are
 * not already inside a transaction.
 * @param {UUID} userUuid - The user to test.
 * @returns {Promise<boolean>} - True if the user is an administrator.
 */
export async function is_administrator_standalone(
    userUuid: UUID,
): Promise<boolean> {
    const client = await database_connection.getInstance().getPool().connect();
    try {
        return await is_administrator(client, userUuid);
    } finally {
        client.release();
    }
}
