import { PoolClient } from "pg";
import { RequestHandler, Response } from "express";
import { current_user } from "./request_context";
import { database_connection } from "./database_connection";
import { filter_object } from "./middleware/object_filter";
import { RouteRequest } from "./middleware/uuid_params.middleware";

/**
 * @description - Open a transaction and tell the database who is acting.
 *
 * Every connection of the pool authenticates as the same database role, so the
 * database alone cannot distinguish the platform users. The uuid of the caller is
 * therefore published as a transaction local setting, which
 * public.change_trigger() reads through public.current_app_user() to fill
 * logging.t_history.uuid_user.
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

/**
 * @description - What a handler body returns: the value to send, or nothing when
 * it has already written the response itself.
 */
export type HandlerResult = unknown;

/**
 * @description - Run a handler inside one transaction on one connection, and only
 * tell the client it worked once the transaction is durable.
 *
 * The controllers used to send the response and then commit. A client that acted
 * on a 201 could therefore issue its next request before the row it had just been
 * promised existed — creating a user and immediately signing in as them returned
 * "wrong password or username", intermittently and more often the faster the
 * server got. Committing first removes the window; there is no way to write the
 * two in the wrong order here, because the handler returns its body rather than
 * sending it.
 *
 * A failing ROLLBACK is also contained: it used to throw out of the catch block
 * and take next(err) with it, so the request hung instead of failing.
 *
 * @param {(client: PoolClient, req: RouteRequest, res: Response) => Promise<HandlerResult>} run -
 * The body of the handler. It may set headers or cookies on the response, but it
 * must not send it.
 * @param {{status?: number}} options - The status to answer with, 200 by default.
 * @returns {RequestHandler} - The wrapped handler.
 */
export function withTransaction(
    run: (
        client: PoolClient,
        req: RouteRequest,
        res: Response
    ) => Promise<HandlerResult>,
    options: { status?: number } = {}
): RequestHandler {
    return async (req, res, next) => {
        const client = await database_connection.getInstance().getPool().connect();
        try {
            await begin_transaction(client);
            // Narrowed rather than asserted per call site: see RouteRequest.
            const result = await run(client, req as RouteRequest, res);
            await client.query("COMMIT");

            if (!res.headersSent) {
                res.status(options.status ?? 200).json(
                    filter_object(result, req.query.filter)
                );
            }
        } catch (err) {
            try {
                await client.query("ROLLBACK");
            } catch {
                // The connection is already gone; the original error is the one
                // worth reporting.
            }
            next(err);
        } finally {
            client.release();
        }
    };
}
