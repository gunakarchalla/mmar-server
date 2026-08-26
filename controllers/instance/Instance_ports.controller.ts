import {RequestHandler} from "express";
import {PortInstance} from "../../../mmar-global-data-structure";
import {
    BaseError,
    HTTP500Error,
} from "../../data/services/middleware/error_handling/standard_errors.middleware";
import Instance_port_connection from "../../data/instance/Instance_ports.connection";
import { requireUser } from "../../data/services/middleware/auth.middleware";
import { withTransaction } from "../../data/services/transaction";

/**
 * @classdesc - This class is used to handle all the requests for the port instances.
 * @export - The class is exported so that it can be used by other files.
 * @class - Instance_port_controller
 */
class Instance_portsController {
    /**
     * @description - Get a specific port instance by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the port instance.
     * @param res
     * @param next
     * @yield {status: 200, body: {PortInstance}} - The port instance.
     * @throws {HTTP404Error} - If the port instance is not found.
     * @throws {HTTP500Error} - If the acquisition of the port instance fails.
     * @memberof Instance_port_controller
     * @method
     */
    get_port_instances_by_uuid: RequestHandler = withTransaction(async (client, req) => {
        const sc = await Instance_port_connection.getByUuid(
            client,
            req.params.uuid,
            requireUser(req).uuid
        );
        if (sc instanceof PortInstance) {
            return sc;
        } else if (sc instanceof BaseError) {
            throw sc;
        } else {
            throw new HTTP500Error(
                `Failed to find the port instance ${req.params.uuid}.`
            );
        }
    });

    /**
     * @description - Get all the port instances of a specific scene instance by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the scene instance.
     * @param res
     * @param next
     * @yield {status: 200, body: {PortInstance[]}} - The port instance(s) of the scene instance.
     * @throws {HTTP404Error} - If the scene instance is not found.
     * @throws {HTTP500Error} - If the acquisition of the port instances fails.
     * @memberof Instance_port_controller
     * @method
     */
    get_port_instances_for_scene: RequestHandler = withTransaction(async (client, req) => {
        const sc = await Instance_port_connection.getAllByParentUuid(
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
                `Failed to find the port instances for the scene ${req.params.uuid}.`
            );
        }
    });

    /**
     * @description - Modify a specific port instance by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the port instance.
     * @param {PortInstance} req.body - The port instance to modify.
     * @param res
     * @param next
     * @yield {status: 200, body: {PortInstance}} - The modified port instance.
     * @throws {HTTP500Error} - If the modification of the port instance fails.
     * @memberof Instance_port_controller
     * @method
     */
    patch_port_instance_by_uuid: RequestHandler = withTransaction(async (client, req) => {
        const newPort = PortInstance.fromJS(req.body) as PortInstance;
        const sc = await Instance_port_connection.update(
            client,
            req.params.uuid,
            newPort,
            requireUser(req).uuid
        );
        if (sc instanceof PortInstance) {
            return sc;
        } else if (sc instanceof BaseError) {
            throw sc;
        } else {
            throw new HTTP500Error(
                `Failed to update the port instance ${req.params.uuid}.`
            );
        }
    });

    /**
     * @description - Create a new port instance for a specific scene instance by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the scene instance.
     * @param {PortInstance} req.body - The port instance to create.
     * @param res
     * @param next
     * @yield {status: 201, body: {PortInstance}} - The created port instance.
     * @throws {HTTP500Error} - If the creation of the port instance fails.
     * @memberof Instance_port_controller
     * @method
     */
    post_port_instances: RequestHandler = withTransaction(async (client, req) => {
        const portsToAdd: PortInstance[] = [];
        for (let i = 0; i < req.body.length; i++) {
            portsToAdd.push(PortInstance.fromJS(req.body[i]) as PortInstance);
            portsToAdd[i].uuid_scene_instance = req.params.uuid;
        }
        const sc = await Instance_port_connection.postPortsInstance(
            client,
            portsToAdd,
            requireUser(req).uuid
        );
        if (Array.isArray(sc)) {
            return sc;
        } else if (sc instanceof BaseError) {
            throw sc;
        } else {
            throw new HTTP500Error(
                `Failed to create the port instance for the scene ${req.params.uuid}.`
            );
        }
    }, { status: 201 });

    /**
     * @description - Delete all the port instances of a specific scene instance by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the scene instance.
     * @param res
     * @param next
     * @yield {status: 200, body: {UUID[]}} - The uuids of all the deleted objects.
     * @throws {HTTP500Error} - If the deletion of the port instances fails.
     */
    delete_port_instances_for_scene: RequestHandler = withTransaction(async (client, req) => {
        const sc = await Instance_port_connection.deleteAllByParentUuid(
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
                `Failed to delete the port instances for the scene ${req.params.uuid}.`
            );
        }
    });

    /**
     * @description - Delete a specific port instance by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the port instance.
     * @param res
     * @param next
     * @yield {status: 200, body: {UUID[]}} - The uuid of all the deleted object.
     * @throws {HTTP500Error} - If the deletion of the port instance fails.
     * @memberof Instance_port_controller
     * @method
     */
    delete_port_instances_by_uuid: RequestHandler = withTransaction(async (client, req) => {
        const sc = await Instance_port_connection.deleteByUuid(
            client,
            req.params.uuid,
            requireUser(req).uuid
        );
        if (Array.isArray(sc)) {
            //The result does not contains any uuid, i.e. the metaobject is not linked to any instance
            return sc;
        } else if (sc instanceof BaseError) {
            throw sc;
        } else {
            throw new HTTP500Error(
                `Failed to delete the port instance ${req.params.uuid}.`
            );
        }
    });
}

export default new Instance_portsController();
