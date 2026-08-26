import {RequestHandler} from "express";
import {Role} from "../../../mmar-global-data-structure";
import {
    BaseError,
    HTTP500Error,
} from "../../data/services/middleware/error_handling/standard_errors.middleware";
import Metamodel_roles_connection from "../../data/meta/Metamodel_roles.connection";
import { requireUser } from "../../data/services/middleware/auth.middleware";
import { withTransaction } from "../../data/services/transaction";

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
     * @throws {HTTP404Error} - If the meta role is not found.
     * @throws {HTTP500Error} - If the acquisition of the meta role fails.
     * @memberof Metamodel_roles_controller
     * @method
     */
    get_roles_by_uuid: RequestHandler = withTransaction(async (client, req) => {
        const role = await Metamodel_roles_connection.getByUuid(
            client,
            req.params.uuid,
            requireUser(req).uuid
        );
        if (role instanceof Role) {
            return role;
        } else if (role instanceof BaseError) {
            throw role;
        } else {
            throw new HTTP500Error(
                `Failed to retrieve the meta role ${req.params.uuid}.`
            );
        }
    });

    /**
     * @description - Get all the meta roles.
     * @param res
     * @param next
     * @yield {status: 200, body: {Role[]}} - The meta roles.
     * @throws {HTTP500Error} - If the acquisition of the meta roles fails.
     * @memberof Metamodel_roles_controller
     * @method
     */
    get_roles: RequestHandler = withTransaction(async (client, req) => {
        const roles = await Metamodel_roles_connection.getAll(
            client,
            requireUser(req).uuid
        );
        if (Array.isArray(roles)) {
            return roles;
        } else {
            throw new HTTP500Error(`Failed to retrieve the meta roles.`);
        }
    });

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
    patch_role_by_uuid: RequestHandler = withTransaction(async (client, req) => {
        //let newRole = request_to_role(req.body);
        const newRole = Role.fromJS(req.body) as Role;
        const sc = await Metamodel_roles_connection.update(
            client,
            req.params.uuid,
            newRole,
            requireUser(req).uuid
        );
        if (sc instanceof Role) {
            return sc;
        } else if (sc instanceof BaseError) {
            throw sc;
        } else {
            throw new HTTP500Error(
                `Failed to update the meta role ${req.params.uuid}.`);
        }
    });

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
    post_role_by_uuid: RequestHandler = withTransaction(async (client, req) => {
        const newRole = Role.fromJS(req.body) as Role;
        newRole.uuid = req.params.uuid;
        const sc = await Metamodel_roles_connection.create(
            client,
            newRole,
            requireUser(req).uuid
        );
        if (sc instanceof Role) {
            return sc;
        } else if (sc instanceof BaseError) {
            throw sc;
        } else {
            throw new HTTP500Error(
                `Failed to create the meta role ${req.params.uuid}.`
            );
        }
    }, { status: 201 });

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
    post_roles_for_relationclass: RequestHandler = withTransaction(async (client, req) => {
        const newRole = Role.fromJS(req.body) as Role;
        const sc = await Metamodel_roles_connection.postRoles(
            client,
            newRole,
            requireUser(req).uuid
        );
        if (Array.isArray(sc)) {
            return sc;
        } else if (sc instanceof BaseError) {
            throw sc;
        } else {
            throw new HTTP500Error(
                `Failed to create the meta role for the relation class ${req.params.uuid}.`
            );
        }
    }, { status: 201 });

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
    post_roles: RequestHandler = withTransaction(async (client, req) => {
        //let newRole = request_to_role(req.body);
        const newRole = Role.fromJS(req.body) as Role;
        const sc = await Metamodel_roles_connection.postRoles(
            client,
            newRole,
            requireUser(req).uuid
        );
        if (Array.isArray(sc)) {
            return sc;
        } else if (sc instanceof BaseError) {
            throw sc;
        } else {
            throw new HTTP500Error(`Failed to create the meta role.`);
        }
    }, { status: 201 });

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
    delete_roles_by_uuid: RequestHandler = withTransaction(async (client, req) => {
        const sc = await Metamodel_roles_connection.deleteByUuid(
            client,
            req.params.uuid,
            requireUser(req).uuid
        );
        if (Array.isArray(sc)) {
            //The result does not contain any uuid, i.e. the metaobject is not linked to any instance
            return sc;
        } else if (sc instanceof BaseError) {
            throw sc;
        } else {
            throw new HTTP500Error(
                `Failed to delete the meta role ${req.params.uuid}.`
            );
        }
    });
}

export default new Metamodel_rolesController();
