import {RequestHandler} from "express";
import {database_connection} from "../../index";
import {PortInstance} from "../../../mmar-global-data-structure";
import {
    API404Error,
    BaseError,
    HTTP500Error,
} from "../../data/services/middleware/error_handling/standard_errors.middleware";
import {filter_object} from "../../data/services/middleware/object_filter";
import Instance_port_connection from "../../data/instance/Instance_ports.connection";

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
     * @throws {API404Error} - If the port instance is not found.
     * @throws {HTTP500Error} - If the acquisition of the port instance fails.
     * @memberof Instance_port_controller
     * @method
     */
    get_port_instances_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");
            const sc = await Instance_port_connection.getByUuid(
                client,
                req.params.uuid,
                req.body.tokendata.uuid
            );
            if (sc instanceof PortInstance) {
                res.status(200).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to find the port instance ${req.params.uuid}.`
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
     * @description - Get all the port instances of a specific scene instance by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the scene instance.
     * @param res
     * @param next
     * @yield {status: 200, body: {PortInstance[]}} - The port instance(s) of the scene instance.
     * @throws {API404Error} - If the scene instance is not found.
     * @throws {HTTP500Error} - If the acquisition of the port instances fails.
     * @memberof Instance_port_controller
     * @method
     */
    get_port_instances_for_scene: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");
            const sc = await Instance_port_connection.getAllByParentUuid(
                client,
                req.params.uuid,
                req.body.tokendata.uuid
            );
            if (Array.isArray(sc)) {
                res.status(200).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to find the port instances for the scene ${req.params.uuid}.`
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
    patch_port_instance_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");

            const newPort = PortInstance.fromJS(req.body) as PortInstance;
            const sc = await Instance_port_connection.update(
                client,
                req.params.uuid,
                newPort,
                req.body.tokendata.uuid
            );
            if (sc instanceof PortInstance) {
                res.status(200).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to update the port instance ${req.params.uuid}.`
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
    post_port_instances: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");

            const portsToAdd: PortInstance[] = [];
            for (let i = 0; i < req.body.length; i++) {
                portsToAdd.push(PortInstance.fromJS(req.body[i]) as PortInstance);
                portsToAdd[i].uuid_scene_instance = req.params.uuid;
            }
            const sc = await Instance_port_connection.postPortsInstance(
                client,
                portsToAdd,
                req.body.tokendata.uuid
            );
            if (Array.isArray(sc)) {
                res.status(201).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to create the port instance for the scene ${req.params.uuid}.`
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
     * @description - Delete all the port instances of a specific scene instance by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the scene instance.
     * @param res
     * @param next
     * @yield {status: 200, body: {UUID[]}} - The uuids of all the deleted objects.
     * @throws {HTTP500Error} - If the deletion of the port instances fails.
     */
    delete_port_instances_for_scene: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();
        try {
            await client.query("BEGIN");
            const sc = await Instance_port_connection.deleteAllByParentUuid(
                client,
                req.params.uuid,
                req.body.tokendata.uuid
            );
            if (Array.isArray(sc)) {
                res.status(200).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to delete the port instances for the scene ${req.params.uuid}.`
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
     * @description - Delete a specific port instance by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the port instance.
     * @param res
     * @param next
     * @yield {status: 200, body: {UUID[]}} - The uuid of all the deleted object.
     * @throws {HTTP500Error} - If the deletion of the port instance fails.
     * @memberof Instance_port_controller
     * @method
     */
    delete_port_instances_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");
            const sc = await Instance_port_connection.deleteByUuid(
                client,
                req.params.uuid,
                req.body.tokendata.uuid
            );
            if (Array.isArray(sc)) {
                //The result does not contains any uuid, i.e. the metaobject is not linked to any instance
                res.status(200).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to delete the port instance ${req.params.uuid}.`
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

export default new Instance_portsController();
