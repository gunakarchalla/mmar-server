import * as jwt from "jsonwebtoken";
import type { User, UUID } from "../../../mmar-global-data-structure";
import { environment } from "./environment";

/**
 * @description - The algorithm the tokens of this server are signed and verified
 * with.
 *
 * It is named once and used on both sides, so that signing and verification
 * cannot drift apart. Pinning it on the verifying side is what matters: left
 * open, a caller chooses the algorithm their forged token is checked with, which
 * is the basis of every "alg" confusion attack.
 */
const TOKEN_ALGORITHM = "HS256" as const;

/**
 * @description - The claims this server puts into the tokens it issues.
 */
export interface UserTokenClaims {
    /** @description - The uuid of the authenticated user. */
    uuid: UUID;
    /** @description - The login of the authenticated user. */
    username: string;
    /**
     * @description - Whether the user was an administrator when the token was
     * issued. A token lives for hours, so this claim is a record of the past
     * rather than an authorisation: require_administrator asks the database.
     */
    isAdmin: boolean;
}

/**
 * @description - The payload carried by a JSON web token issued by this server:
 * the claims above, plus the registered ones jsonwebtoken adds such as iat and exp.
 */
export type AuthTokenPayload = UserTokenClaims & jwt.JwtPayload;

/**
 * @description - Issue a token for a user who has just proved who they are.
 *
 * This lives in the server rather than on the shared User structure because it
 * needs the signing secret and a Node crypto implementation. Bundling it with
 * the structure put both into every browser build that imports a User, which the
 * clients had to alias away to keep the Node-only jsonwebtoken out of their
 * bundle.
 * @param {User} user - The user to issue the token for.
 * @returns {string} - The signed token.
 */
export function sign_user_token(user: User): string {
    const claims: UserTokenClaims = {
        username: user.get_username(),
        uuid: user.get_uuid(),
        isAdmin: user.is_admin(),
    };

    return jwt.sign(claims, environment.jwt_secret, {
        algorithm: TOKEN_ALGORITHM,
        expiresIn: environment.token_expire_time as jwt.SignOptions["expiresIn"],
    });
}

/**
 * @description - Verify a token against the secret and algorithm this server signs with.
 * @param {string} token - The token presented by the caller.
 * @returns {string | jwt.JwtPayload} - The verified payload, which still has to be
 * narrowed with is_auth_token_payload before its claims are trusted.
 * @throws {jwt.JsonWebTokenError} - If the token is expired, malformed, or not
 * signed by this server.
 */
export function verify_user_token(token: string): string | jwt.JwtPayload {
    return jwt.verify(token, environment.jwt_secret, {
        algorithms: [TOKEN_ALGORITHM],
    });
}

/**
 * @description - Narrow a verified token payload to the payload this server issues.
 * A token can be validly signed and still not describe a user, so the claims the
 * controllers rely on are checked before they are trusted.
 * @param {string | jwt.JwtPayload} payload - The payload returned by verify_user_token.
 * @returns {boolean} - True if the payload describes an authenticated user.
 */
export function is_auth_token_payload(
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
