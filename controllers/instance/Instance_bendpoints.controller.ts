import {RequestHandler} from "express";
import {ClassInstance} from "../../../mmar-global-data-structure";

import {
    BaseError,
    HTTP500Error,
} from "../../data/services/middleware/error_handling/standard_errors.middleware";
import Instance_bendpoint_connection from "../../data/instance/Instance_bendpoints.connection";
import { requireUser } from "../../data/services/middleware/auth.middleware";
import { withTransaction } from "../../data/services/transaction";

/**
 * @classdesc - This class is used to handle all the requests for the bendpoint instances.
 * @export - The class is exported so that it can be used by other files.
 * @class - Instance_bendpoint_controller
 */
class Instance_bendpointsController {
    /**
     * @description - Get all the bendpoint instances of a specific relationclass instance by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the relationclass instance.
     * @param res
     * @param next
     * @yield {status: 200, body: {ClassInstance[]}} - The bendpoint instances of the relationclass instance.
     * @throws {HTTP404Error} - If the relationclass instance is not found.
     * @throws {HTTP500Error} - If the acquisition of the bendpoint instances fails.
     * @memberof Instance_bendpoint_controller
     * @method
     */
    get_bendpoint_instances_for_relationclass: RequestHandler = withTransaction(async (client, req) => {
        const sc = await Instance_bendpoint_connection.getAllByParentUuid(
            client,
            req.params.uuid,
            requireUser(req).uuid
        );
        if (Array.isArray(sc)) {
            return sc;
        } else if (sc instanceof BaseError) {
            throw sc;
        } else {
            throw new HTTP500Error(
                `Failed to find the bendpoint instances for the relationclass ${req.params.uuid}.`
            );
        }
    });

    /**
     * @description - Get a specific bendpoint instance by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the bendpoint instance.
     * @param res
     * @param next
     * @yield {status: 200, body: {ClassInstance}} - The bendpoint instance.
     * @throws {HTTP404Error} - If the bendpoint instance is not found.
     * @throws {HTTP500Error} - If the acquisition of the bendpoint instance fails.
     * @memberof Instance_bendpoint_controller
     * @method
     */
    get_bendpoint_instance_by_uuid: RequestHandler = withTransaction(async (client, req) => {
        const sc = await Instance_bendpoint_connection.getByUuid(
            client,
            req.params.uuid,
            requireUser(req).uuid
        );
        if (sc instanceof ClassInstance) {
            return sc;
        } else if (sc instanceof BaseError) {
            throw sc;
        } else {
            throw new HTTP500Error(
                `Failed to find the bendpoint instance ${req.params.uuid}.`
            );
        }
    });

    /**
     * @description - Modify a specific bendpoint instance by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the bendpoint instance.
     * @param {ClassInstance} req.body - The bendpoint instance to modify.
     * @param res
     * @param next
     * @yield {status: 200, body: {ClassInstance}} - The bendpoint instance.
     * @throws {HTTP500Error} - If the modification of the bendpoint instance fails.
     * @memberof Instance_bendpoint_controller
     * @method
     */
    patch_bendpoint_instance_by_uuid: RequestHandler = withTransaction(async (client, req) => {
        const newBendpoint = ClassInstance.fromJS(req.body) as ClassInstance;
        const sc = await Instance_bendpoint_connection.update(
            client,
            req.params.uuid,
            newBendpoint,
            requireUser(req).uuid
        );
        if (sc instanceof ClassInstance) {
            return sc;
        } else if (sc instanceof BaseError) {
            throw sc;
        } else {
            throw new HTTP500Error(
                `Failed to update the bendpoint instance ${req.params.uuid}.`
            );
        }
    });

    /**
     * @description - Create a new bendpoint instance by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the bendpoint instance.
     * @param {ClassInstance} req.body - The bendpoint instance to create.
     * @param res
     * @param next
     * @yield {status: 201, body: {ClassInstance[]}} - The bendpoint instance(s) created.
     * @throws {HTTP500Error} - If the creation of the bendpoint instance fails.
     * @memberof Instance_bendpoint_controller
     * @method
     */
    post_bendpoint_instance_by_uuid: RequestHandler = withTransaction(async (client, req) => {
        const newClass = ClassInstance.fromJS(req.body) as ClassInstance;
        newClass.uuid = req.params.uuid;
        const sc = await Instance_bendpoint_connection.create(
            client,
            newClass,
            requireUser(req).uuid
        );
        if (Array.isArray(sc)) {
            return sc;
        } else if (sc instanceof BaseError) {
            throw sc;
        } else {
            throw new HTTP500Error(`Failed to create the bendpoint instance for the relationclass ${req.params.uuid}.`);
        }
    }, { status: 201 });

    /**
     * @description - Delete a specific bendpoint instance by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the bendpoint instance.
     * @param res
     * @param next
     * @yield {status: 200, body: {UUID[]}} - The uuids of all the deleted objects.
     * @throws {HTTP500Error} - If the deletion of the bendpoint instance fails.
     * @memberof Instance_bendpoint_controller
     * @method
     */
    delete_bendpoint_instances_by_uuid: RequestHandler = withTransaction(async (client, req) => {
        const sc = await Instance_bendpoint_connection.deleteByUuid(
            client,
            req.params.uuid
        );
        if (Array.isArray(sc)) {
            //The result does not contains any uuid, i.e. the metaobject is not linked to any instance
            return sc;
        } else if (sc instanceof BaseError) {
            throw sc;
        } else {
            throw new HTTP500Error(
                `Failed to delete the bendpoint instance ${req.params.uuid}.`
            );
        }
    });
}

export default new Instance_bendpointsController();
