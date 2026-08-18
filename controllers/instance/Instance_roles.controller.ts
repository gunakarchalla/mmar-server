import {RequestHandler} from "express";
import {database_connection} from "../../index";
import {plainToInstance} from "class-transformer";
import {RelationclassInstance, RoleInstance,} from "../../../mmar-global-data-structure";

import {
    BaseError,
    HTTP500Error,
} from "../../data/services/middleware/error_handling/standard_errors.middleware";
import {filter_object} from "../../data/services/middleware/object_filter";
import Instance_role_connection from "../../data/instance/Instance_roles.connection";
import Instance_relationclass_connection from "../../data/instance/Instance_relationclasses.connection";
import { requireUser } from "../../data/services/middleware/auth.middleware";
import { begin_transaction } from "../../data/services/transaction";

/**
 * @classdesc - This class is used to handle all the requests for the role instances.
 * @export - The class is exported so that it can be used by other files.
 * @class - Instance_role_controller
 */
class Instance_rolesController {
    /**
     * @description - Get a specific role instance by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the role instance.
     * @param res
     * @param next
     * @yield {status: 200, body: {RoleInstance}} - The role instance.
     * @throws {HTTP404Error} - If the role instance is not found.
     * @throws {HTTP500Error} - If the acquisition of the role instance fails.
     * @memberof Instance_role_controller
     * @method
     */
    get_role_instances_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();
        try {
            await begin_transaction(client);

            const sc = await Instance_role_connection.getByUuid(
                client,
                req.params.uuid,
                requireUser(req).uuid
            );
            if (sc instanceof RoleInstance) {
                // The transaction is made durable before the client is told it succeeded:
                // answering first left a window in which a caller could act on a 201
                // and not yet see what it had been promised.
                await client.query("COMMIT");
                res.status(200).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to retrieve role instance ${req.params.uuid}`
                );
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

    /**
     * @description - Get the role from instance for a specific relationclass instance by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the relationclass instance.
     * @param res
     * @param next
     * @yield {status: 200, body: {RoleInstance}} - The role from instance.
     * @throws {HTTP404Error} - If the relationclass instance is not found.
     * @throws {HTTP500Error} - If the acquisition of the role from instance fails.
     * @memberof Instance_role_controller
     * @method
     */
    get_rolefrom_for_relationclass_instances: RequestHandler = async (
        req,
        res,
        next
    ) => {
        const client = await database_connection.getPool().connect();

        try {
            await begin_transaction(client);

            const sc = await Instance_relationclass_connection.getByUuid(
                client,
                req.params.uuid,
                requireUser(req).uuid
            );
            if (sc instanceof RelationclassInstance) {
                // The transaction is made durable before the client is told it succeeded:
                // answering first left a window in which a caller could act on a 201
                // and not yet see what it had been promised.
                await client.query("COMMIT");
                res.status(200).json(filter_object(sc.get_role_instance_from(), req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to retrieve role instance from ${req.params.uuid}`
                );
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

    /**
     * @description - Get the role to instance for a specific relationclass instance by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the relationclass instance.
     * @param res
     * @param next
     * @yield {status: 200, body: {RoleInstance}} - The role to instance.
     * @throws {HTTP404Error} - If the relationclass instance is not found.
     * @throws {HTTP500Error} - If the acquisition of the role to instance fails.
     * @memberof Instance_role_controller
     * @method
     */
    get_roleto_for_relationclass_instances: RequestHandler = async (
        req,
        res,
        next
    ) => {
        const client = await database_connection.getPool().connect();

        try {
            await begin_transaction(client);

            const sc = await Instance_relationclass_connection.getByUuid(
                client,
                req.params.uuid,
                requireUser(req).uuid
            );
            if (sc instanceof RelationclassInstance) {
                // The transaction is made durable before the client is told it succeeded:
                // answering first left a window in which a caller could act on a 201
                // and not yet see what it had been promised.
                await client.query("COMMIT");
                res.status(200).json(filter_object(sc.get_role_instance_to(), req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to retrieve role instance to ${req.params.uuid}`
                );
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

    /**
     * @description - Get all the role instances for a specific scene instance by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the scene instance.
     * @param res
     * @param next
     * @yield {status: 200, body: {RoleInstance[]}} - The role instances.
     * @throws {HTTP404Error} - If the scene instance is not found.
     * @throws {HTTP500Error} - If the acquisition of the role instances fails.
     * @memberof Instance_role_controller
     * @method
     */
    get_roles_instances_for_scene: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await begin_transaction(client);
            const sc = await Instance_role_connection.getAllByParentUuid(
                client,
                req.params.uuid,
                requireUser(req).uuid
            );
            if (Array.isArray(sc)) {
                // The transaction is made durable before the client is told it succeeded:
                // answering first left a window in which a caller could act on a 201
                // and not yet see what it had been promised.
                await client.query("COMMIT");
                res.status(200).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to retrieve role instances for scene ${req.params.uuid}`
                );
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

    /**
     * @description - Modify a specific role instance by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the role instance.
     * @param {RoleInstance} req.body - The new role instance.
     * @param res
     * @param next
     * @yield {status: 200, body: {RoleInstance}} - The role instance.
     * @throws {HTTP500Error} - If the modification of the role instance fails.
     * @memberof Instance_role_controller
     * @method
     */
    patch_role_instance_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await begin_transaction(client);

            const newRole = RoleInstance.fromJS(req.body) as RoleInstance;
            const sc = await Instance_role_connection.update(
                client,
                req.params.uuid,
                newRole,
                requireUser(req).uuid
            );
            if (sc instanceof RoleInstance) {
                // The transaction is made durable before the client is told it succeeded:
                // answering first left a window in which a caller could act on a 201
                // and not yet see what it had been promised.
                await client.query("COMMIT");
                res.status(200).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to update role instance ${req.params.uuid}`
                );
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

    /**
     * @description - Create a new role instance by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the role instance.
     * @param res
     * @param next
     * @yield {status: 201, body: {RoleInstance}} - The role instance.
     * @throws {HTTP500Error} - If the creation of the role instance fails.
     * @memberof Instance_role_controller
     * @method
     */
    post_role_instance_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await begin_transaction(client);

            const newRole = RoleInstance.fromJS(req.body) as RoleInstance;
            newRole.set_uuid(req.params.uuid);
            const sc = await Instance_role_connection.postRolesInstance(
                client,
                newRole,
                requireUser(req).uuid
            );
            if (Array.isArray(sc)) {
                // The transaction is made durable before the client is told it succeeded:
                // answering first left a window in which a caller could act on a 201
                // and not yet see what it had been promised.
                await client.query("COMMIT");
                res.status(201).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to create role instance for ${req.params.uuid}`
                );
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

    /**
     * @description - Create new role instances for a specific scene instance by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the scene instance.
     * @param {RoleInstance} req.body - The new role instances.
     * @param res
     * @param next
     * @yield {status: 201, body: {RoleInstance[]}} - The created role instance(s).
     * @throws {HTTP500Error} - If the creation of the role instances fails.
     * @memberof Instance_role_controller
     * @method
     */
    post_role_instances: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await begin_transaction(client);

            const newRole = plainToInstance(RoleInstance, req.body);
            for (const roleToAdd of newRole) {
                roleToAdd.uuid_has_reference_scene_instance = req.params.uuid;
            }
            const sc = await Instance_role_connection.postRolesInstance(
                client,
                newRole,
                requireUser(req).uuid
            );
            if (Array.isArray(sc)) {
                // The transaction is made durable before the client is told it succeeded:
                // answering first left a window in which a caller could act on a 201
                // and not yet see what it had been promised.
                await client.query("COMMIT");
                res.status(201).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to create role instances for scene ${req.params.uuid}`
                );
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

    /**
     * @description - Create new role instances for a specific relationclass instance by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the relationclass instance.
     * @param res
     * @param next
     * @yield {status: 201, body: {RoleInstance[]}} - The role created instance(s).
     * @throws {HTTP500Error} - If the creation of the role instances fails.
     * @memberof Instance_role_controller
     * @method
     */
    post_role_instances_for_relationclass_instances: RequestHandler = async (
        req,
        res,
        next
    ) => {
        const client = await database_connection.getPool().connect();

        try {
            await begin_transaction(client);

            const newRole = plainToInstance(RoleInstance, req.body);
            for (const roleToAdd of newRole) {
                roleToAdd.uuid_has_reference_relationclass_instance = req.params.uuid;
            }
            const sc = await Instance_role_connection.postRolesInstance(
                client,
                newRole,
                requireUser(req).uuid
            );
            if (Array.isArray(sc)) {
                // The transaction is made durable before the client is told it succeeded:
                // answering first left a window in which a caller could act on a 201
                // and not yet see what it had been promised.
                await client.query("COMMIT");
                res.status(201).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to create role instances for relationclass ${req.params.uuid}`
                );
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

    /**
     * @description - Delete a specific role instance for a parent by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the parent instance.
     * @param res
     * @param next
     * @yield {status:200, body{UUID[]}} - The uuids of all deleted objects.
     * @throws {HTTP500Error} - If the deletion of the role instance fails.
     * @memberof Instance_role_controller
     * @method
     */
    delete_role_instances_for_parent: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await begin_transaction(client);
            const sc = await Instance_role_connection.deleteAllByParentUuid(
                client,
                req.params.uuid,
                requireUser(req).uuid
            );
            if (Array.isArray(sc)) {
                // The transaction is made durable before the client is told it succeeded:
                // answering first left a window in which a caller could act on a 201
                // and not yet see what it had been promised.
                await client.query("COMMIT");
                res.status(200).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to delete role instances for parent ${req.params.uuid}`
                );
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

    /**
     * @description - Delete a specific role instance by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the role instance.
     * @param res
     * @param next
     * @yield {status:200, body{UUID[]}} - The uuids of all deleted objects.
     * @throws {HTTP500Error} - If the deletion of the role instance fails.
     * @memberof Instance_role_controller
     * @method
     */
    delete_role_instances_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();
        try {
            await begin_transaction(client);
            const sc = await Instance_role_connection.deleteByUuid(
                client,
                req.params.uuid,
                requireUser(req).uuid
            );
            if (Array.isArray(sc)) {
                //The result does not contains any uuid, i.e. the metaobject is not linked to any instance
                // The transaction is made durable before the client is told it succeeded:
                // answering first left a window in which a caller could act on a 201
                // and not yet see what it had been promised.
                await client.query("COMMIT");
                res.status(200).json(sc);
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to delete role instance ${req.params.uuid}`
                );
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
}

export default new Instance_rolesController();
