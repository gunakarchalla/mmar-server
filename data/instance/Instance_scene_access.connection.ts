import { PoolClient } from "pg";
import { queries } from "../..";

export type AccessLevel = 'read' | 'edit' | 'delete';

export interface AccessRow {
    uuid_user: string;
    username: string;
    displayname: string;
    read_access: boolean;
    edit_access: boolean;
    delete_access: boolean;
}

/**
 * @description - Expand an access level into the three flags stored for it.
 * The levels are cumulative: editing implies reading, deleting implies both.
 * @param {AccessLevel} level - The level to expand.
 * @returns {{read: boolean, edit: boolean, delete: boolean}} - The stored flags.
 */
export function levelToTriple(level: AccessLevel): { read: boolean; edit: boolean; delete: boolean } {
    return {
        read: true,
        edit: level === 'edit' || level === 'delete',
        delete: level === 'delete',
    };
}

/*
 * Every function below takes the caller's client rather than borrowing one of its
 * own. A single request asks several of these questions in a row — may this user
 * share, who already has access, is this the last owner — and taking a separate
 * connection for each meant the answers came from different snapshots, so two
 * concurrent revocations could each observe another owner and between them remove
 * the last one. Sharing the caller's transaction makes the sequence atomic, and
 * it lets the writes carry the acting user that begin_transaction publishes for
 * the history trigger.
 */

/**
 * @description - Every user holding any access to a scene instance.
 * @param {PoolClient} client - The caller's connection.
 * @param {string} sceneInstanceUuid - The scene instance.
 * @returns {Promise<AccessRow[]>} - One row per user with access.
 */
export async function listAccess(
    client: PoolClient,
    sceneInstanceUuid: string
): Promise<AccessRow[]> {
    const query = queries.getQuery_get("list_scene_instance_access");
    const result = await client.query(query, [sceneInstanceUuid]);
    return result.rows as AccessRow[];
}

/**
 * @description - The access one user holds on a scene instance.
 * @param {PoolClient} client - The caller's connection.
 * @param {string} sceneInstanceUuid - The scene instance.
 * @param {string} userUuid - The user.
 * @returns {Promise<{read: boolean, edit: boolean, delete: boolean} | null>} - Null if none.
 */
export async function getAccessForUser(
    client: PoolClient,
    sceneInstanceUuid: string,
    userUuid: string
): Promise<{ read: boolean; edit: boolean; delete: boolean } | null> {
    const query = queries.getQuery_get("scene_instance_access_for_user");
    const result = await client.query(query, [sceneInstanceUuid, userUuid]);
    if (!result.rowCount) return null;
    const row = result.rows[0];
    return { read: row.read_access, edit: row.edit_access, delete: row.delete_access };
}

/**
 * @description - Grant or change a user's access to a scene instance.
 * @param {PoolClient} client - The caller's connection.
 * @param {string} sceneInstanceUuid - The scene instance.
 * @param {string} userUuid - The user to grant access to.
 * @param {AccessLevel} level - The level to grant.
 * @returns {Promise<AccessRow | null>} - The resulting entry, null if it could not be read back.
 */
export async function upsertAccess(
    client: PoolClient,
    sceneInstanceUuid: string,
    userUuid: string,
    level: AccessLevel
): Promise<AccessRow | null> {
    const triple = levelToTriple(level);
    const upsertQuery = queries.getQuery_post("upsert_scene_instance_user_access");
    await client.query(upsertQuery, [
        sceneInstanceUuid, userUuid, triple.read, triple.edit, triple.delete,
    ]);
    const result = await client.query(
        `SELECT siua.uuid_user, u.username, m.name AS displayname,
                siua.read_access, siua.edit_access, siua.delete_access
         FROM scene_instance_user_access siua
         JOIN users u ON u.uuid_metaobject = siua.uuid_user
         JOIN metaobject m ON m.uuid = u.uuid_metaobject
         WHERE siua.uuid_scene_instance = $1 AND siua.uuid_user = $2`,
        [sceneInstanceUuid, userUuid]
    );
    if (!result.rowCount) return null;
    return result.rows[0] as AccessRow;
}

/**
 * @description - Revoke a user's access to a scene instance entirely.
 * @param {PoolClient} client - The caller's connection.
 * @param {string} sceneInstanceUuid - The scene instance.
 * @param {string} userUuid - The user to revoke.
 * @returns {Promise<string | null>} - The revoked user, null if they had none.
 */
export async function deleteAccess(
    client: PoolClient,
    sceneInstanceUuid: string,
    userUuid: string
): Promise<string | null> {
    const query = queries.getQuery_delete("delete_scene_instance_user_access");
    const result = await client.query(query, [sceneInstanceUuid, userUuid]);
    if (!result.rowCount) return null;
    return result.rows[0].uuid_user as string;
}

/**
 * @description - Whether a user may change who can reach a scene instance.
 * @param {PoolClient} client - The caller's connection.
 * @param {string} sceneInstanceUuid - The scene instance.
 * @param {string} userUuid - The user.
 * @returns {Promise<boolean>} - True if the user holds delete access.
 */
export async function isDeleteOwner(
    client: PoolClient,
    sceneInstanceUuid: string,
    userUuid: string
): Promise<boolean> {
    const query = queries.getQuery_get("is_user_delete_owner");
    const result = await client.query(query, [sceneInstanceUuid, userUuid]);
    return result.rows[0]?.allowed === true;
}

/**
 * @description - Whether a user may see who can reach a scene instance.
 * @param {PoolClient} client - The caller's connection.
 * @param {string} sceneInstanceUuid - The scene instance.
 * @param {string} userUuid - The user.
 * @returns {Promise<boolean>} - True if the user holds read access.
 */
export async function isViewOwner(
    client: PoolClient,
    sceneInstanceUuid: string,
    userUuid: string
): Promise<boolean> {
    const query = queries.getQuery_get("is_user_view_owner");
    const result = await client.query(query, [sceneInstanceUuid, userUuid]);
    return result.rows[0]?.allowed === true;
}
