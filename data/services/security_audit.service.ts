import { createHash } from "crypto";
import { Request } from "express";
import { database_connection } from "./database_connection";
import { environment } from "./environment";

/**
 * @description - The kind of security event being recorded.
 */
export type SecurityEventName =
    | "login"
    | "token_verification"
    | "password_change"
    | "access_grant"
    | "access_revoke"
    | "access_denied";

/**
 * @description - Whether the attempt succeeded or was rejected.
 */
export type SecurityEventOutcome = "success" | "failure";

/**
 * @description - Why an authentication attempt was rejected. Kept as a closed set
 * so that the audit trail can be grouped and alerted on.
 */
export type AuthenticationFailureReason =
    | "no_token_provided"
    | "empty_token_provided"
    | "token_expired"
    | "token_invalid"
    | "unknown_user"
    | "wrong_credentials";

/**
 * @description - A security event to record.
 */
export interface SecurityEventInput {
    /** @description - The kind of event. */
    event: SecurityEventName;
    /** @description - Whether it succeeded. */
    outcome: SecurityEventOutcome;
    /** @description - The request that triggered it, for its network context. */
    req?: Request;
    /** @description - The user concerned, when it could be established. */
    uuid_user?: string;
    /** @description - The login concerned, kept even when no account matches it. */
    username?: string;
    /** @description - Why the attempt failed. */
    reason?: AuthenticationFailureReason | string;
    /** @description - The offending token: only a fingerprint of it is ever stored. */
    token?: string;
    /** @description - Any additional context, stored as jsonb. */
    detail?: Record<string, unknown>;
}

const INSERT_EVENT = `INSERT INTO logging.t_security_event
    (event, outcome, uuid_user, username, ip, method, path, reason, detail)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`;

/**
 * @description - Derive a short, non reversible fingerprint of a token.
 * It lets an operator tell a single stale token being retried apart from many
 * distinct forged tokens, without ever storing token material.
 * @param {string} token - The rejected token.
 * @returns {string} - The first 12 hexadecimal characters of its SHA-256 digest.
 */
function fingerprint_token(token: string): string {
    return createHash("sha256").update(token).digest("hex").slice(0, 12);
}

/**
 * @description - Decide whether an event is recorded at all.
 *
 * A successful token verification happens on every single authenticated call, so
 * recording it would add one insert per API request to the database that holds
 * the models. It is therefore dropped unless explicitly asked for with
 * SECURITY_AUDIT_PERSIST_TOKEN_SUCCESS. Sign ins, rejections and privilege events
 * are low volume and always recorded.
 * @param {SecurityEventInput} input - The event.
 * @returns {boolean} - True if the event has to be written.
 */
function has_to_be_recorded(input: SecurityEventInput): boolean {
    if (input.event === "token_verification" && input.outcome === "success") {
        return environment.persist_successful_token_verification;
    }
    return true;
}

/**
 * @description - Record a security event in logging.t_security_event.
 *
 * The insert runs on its own pooled connection rather than on the transaction of
 * the request: an audit record must not disappear when the request it describes
 * is rolled back. The caller is never made to wait for it, and a database problem
 * never propagates to the request. The database being the only sink, a failure to
 * write means the event is lost, so it is reported on stderr where the container
 * log will pick it up.
 *
 * The token itself is never stored, solely a fingerprint of it.
 * @param {SecurityEventInput} input - The event to record.
 */
export function record_security_event(input: SecurityEventInput): void {
    if (!has_to_be_recorded(input)) return;

    const detail = {
        ...input.detail,
        ...(input.token ? { token_fingerprint: fingerprint_token(input.token) } : {}),
        ...(input.req?.get("user-agent")
            ? { user_agent: input.req.get("user-agent") }
            : {}),
    };

    const values = [
        input.event,
        input.outcome,
        input.uuid_user ?? null,
        input.username ?? null,
        input.req?.ip ?? null,
        input.req?.method ?? null,
        input.req?.originalUrl ?? null,
        input.reason ?? null,
        Object.keys(detail).length > 0 ? JSON.stringify(detail) : null,
    ];

    const failed = (err: unknown) => {
        console.error(
            "Security event could not be recorded:",
            input.event,
            input.outcome,
            input.reason ?? "",
            err instanceof Error ? err.message : String(err)
        );
    };

    try {
        database_connection
            .getInstance()
            .getPool()
            .query(INSERT_EVENT, values)
            .catch(failed);
    } catch (err) {
        failed(err);
    }
}

/**
 * @description - Record a rejected authentication attempt.
 * @param {Request} req - The request whose authentication failed.
 * @param {AuthenticationFailureReason} reason - Why the attempt was rejected.
 * @param {string} token - The offending token, if one was supplied at all.
 * @param {Record<string, unknown>} details - Extra context, such as the expiry date.
 */
export function log_authentication_failure(
    req: Request,
    reason: AuthenticationFailureReason,
    token?: string,
    details?: Record<string, unknown>
): void {
    record_security_event({
        event: "token_verification",
        outcome: "failure",
        req: req,
        reason: reason,
        token: token,
        detail: details,
    });
}
