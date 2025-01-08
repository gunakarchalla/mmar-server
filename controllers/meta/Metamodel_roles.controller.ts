import {RequestHandler} from "express";
import {database_connection} from "../..";
import {Role} from "../../../mmar-global-data-structure";
import {
    API404Error,
    BaseError,
    HTTP500Error,
} from "../../data/services/middleware/error_handling/standard_errors.middleware";
import {filter_object} from "../../data/services/middleware/object_filter";
import Metamodel_roles_connection from "../../data/meta/Metamodel_roles.connection";

/**
 * @classdesc - This class is used to handle all the requests for the meta roles.
 * @export - The class is exported so that it can be used by other files.
 * @class - Metamodel_roles_controller
 */
class Metamodel_rolesController {
    /**
     * @description - Get a specific role by its UUID.
     * @param {UUID} req.params.uuid - The uuid of the meta role.
     * @param res
     * @param next
     * @yield {status: 200, body: {Role}} - The meta role.
     * @throws {API404Error} - If the meta role is not found.
     * @throws {HTTP500Error} - If the acquisition of the meta role fails.
     * @memberof Metamodel_roles_controller
     * @method
     */
    get_roles_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");

            const role = await Metamodel_roles_connection.getByUuid(
                client,
                req.params.uuid,
                req.body.tokendata.uuid
            );
            if (role instanceof Role) {
                res.status(200).json(filter_object(role, req.query.filter));
            } else if (role instanceof BaseError) {
                throw role;
            } else {
                throw new HTTP500Error(
                    `Failed to retrieve the meta role ${req.params.uuid}.`
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

    /**
     * @description - Get all the meta roles.
     * @param res
     * @param next
     * @yield {status: 200, body: {Role[]}} - The meta roles.
     * @throws {HTTP500Error} - If the acquisition of the meta roles fails.
     * @memberof Metamodel_roles_controller
     * @method
     */
    get_roles: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");

            const roles = await Metamodel_roles_connection.getAll(
                client,
                req.body.tokendata.uuid
            );
            if (Array.isArray(roles)) {
                res.status(200).json(filter_object(roles, req.query.filter));
            } else {
                throw new HTTP500Error(`Failed to retrieve the meta roles.`);
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
     * @description - Modify a specific meta role by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the meta role.
     * @param {Role} req.body - The new meta role.
     * @param res
     * @param next
     * @yield {status: 200, body: {Role}} - The meta role modified.
     * @throws {HTTP500Error} - If the modification of the meta role fails.
     * @memberof Metamodel_roles_controller
     * @method
     */
    patch_role_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");

            //let newRole = request_to_role(req.body);
            const newRole = Role.fromJS(req.body) as Role;
            const sc = await Metamodel_roles_connection.update(
                client,
                req.params.uuid,
                newRole,
                req.body.tokendata.uuid
            );
            if (sc instanceof Role) {
                res.status(200).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to update the meta role ${req.params.uuid}.`);
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
     * @description - Create a new meta role by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the meta role.
     * @param {Role} req.body - The new meta role.
     * @param res
     * @param next
     * @yield {status: 201, body: {Role[]}} - The meta role(s) created.
     * @throws {HTTP500Error} - If the creation of the meta role fails.
     * @memberof Metamodel_roles_controller
     * @method
     */
    post_role_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");

            const newRole = Role.fromJS(req.body) as Role;
            newRole.uuid = req.params.uuid;
            const sc = await Metamodel_roles_connection.create(
                client,
                newRole,
                req.body.tokendata.uuid
            );
            if (sc instanceof Role) {
                res.status(201).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to create the meta role ${req.params.uuid}.`
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

    /**
     * @description - Create a new meta role for a specific relationclass by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the relation class.
     * @param {Role | Role[]} req.body - The new meta role.
     * @param res
     * @param next
     * @yield {status: 201, body: {Role[]}} - The meta role(s) created.
     * @throws {HTTP500Error} - If the creation of the meta role fails.
     * @memberof Metamodel_roles_controller
     * @method
     */
    post_roles_for_relationclass: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");

            const newRole = Role.fromJS(req.body) as Role;
            const sc = await Metamodel_roles_connection.postRoles(
                client,
                newRole,
                req.body.tokendata.uuid
            );
            if (Array.isArray(sc)) {
                res.status(201).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to create the meta role for the relation class ${req.params.uuid}.`
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

    /**
     * @description - Create a new meta role.
     * @param {Role | Role[]} req.body - The new meta role(s).
     * @param res
     * @param next
     * @yield {status: 201, body: {Role[]}} - The meta role(s) created.
     * @throws {HTTP500Error} - If the creation of the meta role fails.
     * @memberof Metamodel_roles_controller
     * @method
     */
    post_roles: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");

            //let newRole = request_to_role(req.body);
            const newRole = Role.fromJS(req.body) as Role;
            const sc = await Metamodel_roles_connection.postRoles(
                client,
                newRole,
                req.body.tokendata.uuid
            );
            if (Array.isArray(sc)) {
                res.status(201).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(`Failed to create the meta role.`);
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
     * @description - Delete a specific meta role by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the meta role.
     * @param res
     * @param next
     * @yield {status: 200, body: {UUID}} - The uuids of all the deleted objects.
     * @throws {HTTP500Error} - If the deletion of the meta role fails.
     * @memberof Metamodel_roles_controller
     * @method
     */
    delete_roles_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");
            const sc = await Metamodel_roles_connection.deleteByUuid(
                client,
                req.params.uuid,
                req.body.tokendata.uuid
            );
            if (Array.isArray(sc)) {
                //The result does not contain any uuid, i.e. the metaobject is not linked to any instance
                res.status(200).json(sc);
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to delete the meta role ${req.params.uuid}.`
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
}

export default new Metamodel_rolesController();
