import { Router } from "express";
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
