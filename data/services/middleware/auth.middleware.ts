import { NextFunction, Request, RequestHandler, Response } from "express";
import * as jwt from "jsonwebtoken";
import {
    is_auth_token_payload,
    verify_user_token,
} from "../token.service";
import type { AuthTokenPayload } from "../token.service";
import {
    log_authentication_failure,
    record_security_event,
} from "../security_audit.service";
import { run_with_request_context } from "../request_context";
import {
    API401Error,
    HTTP403NORIGHT,
} from "./error_handling/standard_errors.middleware";
import { is_administrator_standalone } from "../authorization";

/**
 * @description - The payload the authenticated user is exposed as. It is
 * defined alongside the signing in token.service, so that what this middleware
 * trusts and what the server issues cannot describe different things, and
 * re-exported here because this is where it reaches a request.
 */
export type { AuthTokenPayload };

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        /**
         * @description - The authenticated user is exposed on the request itself and
         * not on req.body: the body is supplied by the client, so a value stored
         * there is indistinguishable from one forged by the caller.
         */
        interface Request {
            user?: AuthTokenPayload;
        }
    }
}

/**
 * @description - Extract the bearer token from the request.
 * The Authorization header takes precedence over the authentication cookie.
 * @param {Request} req - The incoming request.
 * @returns {string | undefined} - The token, or undefined if none was supplied.
 */
function extract_token(req: Request): string | undefined {
    const authorization_header = req.headers.authorization;
    if (authorization_header !== undefined) {
        const [scheme, token] = authorization_header.split(" ");
        if (scheme.toLowerCase() === "bearer" && token) {
            return token;
        }
    }
    return req.cookies?.authcookie;
}

/**
 * @description - Verify the token of the request and attach the authenticated user to it.
 * Every rejection is recorded in the security audit log and reported through the
 * centralised error handler as a 401.
 * @param {Request} req - The incoming request.
 * @param {Response} res - The response, left untouched: errors travel through next().
 * @param {NextFunction} next - The next handler of the chain.
 */
export const authenticate_token: RequestHandler = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const token = extract_token(req);

    if (!token) {
        log_authentication_failure(req, "no_token_provided");
        return next(new API401Error("No token provided", "No token provided"));
    }

    if (token.trim() === "") {
        log_authentication_failure(req, "empty_token_provided");
        return next(
            new API401Error("Empty token provided", "Empty token provided")
        );
    }

    // Only the verification is guarded: next() runs the rest of the chain
    // synchronously, so calling it inside the try would turn any error thrown
    // downstream into a misleading "Invalid token" 401.
    let payload: string | jwt.JwtPayload;
    try {
        payload = verify_user_token(token);
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            log_authentication_failure(req, "token_expired", token, {
                expired_at: err.expiredAt,
            });
            return next(new API401Error("Token expired", "Token expired"));
        }
        log_authentication_failure(req, "token_invalid", token, {
            detail: err instanceof Error ? err.message : undefined,
        });
        return next(new API401Error("Invalid token", "Invalid token"));
    }

    if (!is_auth_token_payload(payload)) {
        log_authentication_failure(req, "token_invalid", token, {
            detail: "the token payload does not describe a user",
        });
        return next(new API401Error("Invalid token", "Invalid token"));
    }

    req.user = payload;
    record_security_event({
        event: "token_verification",
        outcome: "success",
        req: req,
        uuid_user: payload.uuid,
        username: payload.username,
    });

    // The rest of the request, including everything it awaits, runs inside the
    // context so that the data layer can attribute its writes to this user.
    return run_with_request_context({ user: payload }, () => next());
};

/**
 * @description - Refuse the request unless the caller is an administrator.
 *
 * Administrator status is membership of a user group flagged is_administrator,
 * and it is read from the database rather than from the isAdmin claim of the
 * token: a token lives for hours, so trusting its claim would let a demoted
 * administrator keep acting as one until it expired.
 *
 * Must be placed after authenticate_token.
 * @param {Request} req - The incoming request.
 * @param {Response} res - The response, left untouched: errors travel through next().
 * @param {NextFunction} next - The next handler of the chain.
 */
export const require_administrator: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    let user: AuthTokenPayload;
    try {
        user = requireUser(req);
    } catch (err) {
        return next(err);
    }

    try {
        if (await is_administrator_standalone(user.uuid)) {
            return next();
        }
        return next(
            new HTTP403NORIGHT(
                `The user ${user.uuid} is not an administrator`
            )
        );
    } catch (err) {
        return next(err);
    }
};

/**
 * @description - Get the authenticated user of a request, requiring that the route
 * is protected by authenticate_token. Use this in every handler that acts on
 * behalf of a user.
 * @param {Request} req - The current request.
 * @returns {AuthTokenPayload} - The authenticated user.
 * @throws {API401Error} - If the request was never authenticated.
 */
export function requireUser(req: Request): AuthTokenPayload {
    if (req.user === undefined) {
        throw new API401Error(
            "Authentication required",
            "Authentication required"
        );
    }
    return req.user;
}

/**
 * @description - Get the authenticated user of a request, if any. Use this only on
 * routes that are deliberately reachable without authentication.
 * @param {Request} req - The current request.
 * @returns {AuthTokenPayload | undefined} - The authenticated user, or undefined.
 */
export function getUser(req: Request): AuthTokenPayload | undefined {
    return req.user;
}
