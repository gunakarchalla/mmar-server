import { NextFunction, Request, RequestHandler, Response } from "express";
import * as jwt from "jsonwebtoken";
import type { UUID } from "../../../../mmar-global-data-structure";
import { environment } from "../environment";
import {
    log_authentication_failure,
    record_security_event,
} from "../security_audit.service";
import { run_with_request_context } from "../request_context";
import { API401Error } from "./error_handling/standard_errors.middleware";

/**
 * @description - The payload carried by a JSON web token issued by this server.
 * It mirrors what User.generate_token() signs.
 */
export interface AuthTokenPayload extends jwt.JwtPayload {
    /** @description - The uuid of the authenticated user. */
    uuid: UUID;
    /** @description - The login of the authenticated user. */
    username: string;
    /** @description - Whether the authenticated user is the administrator. */
    isAdmin: boolean;
}

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
 * @description - Narrow a verified token payload to the payload this server issues.
 * A token can be validly signed and still not describe a user, so the claims the
 * controllers rely on are checked before they are trusted.
 * @param {string | jwt.JwtPayload} payload - The payload returned by jwt.verify.
 * @returns {boolean} - True if the payload describes an authenticated user.
 */
function is_auth_token_payload(
    payload: string | jwt.JwtPayload
): payload is AuthTokenPayload {
    return (
        typeof payload === "object" &&
        payload !== null &&
        typeof payload.uuid === "string" &&
        typeof payload.username === "string" &&
        typeof payload.isAdmin === "boolean"
    );
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
        payload = jwt.verify(token, environment.jwt_secret);
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
