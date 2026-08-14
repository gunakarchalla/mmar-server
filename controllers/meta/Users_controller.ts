import {database_connection} from "../../index";
import {RequestHandler} from "express";
import Users_connection from "../../data/meta/Users.connection";
import {User} from "../../../mmar-global-data-structure";
import {
    API401Error,
    BaseError,
    HTTP500Error,
} from "../../data/services/middleware/error_handling/standard_errors.middleware";
import {filter_object} from "../../data/services/middleware/object_filter";
import {record_security_event} from "../../data/services/security_audit.service";
import { requireUser } from "../../data/services/middleware/auth.middleware";
import { begin_transaction } from "../../data/services/transaction";
import { environment } from "../../data/services/environment";

class Users_controller {
    get_user_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();
        try {
            await begin_transaction(client);

            const user = await Users_connection.getByUuid(client, req.params.uuid, requireUser(req).uuid);
            if (user instanceof User) {
                res.status(200).send(user);
            } else if (user instanceof BaseError) {
                throw user;
            } else {
                throw new HTTP500Error(
                    `Failed to retrieve user ${req.params.uuid}`,
                );

            }
            await client.query("COMMIT");
        } catch (err) {
            await client.query("ROLLBACK");
            next(err);
        } finally {
            (await client).release();
        }
    };

    get_all_users: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();
        try {
            await begin_transaction(client);
            const users = await Users_connection.getAll(client, requireUser(req).uuid);
            if (Array.isArray(users)) {
                // The password hash is not selected by the data layer at all, so
                // there is nothing to strip here.
                res.status(200).send(
                    users.map((user) => filter_object(user, req.query.filter)),
                );
            } else if (users instanceof BaseError) {
                throw users;
            } else {
                throw new HTTP500Error(`Failed to retrieve users`);
            }
            await client.query("COMMIT");
        } catch (err) {
            await client.query("ROLLBACK");
            next(err);
        } finally {
            (await client).release();
        }
    };

    get_user_by_username: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();
        try {
            await begin_transaction(client);

            const user = await Users_connection.getByUsername(
                client,
                req.params.username,
                requireUser(req).uuid
            );
            if (user instanceof User) {
                res.status(200).send(user);
            } else if (user instanceof BaseError) {
                throw user;
            } else {
                throw new HTTP500Error(
                    `Failed to retrieve user ${req.params.username}`,
                );
            }
            await client.query("COMMIT");
        } catch (err) {
            await client.query("ROLLBACK");
            next(err);
        } finally {
            (await client).release();
        }
    };

    get_users_by_usergroup_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();
        try {
            await begin_transaction(client);

            const users = await Users_connection.getByUsergroupUuid(
                client,
                req.params.uuid,
                requireUser(req).uuid
            );
            if (Array.isArray(users)) {
                res.status(200).send(users);
            } else if (users instanceof BaseError) {
                throw users;
            } else {
                throw new HTTP500Error(`Failed to retrieve users`);
            }
            await client.query("COMMIT");
        } catch (err) {
            await client.query("ROLLBACK");
            next(err);
        } finally {
            (await client).release();
        }
    };

    patch_user_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();
        try {
            await begin_transaction(client);

            const newUser = User.fromJS(req.body) as User;
            const hardPatch = req.query.hardpatch === "true";
            let sc;

            if (hardPatch) {
                sc = await Users_connection.hardPatch(client, req.params.uuid, newUser, requireUser(req).uuid);
            } else {
                sc = await Users_connection.update(client, req.params.uuid, newUser, requireUser(req).uuid);
            }

            if (sc instanceof User) {
                res.status(200).json(sc);
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(`Failed to update user ${req.params.uuid}`);
            }
            await client.query("COMMIT");
        } catch (err) {
            await client.query("ROLLBACK");
            next(err);
        } finally {
            (await client).release();
        }
    };

    /**
     * @description - Create a user account. The route restricts this to
     * administrators, and the caller is passed to the data layer so that the
     * right checks there run against a real identity rather than being skipped.
     *
     * No token is issued: an administrator creating an account for somebody else
     * must not be handed that person's session, and must not have their own
     * replaced.
     */
    post_user: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();
        try {
            await begin_transaction(client);

            const newUser = User.fromJS(req.body) as User;
            const user = await Users_connection.create(
                client,
                newUser,
                requireUser(req).uuid,
            );
            if (user instanceof User) {
                res.status(201).json(filter_object(user, req.query.filter));
            } else if (user instanceof BaseError) {
                throw user;
            } else {
                throw new HTTP500Error(`Failed to create user`);
            }
            await client.query("COMMIT");
        } catch (err) {
            await client.query("ROLLBACK");
            next(err);
        } finally {
            (await client).release();
        }
    };

    signin_user: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();
        try {
            await begin_transaction(client);

            if (
                await Users_connection.matchPassword(
                    client,
                    req.body.username,
                    req.body.password,
                )
            ) {
                const user = await Users_connection.getByUsername(
                    client,
                    req.body.username,
                );
                if (user instanceof User) {
                    const token = user.generate_token();
                    res.cookie("authcookie", token, {
                        // The cookie now expires with the token it carries: it
                        // used to lapse after 15 minutes while the token inside
                        // stayed valid for a day.
                        maxAge: environment.token_expire_ms,
                        httpOnly: true,
                        sameSite: "lax",
                        // Only sent over HTTPS in a real deployment. Left off in
                        // development, where the server is reached over plain
                        // HTTP and a secure cookie would never be stored.
                        secure: !environment.is_development,
                    });
                    record_security_event({
                        event: "login",
                        outcome: "success",
                        req: req,
                        uuid_user: user.get_uuid(),
                        username: user.get_username(),
                    });
                    res.json(token);
                } else {
                    record_security_event({
                        event: "login",
                        outcome: "failure",
                        req: req,
                        username: req.body.username,
                        reason: "unknown_user",
                    });
                    throw new HTTP500Error(`User could not be logged in`);
                }
            } else {
                record_security_event({
                    event: "login",
                    outcome: "failure",
                    req: req,
                    username: req.body.username,
                    reason: "wrong_credentials",
                });
                throw new API401Error(`Wrong password or username`);
            }
            await client.query("COMMIT");
        } catch (err) {
            await client.query("ROLLBACK");
            next(err);
        } finally {
            (await client).release();
        }
    };

    signout_user: RequestHandler = async (req, res) => {
        res.clearCookie("authcookie");
        // clear local storage
        //localStorage.clear();
        res.redirect("/login");
    };

    delete_user_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();
        try {
            await begin_transaction(client);

            const user = await Users_connection.deleteByUuid(
                client,
                req.params.uuid,
                requireUser(req).uuid
            );
            if (user instanceof BaseError) {
                throw user;
            } else if (user !== undefined) {
                const deletedUuids = Array.isArray(user) ? user : [user];
                res.status(200).json(deletedUuids);
            } else {
                throw new HTTP500Error(`Failed to delete user ${req.params.uuid}`);
            }
            await client.query("COMMIT");
        } catch (err) {
            await client.query("ROLLBACK");
            next(err);
        } finally {
            (await client).release();
        }
    };
}

export default new Users_controller();
