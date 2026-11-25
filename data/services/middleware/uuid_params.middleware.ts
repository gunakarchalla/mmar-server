import { Request, Router } from "express";
import { HTTP400Error } from "./error_handling/standard_errors.middleware";

/**
 * @description - The route parameters that name an object by uuid.
 *
 * Anything not on this list is left alone: :username and :name are free text.
 */
const UUID_PARAMS = [
    "uuid",
    "uuid_user",
    "uuidMetaObject",
    "uuidInstanceObject",
    "userUuid",
    "groupUuid",
] as const;

/**
 * @description - The textual form of a uuid, as PostgreSQL accepts it.
 */
const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * @description - Reject a request whose uuid parameter is not one.
 *
 * Without this the malformed value travels all the way to the database, which
 * refuses to cast it, and the failure comes back as a 500 — the server reporting
 * its own error for what is plainly a bad request. The caller is told which
 * parameter is wrong instead.
 * @param {Router} router - The router to install the checks on.
 */
export function validate_uuid_params(router: Router): void {
    for (const name of UUID_PARAMS) {
        router.param(name, (req, res, next, value: string) => {
            if (UUID_PATTERN.test(value)) return next();
            return next(
                new HTTP400Error(
                    `The ${name} parameter must be a uuid, but "${value}" is not one.`
                )
            );
        });
    }
}

/**
 * @description - Route parameters as this server actually receives them.
 *
 * Express 5 types `req.params` as `{ [name: string]: string | string[] }`,
 * because path-to-regexp 8 hands back an array for a *repeated* parameter
 * (`:x*`, `:x+`). No route in this server declares one — every path here uses a
 * plain `:name` — so a value is always a single string. This is the one place
 * that says so, rather than each of the ~160 reads asserting it separately.
 */
export type RouteParams = { [name: string]: string };

/**
 * @description - A request whose route parameters are known to be single values.
 */
export type RouteRequest = Request<RouteParams>;

/**
 * @description - Read the route parameters of a request as single strings.
 *
 * For the handlers that are not wrapped by `withTransaction`, which already
 * hands its body a {@link RouteRequest}.
 * @param {Request} req - The request to read the parameters of.
 * @returns {RouteParams} - The parameters, each a single string.
 */
export function route_params(req: Request): RouteParams {
    return req.params as RouteParams;
}
