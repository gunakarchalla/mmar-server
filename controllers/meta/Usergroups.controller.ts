import {database_connection} from "../../index";
import {RequestHandler} from "express";
import {BaseError, HTTP500Error,} from "../../data/services/middleware/error_handling/standard_errors.middleware";
import UsergroupsConnection from "../../data/meta/Usergroups.connection";
import {Usergroup} from "../../../mmar-global-data-structure";
import {filter_object} from "../../data/services/middleware/object_filter";
import { requireUser } from "../../data/services/middleware/auth.middleware";
import { begin_transaction } from "../../data/services/transaction";

class UsersgroupController {
    get_usergroups: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();
        try {
            await begin_transaction(client);

            const usersgroups = await UsergroupsConnection.getAll(
                client,
                requireUser(req).uuid,
            );
            if (Array.isArray(usersgroups)) {
                res
                    .status(200)
                    .json(
                        usersgroups.map((usergroup) =>
                            filter_object(usergroup, req.query.filter),
                        ),
                    );
            } else {
                throw new HTTP500Error("Failed to retrieve usergroups");
            }
            await client.query("COMMIT");
        } catch (err) {
            try {
                await client.query("ROLLBACK");
            } catch {
                // The connection is already gone; the error below is the
                // one worth reporting.
            }
            next(err);
        } finally {
            (await client).release();
        }
    };

    get_usergroup_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();
        try {
            await begin_transaction(client);

            const usergroup = await UsergroupsConnection.getByUuid(
                await client,
                req.params.uuid,
                requireUser(req).uuid,
            );
            if (usergroup instanceof Usergroup) {
                // The transaction is made durable before the client is told it succeeded:
                // answering first left a window in which a caller could act on a 201
                // and not yet see what it had been promised.
                await client.query("COMMIT");
                res.status(200).json(filter_object(usergroup, req.query.filter));
            } else if (usergroup instanceof BaseError) {
                throw usergroup;
            } else {
                throw new HTTP500Error(`Failed to retrieve usergroup ${req.params.uuid}`,);
            }
        } catch (err) {
            try {
                await client.query("ROLLBACK");
            } catch {
                // The connection is already gone; the error below is the
                // one worth reporting.
            }
            next(err);
        } finally {
            (await client).release();
        }
    };

    get_usergroup_for_user_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();
        try {
            await begin_transaction(client);

            const usergroup = await UsergroupsConnection.getAllByUserUuid(
                await client,
                req.params.uuid,
                requireUser(req).uuid,
            );
            if (Array.isArray(usergroup)) {
                // The transaction is made durable before the client is told it succeeded:
                // answering first left a window in which a caller could act on a 201
                // and not yet see what it had been promised.
                await client.query("COMMIT");
                res.status(200).json(filter_object(usergroup, req.query.filter));
            } else {
                throw new HTTP500Error(`Failed to retrieve usergroup ${req.params.uuid}`,);
            }
        } catch (err) {
            try {
                await client.query("ROLLBACK");
            } catch {
                // The connection is already gone; the error below is the
                // one worth reporting.
            }
            next(err);
        } finally {
            (await client).release();
        }
    };

    post_usergroup: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();
        try {
            await begin_transaction(client);
            const newUserGroup = Usergroup.fromJS(req.body) as Usergroup;
            if (req.params.uuid) {
                newUserGroup.uuid = req.params.uuid;
            }
            const usergroup = await UsergroupsConnection.create(client, newUserGroup, requireUser(req).uuid);
            if (usergroup instanceof Usergroup) {
                // The transaction is made durable before the client is told it succeeded:
                // answering first left a window in which a caller could act on a 201
                // and not yet see what it had been promised.
                await client.query("COMMIT");
                res.status(201).json(usergroup);
            } else if (usergroup instanceof BaseError) {
                throw usergroup;
            } else {
                throw new HTTP500Error("Usergroup could not be created");
            }
        } catch (err) {
            try {
                await client.query("ROLLBACK");
            } catch {
                // The connection is already gone; the error below is the
                // one worth reporting.
            }
            next(err);
        } finally {
            (await client).release();
        }
    };

    patch_usergroup: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();
        try {
            await begin_transaction(client);

            const userGrpToUpdate = Usergroup.fromJS(req.body) as Usergroup;
            userGrpToUpdate.uuid = req.params.uuid;
            const hardPatch = req.query.hardpatch === "true";
            let sc;
            if (hardPatch) {
                sc = await UsergroupsConnection.hardUpdate(
                    client,
                    req.params.uuid,
                    userGrpToUpdate,
                    requireUser(req).uuid,
                );
            } else {
                sc = await UsergroupsConnection.update(
                    client,
                    req.params.uuid,
                    userGrpToUpdate,
                    requireUser(req).uuid
                );
            }
            if (sc instanceof Usergroup) {
                // The transaction is made durable before the client is told it succeeded:
                // answering first left a window in which a caller could act on a 201
                // and not yet see what it had been promised.
                await client.query("COMMIT");
                res.status(200).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(`Failed to update usergroup ${req.params.uuid}`);
            }
        } catch (err) {
            try {
                await client.query("ROLLBACK");
            } catch {
                // The connection is already gone; the error below is the
                // one worth reporting.
            }
            next(err);
        } finally {
            (await client).release();
        }
    };

    delete_usergroup: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();
        try {
            await begin_transaction(client);

            const usergroup = await UsergroupsConnection.deleteByUuid(
                client,
                req.params.uuid,
                requireUser(req).uuid,
            );
            if (Array.isArray(usergroup)) {
                // The transaction is made durable before the client is told it succeeded:
                // answering first left a window in which a caller could act on a 201
                // and not yet see what it had been promised.
                await client.query("COMMIT");
                res.status(200).json(filter_object(usergroup, req.query.filter));
            } else if (usergroup instanceof BaseError) {
                throw usergroup;
            } else {
                throw new HTTP500Error("Usergroup could not be deleted");
            }
        } catch (err) {
            try {
                await client.query("ROLLBACK");
            } catch {
                // The connection is already gone; the error below is the
                // one worth reporting.
            }
            next(err);
        } finally {
            (await client).release();
        }
    };

    delete_usergroup_for_user_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();
        try {
            await begin_transaction(client);

            const usergroup = await UsergroupsConnection.deleteByUserUuid(
                client,
                req.params.userUuid,
                req.params.groupUuid,
                requireUser(req).uuid,
            );
            if (usergroup instanceof Usergroup) {
                // The transaction is made durable before the client is told it succeeded:
                // answering first left a window in which a caller could act on a 201
                // and not yet see what it had been promised.
                await client.query("COMMIT");
                res.status(200).json(filter_object(usergroup, req.query.filter));
            } else if (usergroup instanceof BaseError) {
                throw usergroup;
            } else {
                throw new HTTP500Error("Usergroup could not be deleted");
            }
        } catch (err) {
            try {
                await client.query("ROLLBACK");
            } catch {
                // The connection is already gone; the error below is the
                // one worth reporting.
            }
            next(err);
        } finally {
            (await client).release();
        }
    };

    add_usergroup_for_user_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();
        try {
            await begin_transaction(client);

            const usergroup = await UsergroupsConnection.addByUserUuid(
                client,
                req.params.userUuid,
                req.params.groupUuid,
                requireUser(req).uuid,
            );
            if (usergroup instanceof Usergroup) {
                // The transaction is made durable before the client is told it succeeded:
                // answering first left a window in which a caller could act on a 201
                // and not yet see what it had been promised.
                await client.query("COMMIT");
                res.status(200).json(filter_object(usergroup, req.query.filter));
            } else if (usergroup instanceof BaseError) {
                throw usergroup;
            } else {
                throw new HTTP500Error("User could not be added to usergroup");
            }
        } catch (err) {
            try {
                await client.query("ROLLBACK");
            } catch {
                // The connection is already gone; the error below is the
                // one worth reporting.
            }
            next(err);
        } finally {
            (await client).release();
        }
    };

    add_metaobject_to_usergroup: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();
        try {
            await begin_transaction(client);

            const usergroup = await UsergroupsConnection.addRightToMetaObject(
                client,
                req.params.uuid,
                req.params.uuidMetaObject,
                requireUser(req).uuid,
                req.body.has_read_right,
                req.body.has_write_right,
                req.body.has_delete_right
            );
            if (usergroup instanceof Usergroup) {
                // The transaction is made durable before the client is told it succeeded:
                // answering first left a window in which a caller could act on a 201
                // and not yet see what it had been promised.
                await client.query("COMMIT");
                res.status(200).json(filter_object(usergroup, req.query.filter));
            } else if (usergroup instanceof BaseError) {
                throw usergroup;
            } else {
                throw new HTTP500Error("Object could not be added to usergroup");

            }
        } catch (err) {
            try {
                await client.query("ROLLBACK");
            } catch {
                // The connection is already gone; the error below is the
                // one worth reporting.
            }
            next(err);
        } finally {
            (await client).release();
        }
    };

    // add_instanceobject_to_usergroup: RequestHandler = async (req, res, next) => {
    //     const client = await database_connection.getPool().connect();
    //     try {
    //         const usergroup = await UsergroupsConnection.addRightToInstanceObject(
    //             client,
    //             req.params.uuid,
    //             req.params.uuidInstanceObject,
    //             requireUser(req).uuid,
    //             req.body.has_read_right,
    //             req.body.has_write_right,
    //             req.body.has_delete_right,
    //         );
    //         if (usergroup instanceof Usergroup) {
    //             res.status(200).json(filter_object(usergroup, req.query.filter));
    //         } else if (usergroup instanceof BaseError) {
    //             throw usergroup;
    //         } else {
    //             throw new HTTP500Error("Object instance could not be added to usergroup");
    //         }
    //         await client.query("COMMIT");
    //     } catch (err) {
    //         await client.query("ROLLBACK");
    //         next(err);
    //     } finally {
    //         (await client).release();
    //     }
    // };

    delete_metaobject_from_usergroup: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();
        try {
            await begin_transaction(client);

            const usergroup = await UsergroupsConnection.deleteRightFromMetaObject(
                client,
                req.params.uuid,
                req.params.uuidMetaObject,
                requireUser(req).uuid,
                req.body.has_read_right,
                req.body.has_write_right,
                req.body.has_delete_right
            );
            if (usergroup instanceof Usergroup) {
                // The transaction is made durable before the client is told it succeeded:
                // answering first left a window in which a caller could act on a 201
                // and not yet see what it had been promised.
                await client.query("COMMIT");
                res.status(200).json(filter_object(usergroup, req.query.filter));
            } else if (usergroup instanceof BaseError) {
                throw usergroup;
            } else {
                throw new HTTP500Error("Object could not be deleted from usergroup");
            }
        } catch (err) {
            try {
                await client.query("ROLLBACK");
            } catch {
                // The connection is already gone; the error below is the
                // one worth reporting.
            }
            next(err);
        } finally {
            (await client).release();
        }
    };

    // delete_instance_from_usergroup: RequestHandler = async (req, res, next) => {
    //     const client = await database_connection.getPool().connect();
    //     try {
    //         const usergroup = await UsergroupsConnection.deleteRight(
    //             client,
    //             req.params.uuid,
    //             req.params.uuidInstanceObject,
    //             requireUser(req).uuid
    //         );
    //         if (usergroup instanceof Usergroup) {
    //             res.status(200).json(filter_object(usergroup, req.query.filter));
    //         } else if (usergroup instanceof BaseError) {
    //             throw usergroup;
    //         } else {
    //             throw new HTTP500Error("Object could not be deleted from usergroup");
    //         }
    //         await client.query("COMMIT");
    //     } catch (err) {
    //         await client.query("ROLLBACK");
    //         next(err);
    //     } finally {
    //         (await client).release();
    //     }
    // };
}

export default new UsersgroupController();
