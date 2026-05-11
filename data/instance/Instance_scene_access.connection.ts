import {database_connection, queries} from "../..";

export type AccessLevel = 'read' | 'edit' | 'delete';

export interface AccessRow {
    uuid_user: string;
    username: string;
    displayname: string;
    read_access: boolean;
    edit_access: boolean;
    delete_access: boolean;
}

export function levelToTriple(level: AccessLevel): { read: boolean; edit: boolean; delete: boolean } {
    return {
        read: true,
        edit: level === 'edit' || level === 'delete',
        delete: level === 'delete',
    };
}

export async function listAccess(sceneInstanceUuid: string): Promise<AccessRow[]> {
    const client = await database_connection.getPool().connect();
    try {
        const query = queries.getQuery_get("list_scene_instance_access");
        const result = await client.query(query, [sceneInstanceUuid]);
        return result.rows as AccessRow[];
    } finally {
        client.release();
    }
}

export async function getAccessForUser(
    sceneInstanceUuid: string,
    userUuid: string
): Promise<{ read: boolean; edit: boolean; delete: boolean } | null> {
    const client = await database_connection.getPool().connect();
    try {
        const query = queries.getQuery_get("scene_instance_access_for_user");
        const result = await client.query(query, [sceneInstanceUuid, userUuid]);
        if (!result.rowCount) return null;
        const row = result.rows[0];
        return { read: row.read_access, edit: row.edit_access, delete: row.delete_access };
    } finally {
        client.release();
    }
}

export async function upsertAccess(
    sceneInstanceUuid: string,
    userUuid: string,
    level: AccessLevel
): Promise<AccessRow | null> {
    const client = await database_connection.getPool().connect();
    try {
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
    } finally {
        client.release();
    }
}

export async function deleteAccess(
    sceneInstanceUuid: string,
    userUuid: string
): Promise<string | null> {
    const client = await database_connection.getPool().connect();
    try {
        const query = queries.getQuery_delete("delete_scene_instance_user_access");
        const result = await client.query(query, [sceneInstanceUuid, userUuid]);
        if (!result.rowCount) return null;
        return result.rows[0].uuid_user as string;
    } finally {
        client.release();
    }
}

export async function isDeleteOwner(
    sceneInstanceUuid: string,
    userUuid: string
): Promise<boolean> {
    const client = await database_connection.getPool().connect();
    try {
        const query = queries.getQuery_get("is_user_delete_owner");
        const result = await client.query(query, [sceneInstanceUuid, userUuid]);
        return result.rows[0]?.allowed === true;
    } finally {
        client.release();
    }
}
