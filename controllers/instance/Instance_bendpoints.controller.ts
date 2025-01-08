import {RequestHandler} from "express";
import {database_connection} from "../../index";
import {ClassInstance} from "../../../mmar-global-data-structure";

import {
    API404Error,
    BaseError,
    HTTP500Error,
} from "../../data/services/middleware/error_handling/standard_errors.middleware";
import {filter_object} from "../../data/services/middleware/object_filter";
import Instance_bendpoint_connection from "../../data/instance/Instance_bendpoints.connection";

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
     * @throws {API404Error} - If the relationclass instance is not found.
     * @throws {HTTP500Error} - If the acquisition of the bendpoint instances fails.
     * @memberof Instance_bendpoint_controller
     * @method
     */
    get_bendpoint_instances_for_relationclass: RequestHandler = async (
        req,
        res,
        next
    ) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");
            const sc = await Instance_bendpoint_connection.getAllByParentUuid(
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
                    `Failed to find the bendpoint instances for the relationclass ${req.params.uuid}.`
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
     * @description - Get a specific bendpoint instance by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the bendpoint instance.
     * @param res
     * @param next
     * @yield {status: 200, body: {ClassInstance}} - The bendpoint instance.
     * @throws {API404Error} - If the bendpoint instance is not found.
     * @throws {HTTP500Error} - If the acquisition of the bendpoint instance fails.
     * @memberof Instance_bendpoint_controller
     * @method
     */
    get_bendpoint_instance_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");
            const sc = await Instance_bendpoint_connection.getByUuid(
                client,
                req.params.uuid,
                req.body.tokendata.uuid
            );
            if (sc instanceof ClassInstance) {
                res.status(200).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to find the bendpoint instance ${req.params.uuid}.`
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
    patch_bendpoint_instance_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");

            const newBendpoint = ClassInstance.fromJS(req.body) as ClassInstance;
            const sc = await Instance_bendpoint_connection.update(
                client,
                req.params.uuid,
                newBendpoint,
                req.body.tokendata.uuid
            );
            if (sc instanceof ClassInstance) {
                res.status(200).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to update the bendpoint instance ${req.params.uuid}.`
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
    post_bendpoint_instance_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");

            const newClass = ClassInstance.fromJS(req.body) as ClassInstance;
            newClass.uuid = req.params.uuid;
            const sc = await Instance_bendpoint_connection.create(
                client,
                newClass,
                req.body.tokendata.uuid
            );
            if (Array.isArray(sc)) {
                res.status(200).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(`Failed to create the bendpoint instance for the relationclass ${req.params.uuid}.`);
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
     * @description - Delete a specific bendpoint instance by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the bendpoint instance.
     * @param res
     * @param next
     * @yield {status: 200, body: {UUID[]}} - The uuids of all the deleted objects.
     * @throws {HTTP500Error} - If the deletion of the bendpoint instance fails.
     * @memberof Instance_bendpoint_controller
     * @method
     */
    delete_bendpoint_instances_by_uuid: RequestHandler = async (
        req,
        res,
        next
    ) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");
            const sc = await Instance_bendpoint_connection.deleteByUuid(
                client,
                req.params.uuid
            );
            if (Array.isArray(sc)) {
                //The result does not contains any uuid, i.e. the metaobject is not linked to any instance
                res.status(200).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to delete the bendpoint instance ${req.params.uuid}.`
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

export default new Instance_bendpointsController();
