import {database_connection, queries} from "../..";

export interface UserLookupResult {
    uuid: string;
    username: string;
    displayname: string;
}

export async function getUserByUsername(username: string): Promise<UserLookupResult | null> {
    const client = await database_connection.getPool().connect();
    try {
        const query = queries.getQuery_get("get_user_by_username");
        const result = await client.query(query, [username]);
        if (!result.rowCount) return null;
        return result.rows[0] as UserLookupResult;
    } finally {
        client.release();
    }
}
