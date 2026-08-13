import dotenv from "dotenv";

// The environment has to be loaded here rather than relying on the call in
// index.ts: ES module imports are hoisted, so this module can be evaluated
// (transitively, through the routes) before index.ts runs its own dotenv.config().
dotenv.config();

/**
 * @description - Read a mandatory environment variable and fail fast if it is missing.
 * The value is returned verbatim, without any normalisation, so that a secret
 * read here is byte-identical to the one used everywhere else (for example when
 * signing a token in User.generate_token()).
 * @param {string} name - The name of the environment variable.
 * @returns {string} - The value of the environment variable.
 * @throws {Error} - If the variable is undefined or empty.
 */
function require_variable(name: string): string {
    const value = process.env[name];
    if (value === undefined || value.trim() === "") {
        throw new Error(
            `Missing mandatory environment variable ${name}. ` +
            `Define it in the .env file or in the environment before starting the server.`
        );
    }
    return value;
}

/**
 * @description - The validated environment of the server. Accessing an invalid
 * environment throws while the server is starting up, instead of surfacing as an
 * authentication failure or a 500 once the server already accepts requests.
 */
export const environment = Object.freeze({
    /** @description - The secret used to sign and verify the JSON web tokens. */
    jwt_secret: require_variable("JWT_SECRET"),

    /**
     * @description - Whether a successful token verification is recorded in
     * logging.t_security_event. It happens on every authenticated call, so it is
     * off by default to keep one insert per API request out of the database. Sign
     * ins, rejections and privilege events are always recorded regardless of this
     * setting.
     */
    persist_successful_token_verification:
        process.env.SECURITY_AUDIT_PERSIST_TOKEN_SUCCESS === "true",
});
