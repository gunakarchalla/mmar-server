import { NextFunction, Request, Response } from "express";
import { database_connection } from "../database_connection";

/**
 * @description - Whether the last probe found the database reachable. Requests
 * read this rather than probing themselves, so that an outage does not turn every
 * incoming request into another connection attempt competing with real traffic.
 */
let databaseOnline = false;

/** @description - Whether a retry loop is already running, so only one ever is. */
let probing = false;

/** @description - The delay before the first retry, in milliseconds. */
const INITIAL_RETRY_DELAY_MS = 500;

/** @description - The ceiling on the retry delay, so a long outage still recovers promptly. */
const MAX_RETRY_DELAY_MS = 30_000;

/**
 * @description - Refuse requests while the database is unreachable.
 *
 * When the flag is down the database is probed once more before answering, so
 * that the first request after a recovery succeeds instead of being rejected: the
 * previous version stored the result of that probe and then returned 503
 * regardless, which meant a recovered database still cost one failed request, and
 * a cold start rejected everything racing the first probe.
 * @param {Request} req - The incoming request.
 * @param {Response} res - The response, used only to refuse.
 * @param {NextFunction} next - The next handler of the chain.
 */
export async function database_test(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    if (databaseOnline) return next();

    databaseOnline = await isDatabaseOnline();
    if (databaseOnline) return next();

    res.status(503).json({
        error: "Service Unavailable: the database is offline",
    });
}

/**
 * @description - Ask the database whether it is reachable.
 * @returns {Promise<boolean>} - True if a connection could be opened and used.
 */
async function isDatabaseOnline(): Promise<boolean> {
    let client;
    try {
        client = await database_connection.getInstance().getPool().connect();
        await client.query("SELECT 1;");
        return true;
    } catch {
        return false;
    } finally {
        client?.release();
    }
}

/**
 * @description - Wait for the database to come up, retrying with exponential
 * backoff.
 *
 * The delay used to be fibonacci(attempt) seconds, computed by naive recursion:
 * the computation itself blocked the event loop for seconds once the attempt
 * count reached the thirties, and the delay it produced grew without bound, so a
 * long outage became a permanent one. The backoff is capped now, and the jitter
 * keeps several server instances from retrying in lockstep.
 * @param {number} attempt - The attempt number, starting at 1.
 * @returns {Promise<void>} - Resolves once the database has answered.
 */
export async function testDatabaseConnection(attempt = 1): Promise<void> {
    if (probing && attempt === 1) return;
    probing = true;

    if (await isDatabaseOnline()) {
        databaseOnline = true;
        probing = false;
        console.log("Database connection established.");
        return;
    }

    databaseOnline = false;

    const backoff = Math.min(
        MAX_RETRY_DELAY_MS,
        INITIAL_RETRY_DELAY_MS * 2 ** (attempt - 1)
    );
    const delay = Math.round(backoff * (0.5 + Math.random() / 2));

    console.log(
        `Failed to connect to the database (attempt ${attempt}). ` +
        `Retrying in ${(delay / 1000).toFixed(1)}s...`
    );

    setTimeout(() => {
        void testDatabaseConnection(attempt + 1);
    }, delay);
}
