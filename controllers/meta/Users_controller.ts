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

class Users_controller {
    get_user_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();
        try {
            await client.query("BEGIN");

            const user = await Users_connection.getByUuid(client, req.params.uuid, req.body.tokendata.uuid);
            if (user instanceof User) {
                user.set_password(""); // obfuscate password
                res.status(200).send(user);
            } else if (User instanceof BaseError) {
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
            await client.query("BEGIN");
            const users = await Users_connection.getAll(client, req.body.tokendata.uuid);
            if (Array.isArray(users)) {
                res.status(200).send(
                    // obfuscate password
                    users.map((user) => {
                        user.set_password("");
                        return filter_object(user, req.query.filter);
                    }),
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
            await client.query("BEGIN");

            const user = await Users_connection.getByUsername(
                client,
                req.params.username,
                req.body.tokendata.uuid
            );
            if (user instanceof User) {
                user.set_password(""); // obfuscate password
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
            await client.query("BEGIN");

            const users = await Users_connection.getByUsergroupUuid(
                client,
                req.params.uuid,
                req.body.tokendata.uuid
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
            await client.query("BEGIN");

            const newUser = User.fromJS(req.body) as User;
            const hardPatch = req.query.hardpatch === "true";
            let sc;

            if (hardPatch) {
                sc = await Users_connection.hardPatch(client, req.params.uuid, newUser, req.body.tokendata.uuid);
            } else {
                sc = await Users_connection.update(client, req.params.uuid, newUser, req.body.tokendata.uuid);
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

    post_user: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();
        try {
            await client.query("BEGIN");

            const newUser = User.fromJS(req.body) as User;
            const user = await Users_connection.create(
                client,
                newUser);
            if (user instanceof User) {
                const token = user.generate_token();
                res.cookie("authcookie", token, {
                    maxAge: 900000,
                    httpOnly: true,
                });
                res.status(201).json(token);
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
            await client.query("BEGIN");

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
                        maxAge: 900000,
                        httpOnly: true,
                    });
                    res.json(token);
                } else {
                    throw new HTTP500Error(`User could not be logged in`);
                }
            } else {
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
            await client.query("BEGIN");

            const user = await Users_connection.deleteByUuid(
                await client,
                req.params.uuid,
                req.body.tokendata.uuid
            );
            if (Array.isArray(user)) {
                res.status(200).json(user);
            } else if (user instanceof BaseError) {
                throw user;
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
