import {RequestHandler} from "express";
import {database_connection} from "../../index";
import {ClassInstance} from "../../../mmar-global-data-structure";

import {
    API404Error,
    BaseError,
    HTTP500Error,
} from "../../data/services/middleware/error_handling/standard_errors.middleware";
import {filter_object} from "../../data/services/middleware/object_filter";
import Instance_class_connection from "../../data/instance/Instance_classes.connection";

/**
 * @classdesc - This class is used to handle all the requests for the class instances.
 * @export - The class is exported so that it can be used by other files.
 * @class - Instance_classes_controller
 */
class Instance_classesController {
    /**
     * @description - Get a specific class instance by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the class instance.
     * @param res
     * @param next
     * @yield {status: 200, body: {ClassInstance}} - The class instance.
     * @throws {API404Error} - If the class instance is not found.
     * @throws {HTTP500Error} - If the acquisition of the class instance fails.
     * @memberof Instance_classes_controller
     * @method
     */
    get_class_instance_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN"); // start transaction
            const sc = await Instance_class_connection.getByUuid(
                client,
                req.params.uuid,
                req.body.tokendata.uuid
            );
            if (sc instanceof ClassInstance) {
                //res.status(200).json(filter_object(sc, req.query.filter));
                res.status(200).send(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to find the class instance ${req.params.uuid}.`
                );
            }
            await client.query("COMMIT"); // end transaction
        } catch (err) {
            await client.query("ROLLBACK"); // end transaction
            next(err);
        } finally {
            client.release();
        }
    };

    /**
     * @description - Get all class instances of a specific relationclass instance by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the relationclass instance.
     * @param res
     * @param next
     * @yield {status: 200, body: {ClassInstance[]}} - The class instance(s) of the relationclass instance.
     * @throws {API404Error} - If the relationclass instance is not found.
     * @throws {HTTP500Error} - If the acquisition of the class instances fails.
     * @memberof Instance_classes_controller
     * @method
     */
    get_classes_instances_for_scene: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN"); // start transaction
            const sc = await Instance_class_connection.getAllByParentUuid(
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
                    `Failed to retrieve the class instances for the scene ${req.params.uuid}.`
                );
            }
            await client.query("COMMIT"); // end transaction
        } catch (err) {
            await client.query("ROLLBACK"); // end transaction
            next(err);
        } finally {
            client.release();
        }
    };

    /**
     * @description - Modify a specific class instance by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the class instance.
     * @param {ClassInstance} req.body - The class instance to modify.
     * @param res
     * @param next
     * @yield {status: 200, body: {ClassInstance}} - The modified class instance.
     * @throw {HTTP500Error} - If the modification of the class instance fails.
     * @memberof Instance_classes_controller
     * @method
     */
    patch_class_instance_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN"); // start transaction
            const newClass = ClassInstance.fromJS(req.body) as ClassInstance;
            const sc = await Instance_class_connection.update(
                client,
                req.params.uuid,
                newClass,
                req.body.tokendata.uuid
            );
            if (sc instanceof ClassInstance) {
                res.status(200).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to update the class instance ${req.params.uuid}.`
                );
            }
            await client.query("COMMIT"); // end transaction
        } catch (err) {
            await client.query("ROLLBACK"); // end transaction
            next(err);
        } finally {
            client.release();
        }
    };

    /**
     * @description - Create a new class instance for a specific scene instance by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the scene instance.
     * @param {ClassInstance} req.body - The class instance to create.
     * @param res
     * @param next
     * @yield {status: 201, body: {ClassInstance[]}} - The class instance(s) created.
     * @throw {HTTP500Error} - If the creation of the class instance fails.
     * @memberof Instance_classes_controller
     * @method
     */
    post_class_instance_for_scene: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN"); // start transaction
            const newClass = ClassInstance.fromJS(req.body) as ClassInstance;
            const sc = await Instance_class_connection.postClassInstances(
                client,
                newClass,
                req.params.uuid,
                req.body.tokendata.uuid
            );
            if (Array.isArray(sc)) {
                res.status(201).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to create the class instance for the scene ${req.params.uuid}.`
                );
            }
            await client.query("COMMIT"); // end transaction
        } catch (err) {
            await client.query("ROLLBACK"); // end transaction
            next(err);
        } finally {
            client.release();
        }
    };

    /**
     * @description - Create a new class instance by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the class instance.
     * @param {ClassInstance} req.body - The class instance to create.
     * @param res
     * @param next
     * @yield {status: 201, body: {ClassInstance}} - The class instance created.
     * @throw {HTTP500Error} - If the creation of the class instance fails.
     * @memberof Instance_classes_controller
     * @method
     */
    post_class_instance_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN"); // start transaction
            const newClass = ClassInstance.fromJS(req.body) as ClassInstance;
            newClass.uuid = req.params.uuid;
            const sc = await Instance_class_connection.create(
                client,
                newClass,
                req.body.tokendata.uuid
            );
            if (sc instanceof ClassInstance) {
                res.status(201).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to create the class instance ${req.params.uuid}.`
                );
            }
            await client.query("COMMIT"); // end transaction
        } catch (err) {
            await client.query("ROLLBACK"); // end transaction
            next(err);
        } finally {
            client.release();
        }
    };

    /**
     * @description - Delete all class instances of a specific scene instance by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the scene instance.
     * @param res
     * @param next
     * @yield {status: 200, body: {UUID[]}} - The uuids of all the deleted objects.
     * @throw {HTTP500Error} - If the deletion of the class instances fails.
     * @memberof Instance_classes_controller
     * @method
     */
    delete_class_instance_for_scene: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN"); // start transaction
            const sc = await Instance_class_connection.deleteAllByParentUuid(
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
                    `Failed to delete the class instance for the scene ${req.params.uuid}.`
                );
            }
            await client.query("COMMIT"); // end transaction
        } catch (err) {
            await client.query("ROLLBACK"); // end transaction
            next(err);
        } finally {
            client.release();
        }
    };

    /**
     * @description - Delete a specific class instance by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the class instance.
     * @param res
     * @param next
     * @yield {status: 200, body: {UUID[]}} - The uuid of all the deleted objects.
     * @throw {HTTP500Error} - If the deletion of the class instance fails.
     * @memberof Instance_classes_controller
     * @method
     */
    delete_class_instance_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN"); // start transaction
            const sc = await Instance_class_connection.deleteByUuid(
                client,
                req.params.uuid,
                req.body.tokendata.uuid
            );
            if (Array.isArray(sc)) {
                //The result does not contains any uuid, i.e. the metaobject is not linked to any instance
                res.status(200).json(sc);
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to delete the class instance ${req.params.uuid}.`
                );
            }
            await client.query("COMMIT"); // end transaction
        } catch (err) {
            await client.query("ROLLBACK"); // end transaction
            next(err);
        } finally {
            client.release();
        }
    };
}

export default new Instance_classesController();
