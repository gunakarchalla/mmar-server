import dotenv from "dotenv";
import type { PoolConfig } from "pg";

// The environment has to be loaded here rather than relying on the call in
// index.ts: ES module imports are hoisted, so this module can be evaluated
// (transitively, through the routes) before index.ts runs its own dotenv.config().
dotenv.config();

/**
 * @description - The shortest secret accepted for signing tokens. A shorter key
 * is brute forceable offline, and forging a token grants every permission the
 * platform has, so the server refuses to start rather than run with one.
 */
const JWT_SECRET_MIN_LENGTH = 32;

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
            `Define it in the .env file or in the environment before starting the server. ` +
            `See .env.example for the full list.`
        );
    }
    return value;
}

/**
 * @description - Read an optional environment variable.
 * @param {string} name - The name of the environment variable.
 * @param {string} fallback - The value to use when it is not set.
 * @returns {string} - The value, or the fallback.
 */
function optional_variable(name: string, fallback: string): string {
    const value = process.env[name];
    return value === undefined || value.trim() === "" ? fallback : value;
}

/**
 * @description - Read an environment variable holding a whole number.
 * A value that is present but not a number is a configuration mistake, and is
 * reported as one instead of silently becoming NaN inside the connection pool.
 * @param {string} name - The name of the environment variable.
 * @param {number} fallback - The value to use when it is not set.
 * @returns {number} - The parsed value, or the fallback.
 * @throws {Error} - If the variable is set to something that is not a number.
 */
function numeric_variable(name: string, fallback: number): number {
    const value = process.env[name];
    if (value === undefined || value.trim() === "") return fallback;

    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        throw new Error(
            `The environment variable ${name} must be a number, but it is set to "${value}".`
        );
    }
    return parsed;
}

/**
 * @description - Read an environment variable holding a comma separated list.
 * @param {string} name - The name of the environment variable.
 * @returns {string[]} - The trimmed, non empty entries. Empty if unset.
 */
function list_variable(name: string): string[] {
    return optional_variable(name, "")
        .split(",")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
}

/**
 * @description - Read the token signing secret and refuse anything too short to
 * be safe.
 *
 * A short secret is not a style problem: it can be recovered offline from a
 * single issued token, and the forged tokens that follow are indistinguishable
 * from real ones. The length rule is deliberately the only rule, rather than a
 * list of known bad values, because such a list is never complete and a passing
 * entry proves nothing.
 * @returns {string} - The secret.
 * @throws {Error} - If it is missing or shorter than JWT_SECRET_MIN_LENGTH.
 */
function require_jwt_secret(): string {
    const secret = require_variable("JWT_SECRET");
    if (secret.length < JWT_SECRET_MIN_LENGTH) {
        throw new Error(
            `JWT_SECRET must be at least ${JWT_SECRET_MIN_LENGTH} characters long, ` +
            `but the configured value is ${secret.length}. ` +
            `Generate one with: openssl rand -base64 48`
        );
    }
    return secret;
}

/**
 * @description - Convert a token lifetime into milliseconds.
 *
 * TOKEN_EXPIRE_TIME is written in the notation jsonwebtoken accepts, so the same
 * string has to be understood here to give the authentication cookie the same
 * lifetime as the token it carries. A bare number means seconds, as it does for
 * jsonwebtoken.
 * @param {string} value - The configured lifetime, such as "30m", "8h" or "3600".
 * @returns {number} - The lifetime in milliseconds.
 * @throws {Error} - If the value is not in a form jsonwebtoken would accept.
 */
function parse_duration_ms(value: string): number {
    const units: Record<string, number> = {
        ms: 1,
        s: 1_000,
        m: 60_000,
        h: 3_600_000,
        d: 86_400_000,
    };

    const match = /^(\d+(?:\.\d+)?)\s*(ms|s|m|h|d)?$/i.exec(value.trim());
    if (!match) {
        throw new Error(
            `TOKEN_EXPIRE_TIME must be a duration such as "30m", "8h" or a number ` +
            `of seconds, but it is set to "${value}".`
        );
    }

    const amount = Number(match[1]);
    const unit = match[2]?.toLowerCase() ?? "s";
    return amount * units[unit];
}

/**
 * @description - Build the connection pool configuration from the environment.
 *
 * The credentials used to live in config/DBConfig.json, which was committed to
 * the repository. They are read from the environment now so that a deployment
 * never inherits the password of whoever published the code. Everything except
 * the password has a usable default, so a local checkout only has to supply the
 * one value that must not be shared.
 * @returns {PoolConfig} - The pool configuration.
 */
