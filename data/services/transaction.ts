import { PoolClient } from "pg";
import { current_user } from "./request_context";

/**
 * @description - Open a transaction and tell the database who is acting.
 *
 * Every connection of the pool authenticates as the same database role, so the
 * "who" column of logging.t_history cannot distinguish the platform users. The
 * uuid of the caller is therefore published as a transaction local setting,
 * which public.change_trigger() reads through public.current_app_user().
 *
 * The setting is transaction local, the third argument of set_config being true:
 * it is discarded on commit or rollback and can never leak to the next request
 * that borrows the same pooled connection.
 *
 * @param {PoolClient} client - The client to open the transaction on.
 */
export async function begin_transaction(client: PoolClient): Promise<void> {
    await client.query("BEGIN");

    const uuid_user = current_user()?.uuid;
    if (uuid_user !== undefined) {
        await client.query("SELECT set_config('mmar.uuid_user', $1, true)", [
            uuid_user,
        ]);
    }
}
