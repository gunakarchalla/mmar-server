import {RequestHandler} from "express";
import Users_connection from "../../data/meta/Users.connection";
import {User} from "../../../mmar-global-data-structure";
import {
    API401Error,
    BaseError,
    HTTP400Error,
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

/**
 * @description - The longest password bcrypt actually hashes.
 *
 * bcrypt reads at most 72 bytes and silently ignores the rest, so a longer
 * password would be stored as its first 72 bytes and verified against only
 * those at sign in. It is refused rather than truncated without saying so. The
 * limit counts bytes rather than characters, as bcrypt does — a password of
 * emoji reaches it four times sooner than one of ASCII.
 */
const MAX_PASSWORD_BYTES = 72;

/**
 * @description - Check a submitted password before it is hashed.
 *
 * The only rule is that there has to be one: no complexity policy is imposed.
 * Both checks are matters of correctness rather than policy — a body carrying no
 * password is a malformed request, and one past bcrypt's limit would not be
 * stored in full.
 * @param {unknown} password - The password field of the request body.
 * @returns {string} - The password, once it is known to be usable.
 * @throws {HTTP400Error} - If it is absent, empty, or too long to hash.
 */
function validate_password(password: unknown): string {
    if (typeof password !== "string" || password.length === 0) {
        throw new HTTP400Error("A non-empty password is required");
    }
    if (Buffer.byteLength(password, "utf8") > MAX_PASSWORD_BYTES) {
        throw new HTTP400Error(
            `The password must be at most ${MAX_PASSWORD_BYTES} bytes long`
        );
    }
    return password;
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
     * @description - Set the password of a user. Restricted to administrators by
     * the route and by the data layer behind it.
     *
     * The new password never travels back out: the response is the user as every
     * other endpoint returns them, which by construction carries no hash.
     */
    set_user_password: RequestHandler = withTransaction(async (client, req) => {
        const password = validate_password(req.body?.password);
        const caller = requireUser(req);

        const updated = await Users_connection.setPassword(
            client,
            req.params.uuid,
            password,
            caller.uuid
        );

        if (updated instanceof BaseError) {
            record_security_event({
                event: "password_change",
                outcome: "failure",
                req: req,
                uuid_user: req.params.uuid,
                reason: `refused_${updated.httpCode}`,
                detail: { changed_by: caller.uuid },
            });
            throw updated;
        }

        const user = expect_object(
            updated,
            `Failed to set the password of user ${req.params.uuid}`
        );

        record_security_event({
            event: "password_change",
            outcome: "success",
            req: req,
            uuid_user: user.get_uuid(),
            username: user.get_username(),
            // Who performed the change, which is not necessarily whose password
            // it is; the audit trail has to distinguish the two.
            detail: { changed_by: caller.uuid },
        });

        return user;
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

    /**
     * @description - Change one's own password, authorised by the current one
     * rather than by a token, so that it can be used while signed out. The route
     * rate limits it alongside sign in, both being ways to test a password.
     *
     * A wrong current password and an unknown username are answered identically,
     * so this cannot be used to find out which accounts exist.
     */
    change_own_password: RequestHandler = withTransaction(async (client, req) => {
        const username = req.body?.username;
        const current_password = req.body?.current_password;
        if (typeof username !== "string" || username.length === 0) {
            throw new HTTP400Error("A username is required");
        }
        if (typeof current_password !== "string" || current_password.length === 0) {
            throw new HTTP400Error("The current password is required");
        }
        const new_password = validate_password(req.body?.new_password);

        const updated = await Users_connection.changeOwnPassword(
            client,
            username,
            current_password,
            new_password
        );

        if (updated instanceof BaseError) {
            record_security_event({
                event: "password_change",
                outcome: "failure",
                req: req,
                username: username,
                reason:
                    updated.httpCode === 401 ? "wrong_credentials" : `refused_${updated.httpCode}`,
            });
            throw updated;
        }

        const user = expect_object(
            updated,
            `Failed to change the password of user ${username}`
        );

        record_security_event({
            event: "password_change",
            outcome: "success",
            req: req,
            uuid_user: user.get_uuid(),
            username: user.get_username(),
            // Self service, as opposed to an administrator setting it for them.
            detail: { changed_by: "self" },
        });

        return user;
    });

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
