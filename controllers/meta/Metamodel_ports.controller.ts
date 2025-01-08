import {plainToInstance} from "class-transformer";
import {RequestHandler} from "express";
import {database_connection} from "../..";
import {Port} from "../../../mmar-global-data-structure";
import {BaseError, HTTP500Error,} from "../../data/services/middleware/error_handling/standard_errors.middleware";
import {filter_object} from "../../data/services/middleware/object_filter";
import Metamodel_ports_connection from "../../data/meta/Metamodel_ports.connection";

/**
 * @classdesc - This class is used to handle all the requests for the meta ports.
 * @export - The class is exported so that it can be used by other files.
 * @class - Metamodel_ports_controller
 */
class Metamodel_portsController {
    get_all_ports: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");
            const sc = await Metamodel_ports_connection.getAll(
                client,
                req.body.tokendata.uuid
            );
            if (Array.isArray(sc)) {
                res.status(200).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(`Failed to retrieve meta ports.`);
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
     * @description - Get a specific meta port by its UUID.
     * @param {UUID} req.params.uuid - The uuid of the meta port.
     * @param res
     * @param next
     * @yield {status: 200, body: {Port}} - The meta port.
     * @throws {API404Error} - If the meta port is not found.
     * @throws {HTTP500Error} - If the acquisition of the meta port fails.
     * @memberof Metamodel_ports_controller
     * @method
     */
    get_ports_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");
            const sc = await Metamodel_ports_connection.getByUuid(
                client,
                req.params.uuid,
                req.body.tokendata.uuid
            );
            if (sc instanceof Port) {
                res.status(200).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(`Failed to retrieve meta port ${req.params.uuid}.`);
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
     * @description - Get all the meta ports for a specific scene type.
     * @param {UUID} req.params.uuid - The uuid of the scene type.
     * @param res
     * @param next
     * @yield {status: 200, body: {Port[]}} - The meta ports.
     * @throws {HTTP500Error} - If the acquisition of the meta ports fails.
     * @throws {API404Error} - If the scene type is not found.
     * @memberof Metamodel_ports_controller
     * @method
     */
    get_ports_for_scene: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");
            const sc = await Metamodel_ports_connection.getAllByParentUuid(
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
                    `Failed to retrieve meta ports for the scene type ${req.params.uuid}.`
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
     * @description - Create a new meta port by its UUID.
     * @param {UUID} req.params.uuid - The uuid of the meta port.
     * @param {Port | Port[]} req.body - The meta port.
     * @param res
     * @param next
     * @yield {status: 201, body: {Port}} - The meta port created.
     * @throws {HTTP500Error} - If the creation of the meta port fails.
     * @memberof Metamodel_ports_controller
     * @method
     */
    post_port_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");

            const newPort = Port.fromJS(req.body) as Port;
            newPort.set_uuid(req.params.uuid);
            const sc = await Metamodel_ports_connection.create(
                client,
                newPort,
                req.body.tokendata.uuid
            );
            if (sc instanceof Port) {
                res.status(201).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(`Failed to create meta port ${req.params.uuid}.`);
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
     * @description - Create a new meta port for a specific scene type.
     * @param {UUID} req.params.uuid - The uuid of the scene type.
     * @param {Port | Port[]} req.body - The meta port.
     * @param res
     * @param next
     * @yield {status: 201, body: {Port[]}} - The meta port created.
     * @throws {HTTP500Error} - If the creation of the meta port fails.
     * @memberof Metamodel_ports_controller
     * @method
     */
    post_port: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");

            //let newPort = request_to_port(req.body);
            const newPort = plainToInstance(Port, req.body);
            const sc = await Metamodel_ports_connection.postPortsForSceneType(
                client,
                req.params.uuid,
                newPort,
                req.body.tokendata.uuid
            );
            if (Array.isArray(sc)) {
                res.status(201).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to create meta port for the scene type ${req.params.uuid}.`
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
     * @description - Modify a specific meta port by its UUID.
     * @param {UUID} req.params.uuid - The uuid of the meta port.
     * @param {Port} req.body - The meta port.
     * @param res
     * @param next
     * @yield {status: 200, body: {Port}} - The meta port modified.
     * @throws {HTTP500Error} - If the modification of the meta port fails.
     * @memberOf Metamodel_portsController
     * @method
     */
    patch_port_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");

            const newPort = Port.fromJS(req.body) as Port;
            const hardPatch = req.query.hardpatch === "true";
            let sc;

            if (hardPatch) {
                sc = await Metamodel_ports_connection.hardUpdate(
                    client,
                    req.params.uuid,
                    newPort,
                    req.body.tokendata.uuid
                );
            } else {
                sc = await Metamodel_ports_connection.update(
                    client,
                    req.params.uuid,
                    newPort,
                    req.body.tokendata.uuid
                );
            }

            if (sc instanceof Port) {
                res.status(200).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(`Failed to update meta port ${req.params.uuid}`);
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
     * @description - Delete a specific meta port by its UUID.
     * @param {UUID} req.params.uuid - The uuid of the meta port.
     * @param res
     * @param next
     * @yield {status: 200, body: {UUID[]}} -The uuids of all the objects deleted.
     * @throws {HTTP500Error} - If the deletion of the meta port fails.
     * @memberOf Metamodel_portsController
     * @method
     */
    delete_ports_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");
            const sc = await Metamodel_ports_connection.deleteByUuid(
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
                throw new HTTP500Error(`Failed to delete meta port ${req.params.uuid}`);
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
     * @description - Delete all the meta ports for a specific scene type.
     * @param {UUID} req.params.uuid - The uuid of the scene type.
     * @param res
     * @param next
     * @yield {status: 200, body: {UUID[]}} -The uuids of all the objects deleted.
     * @throws {HTTP500Error} - If the deletion of the meta port fails.
     * @memberOf Metamodel_portsController
     * @method
     */
    delete_ports_for_scene: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");
            const sc = await Metamodel_ports_connection.deletePortsForScene(
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
                    `Failed to delete meta ports for the scene type ${req.params.uuid}`
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

export default new Metamodel_portsController();
