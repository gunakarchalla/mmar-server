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
 * @description - Of many meta objects, the ones a user is allowed to read.
 *
 * This is the set form of the read_check query. Reading a level of the metamodel
 * in one query would otherwise lose the per-object rights check the
 * one-at-a-time path performed: an object the caller may not read has to stay
 * out of the list, and asking that per object is exactly what batching removes.
 * Administrators read everything.
 * @param {PoolClient} client - The client to the database.
 * @param {UUID[]} uuids - The objects to test.
 * @param {UUID} userUuid - The user asking.
 * @returns {Promise<Set<UUID>>} - The subset the user may read.
 */
export async function readable_uuids(
    client: PoolClient,
    uuids: UUID[],
    userUuid: UUID,
): Promise<Set<UUID>> {
    if (uuids.length === 0) return new Set();

    const res = await client.query(
        `SELECT candidate.uuid
         FROM unnest($1::uuid[]) AS candidate(uuid)
         WHERE public.is_administrator($2)
            OR EXISTS (SELECT 1
                       FROM has_read_right har
                                JOIN has_user_user_group huug
                                     ON har.uuid_user_group = huug.uuid_user_group
                       WHERE har.uuid_metaobject = candidate.uuid
                         AND huug.uuid_user = $2)`,
        [uuids, userUuid],
    );
    return new Set<UUID>(res.rows.map((row) => row.uuid as UUID));
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
