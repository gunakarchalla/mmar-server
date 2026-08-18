import {RequestHandler} from "express";
import Users_connection from "../../data/meta/Users.connection";
import {User} from "../../../mmar-global-data-structure";
import {
    API401Error,
    BaseError,
    HTTP500Error,
} from "../../data/services/middleware/error_handling/standard_errors.middleware";
import {record_security_event} from "../../data/services/security_audit.service";
import { requireUser } from "../../data/services/middleware/auth.middleware";
import { withTransaction } from "../../data/services/transaction";
import { environment } from "../../data/services/environment";

/**
 * @description - Unwrap what the data layer returned, which is either the object,
 * an error it chose to report, or nothing at all.
 * @param {T | undefined | BaseError} result - What the connection returned.
 * @param {string} failure - What to say when it returned nothing.
 * @returns {T} - The object.
 * @throws {BaseError} - The error the data layer reported.
 */
function expect_object<T>(
    result: T | undefined | BaseError,
    failure: string
): T {
    if (result instanceof BaseError) throw result;
    if (result === undefined) throw new HTTP500Error(failure);
    return result;
}

class Users_controller {
    get_user_by_uuid: RequestHandler = withTransaction(async (client, req) =>
        expect_object(
            await Users_connection.getByUuid(
                client,
                req.params.uuid,
                requireUser(req).uuid
            ),
            `Failed to retrieve user ${req.params.uuid}`
        )
    );

    get_all_users: RequestHandler = withTransaction(async (client, req) => {
        const users = await Users_connection.getAll(client, requireUser(req).uuid);
        if (users instanceof BaseError) throw users;
        return users;
    });

    get_user_by_username: RequestHandler = withTransaction(async (client, req) =>
        expect_object(
            await Users_connection.getByUsername(
                client,
                req.params.username,
                requireUser(req).uuid
            ),
            `Failed to retrieve user ${req.params.username}`
        )
    );

    get_users_by_usergroup_uuid: RequestHandler = withTransaction(
        async (client, req) => {
            const users = await Users_connection.getByUsergroupUuid(
                client,
                req.params.uuid,
                requireUser(req).uuid
            );
            if (users instanceof BaseError) throw users;
            return users;
        }
    );

    patch_user_by_uuid: RequestHandler = withTransaction(async (client, req) => {
        const newUser = User.fromJS(req.body) as User;
        const hardPatch = req.query.hardpatch === "true";

        const updated = hardPatch
            ? await Users_connection.hardPatch(
                client,
                req.params.uuid,
                newUser,
                requireUser(req).uuid
            )
            : await Users_connection.update(
                client,
                req.params.uuid,
                newUser,
                requireUser(req).uuid
            );

        return expect_object(updated, `Failed to update user ${req.params.uuid}`);
    });

    /**
     * @description - Create a user account. The route restricts this to
     * administrators, and the caller is passed to the data layer so that the
     * right checks there run against a real identity rather than being skipped.
     *
     * No token is issued: an administrator creating an account for somebody else
     * must not be handed that person's session, and must not have their own
     * replaced.
     */
    post_user: RequestHandler = withTransaction(
        async (client, req) => {
            const newUser = User.fromJS(req.body) as User;
            return expect_object(
                await Users_connection.create(
                    client,
                    newUser,
                    requireUser(req).uuid
                ),
                `Failed to create user`
            );
        },
        { status: 201 }
    );

    signin_user: RequestHandler = withTransaction(async (client, req, res) => {
        const matched = await Users_connection.matchPassword(
            client,
            req.body.username,
            req.body.password
        );
        if (!matched) {
            record_security_event({
                event: "login",
                outcome: "failure",
                req: req,
                username: req.body.username,
                reason: "wrong_credentials",
            });
            throw new API401Error(`Wrong password or username`);
        }

        const user = await Users_connection.getByUsername(
            client,
            req.body.username
        );
        if (!(user instanceof User)) {
            record_security_event({
                event: "login",
                outcome: "failure",
                req: req,
                username: req.body.username,
                reason: "unknown_user",
            });
            throw new HTTP500Error(`User could not be logged in`);
        }

        const token = user.generate_token();
        res.cookie("authcookie", token, {
            // The cookie expires with the token it carries.
            maxAge: environment.token_expire_ms,
            httpOnly: true,
            sameSite: "lax",
            // Only sent over HTTPS in a real deployment. Left off in development,
            // where the server is reached over plain HTTP and a secure cookie
            // would never be stored.
            secure: !environment.is_development,
        });
        record_security_event({
            event: "login",
            outcome: "success",
            req: req,
            uuid_user: user.get_uuid(),
            username: user.get_username(),
        });
        return token;
    });

    signout_user: RequestHandler = async (req, res) => {
        res.clearCookie("authcookie");
        res.redirect("/login");
    };

    delete_user_by_uuid: RequestHandler = withTransaction(async (client, req) => {
        const deleted = await Users_connection.deleteByUuid(
            client,
            req.params.uuid,
            requireUser(req).uuid
        );
        if (deleted instanceof BaseError) throw deleted;
        if (deleted === undefined) {
            throw new HTTP500Error(`Failed to delete user ${req.params.uuid}`);
        }
        return Array.isArray(deleted) ? deleted : [deleted];
    });
}

export default new Users_controller();