function build_database_config(): PoolConfig {
    return {
        user: optional_variable("PGUSER", "api"),
        host: optional_variable("PGHOST", "database"),
        database: optional_variable("PGDATABASE", "api"),
        password: require_variable("PGPASSWORD"),
        port: numeric_variable("PGPORT", 5432),

        // One connection is held for the whole of a request, so the pool only has
        // to cover the requests in flight. Sizing it far above that does not add
        // throughput: past roughly twice the core count the database spends the
        // extra connections on context switching, and a pool larger than the
        // server's own max_connections simply fails to connect under load.
        max: numeric_variable("PGPOOL_MAX", 25),
        idleTimeoutMillis: numeric_variable("PGPOOL_IDLE_TIMEOUT_MS", 30_000),
        connectionTimeoutMillis: numeric_variable("PGPOOL_CONNECT_TIMEOUT_MS", 10_000),

        // A query that runs away must not pin its connection indefinitely: without
        // these, one pathological request degrades every other one by holding a
        // slot in a pool that is deliberately small.
        statement_timeout: numeric_variable("PG_STATEMENT_TIMEOUT_MS", 30_000),
        query_timeout: numeric_variable("PG_QUERY_TIMEOUT_MS", 30_000),
    };
}

/**
 * @description - The validated environment of the server. Accessing an invalid
 * environment throws while the server is starting up, instead of surfacing as an
 * authentication failure or a 500 once the server already accepts requests.
 */
export const environment = Object.freeze({
    /** @description - The deployment mode, "production" outside development. */
    node_env: optional_variable("NODE_ENV", "production"),

    /** @description - Whether the server runs in a development deployment. */
    is_development: optional_variable("NODE_ENV", "production") === "development",

    /** @description - The port the unsecured HTTP server listens on. */
    http_port: numeric_variable("HTTPPORT", 8000),

    /**
     * @description - How many reverse proxies sit in front of the server.
     *
     * Behind a proxy every request arrives from the proxy's address, so req.ip is
     * the proxy unless Express is told how many hops to unwind. That address is
     * what the rate limiter buckets on and what the audit trail records, so
     * leaving it wrong makes the limiter throttle every client as one and the
     * audit trail name the proxy instead of the caller. 0 means no proxy.
     */
    trust_proxy_hops: numeric_variable("TRUST_PROXY_HOPS", 0),

    /**
     * @description - The largest request body accepted, in bytes. Whole
     * metamodels are uploaded as a single JSON document and legitimately reach
     * several megabytes, so this cannot be small; the authentication routes set
     * their own far tighter limit, since a sign in is a few hundred bytes.
     */
    max_body_bytes: numeric_variable("MAX_BODY_BYTES", 16 * 1024 * 1024),

    /** @description - The largest uploaded file accepted, in bytes. */
    max_upload_bytes: numeric_variable("MAX_UPLOAD_BYTES", 16 * 1024 * 1024),

    /** @description - The secret used to sign and verify the JSON web tokens. */
    jwt_secret: require_jwt_secret(),

    /**
     * @description - How long an issued token stays valid, in the notation
     * accepted by jsonwebtoken ("2h", "7d", or a number of seconds).
     */
    token_expire_time: optional_variable("TOKEN_EXPIRE_TIME", "8h"),

    /**
     * @description - The same lifetime in milliseconds, so that the
     * authentication cookie expires with the token it carries.
     */
    token_expire_ms: parse_duration_ms(
        optional_variable("TOKEN_EXPIRE_TIME", "8h")
    ),

    /**
     * @description - The browser origins allowed to call the API. The API
     * authenticates with a cookie as well as a bearer token, so it cannot be left
     * open to every origin. Empty means same origin only.
     */
    cors_origins: list_variable("CORS_ORIGINS"),

    /**
     * @description - The public base url used to build the links returned for
     * uploaded files. Falls back to the host of the request when unset.
     */
    public_base_url: optional_variable("PUBLIC_BASE_URL", ""),

    /**
     * @description - Whether a successful token verification is recorded in
     * logging.t_security_event. It happens on every authenticated call, so it is
     * off by default to keep one insert per API request out of the database. Sign
     * ins, rejections and privilege events are always recorded regardless of this
     * setting.
     */
    persist_successful_token_verification:
        process.env.SECURITY_AUDIT_PERSIST_TOKEN_SUCCESS === "true",

    /** @description - The connection pool configuration. */
    database: Object.freeze(build_database_config()),
});
