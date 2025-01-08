import {plainToInstance} from "class-transformer";
import {RequestHandler} from "express";
import {database_connection} from "../..";
import {Class} from "../../../mmar-global-data-structure";
import {
    API404Error,
    BaseError,
    HTTP403NORIGHT,
    HTTP409CONFLICT,
    HTTP500Error,
} from "../../data/services/middleware/error_handling/standard_errors.middleware";
import {filter_object} from "../../data/services/middleware/object_filter";
import Metamodel_classes_connection from "../../data/meta/Metamodel_classes.connection";

/**
 * @classdesc - This class is used to handle all the requests for the meta classes.
 * @export - The class is exported so that it can be used by other files.
 * @class - Metamodel_classes_controller
 */
class Metamodel_classesController {
    /**
     * @description - Get all meta classes.
     * @param req
     * @param res
     * @param next
     * @yield {status: 200, body: {Class[]}} - The list of all meta classes.
     * @throws {HTTP500Error} - If the acquisition of the meta classes fails.
     * @memberof Metamodel_classes_controller
     * @method
     */
    get_all_classes: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");
            const classes = await Metamodel_classes_connection.getAll(
                client,
                req.body.tokendata.uuid
            );
            if (Array.isArray(classes)) {
                res
                    .status(200)
                    .json(filter_object(classes, req.query.filter));
            } else if (classes instanceof BaseError) {
                throw classes;
            } else {
                throw new HTTP500Error("Failed to retrieve meta classes.");
            }
            await client.query("COMMIT");
        } catch (err) {
            await client.query("ROLLBACK");
            next(err);
        } finally {
            client.release();
        }
    };

    /**
     * @description - Get a specific meta class by its UUID.
     * @param {UUID} req.params.uuid - The uuid of the meta class.
     * @param res
     * @param next
     * @yield {status: 200, body: {Class}} - The meta class.
     * @throws {API404Error} - If the meta class is not found.
     * @throws {HTTP500Error} - If the acquisition of the meta class fails.
     * @memberof Metamodel_classes_controller
     * @method
     */
    get_class_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");
            const sc = await Metamodel_classes_connection.getByUuid(
                client,
                req.params.uuid,
                req.body.tokendata.uuid
            );
            if (sc instanceof Class) {
                res.status(200).json(filter_object(sc, req.query.filter));
                await client.query("COMMIT");
            } else if (sc instanceof BaseError) {
                throw sc
            } else {
                throw new HTTP500Error(
                    `Failed to retrieve the meta class ${req.params.uuid}.`
                );
            }
        } catch (err) {
            await client.query("ROLLBACK");
            next(err);
        } finally {
            (await client).release();
        }
    };

    /**
     * @description - Get all the meta classes for a specific scene type.
     * @param {UUID} req.params.uuid - The uuid of the scene type.
     * @param res
     * @param next
     * @yield {status: 200, body: {Class[]}} - The meta classes.
     * @throws {HTTP500Error} - If the acquisition of the meta classes fails.
     * @throws {API404Error} - If the scene type is not found.
     * @memberof Metamodel_classes_controller
     * @method
     */
    get_classes_for_scene: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");
            const sc = await Metamodel_classes_connection.getAllByParentUuid(
                client,
                req.params.uuid,
                req.body.tokendata.uuid
            );
            if (Array.isArray(sc)) {
                res.status(200).json(sc);
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to retrieve the meta classes for the scene ${req.params.uuid}.`
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
     * @description - Create a new meta class by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the meta class.
     * @param {Class} req.body - The meta class to create.
     * @param res
     * @param next
     * @yield {status: 201, body: {Class}} - The meta class created.
     * @throws {HTTP500Error} - If the creation of the meta class fails.
     * @memberOf Metamodel_classesController
     * @method
     */
    post_class_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            const newClass = Class.fromJS(req.body) as Class;
            newClass.uuid = req.params.uuid;
            const sc = await Metamodel_classes_connection.create(
                client,
                newClass,
                req.body.tokendata.uuid
            );
            if (sc instanceof Class) {
                res.status(201).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Cannot post the meta class ${req.params.uuid}.`
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
     * @description - Create a new class for a specific scene type by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the scene type.
     * @param {Class | class[]} req.body - The meta class(es) to create.
     * @param res
     * @param next
     * @yield {status: 201, body: {Class[]}} - The meta class(es) created.
     * @throws {HTTP500Error} - If the creation of the meta class(es) fails.
     * @memberOf Metamodel_classesController
     * @method
     */
    post_class_for_scenetype: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            const newClass = plainToInstance(Class, req.body);
            const sc = await Metamodel_classes_connection.postClassesForSceneType(
                client,
                req.params.uuid,
                newClass,
                req.body.tokendata.uuid
            );
            if (Array.isArray(sc)) {
                res.status(201).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Cannot post the meta class for the scene type ${req.params.uuid}.`
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
     * @description - Modify a specific meta class by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the meta class.
     * @param {Class} req.body - The meta class to modify.
     * @param res
     * @param next
     * @yield {status: 200, body: {Class}} - The meta class modified.
     * @throws {HTTP500Error} - If the modification of the meta class fails.
     * @memberOf Metamodel_classesController
     * @method
     */
    patch_class_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");
            const newClass = Class.fromJS(req.body) as Class;

            const hardPatch = req.query.hardpatch === "true";
            let sc;

            if (hardPatch) {
                sc = await Metamodel_classes_connection.hardUpdate(
                    client,
                    req.params.uuid,
                    newClass,
                    req.body.tokendata.uuid
                );
            } else {
                sc = await Metamodel_classes_connection.update(
                    client,
                    req.params.uuid,
                    newClass,
                    req.body.tokendata.uuid
                );
            }
            if (sc instanceof Class) {
                res.status(200).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Cannot patch the meta class ${req.params.uuid}.`
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
     * @description - Delete a specific class for a specific class by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the meta class to delete.
     * @param res
     * @param next
     * @yield {status: 200, body: {UUID[]}} - The uuids of all the objects deleted.
     * @throws {HTTP500Error} - If the deletion of the meta class fails.
     * @memberOf Metamodel_classesController
     * @method
     */
    delete_classes_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();
        try {
            await client.query("BEGIN");
            const sc = await Metamodel_classes_connection.deleteByUuid(
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
                    `Cannot delete the meta class ${req.params.uuid}.`
                );
            }
            await client.query("COMMIT");
        } catch (err) {
            await client.query("ROLLBACK");
            if (err instanceof HTTP403NORIGHT) res.status(403).json(err.message);
            if (err instanceof HTTP500Error) res.status(500).json(err.message);
            if (err instanceof HTTP409CONFLICT) res.status(409).json(err.message);
            next(err);
        } finally {
            (await client).release();
        }
    };

    /**
     * @description - Delete all the classes for a specific scene type by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the scene type.
     * @param res
     * @param next
     * @yield {status: 200, body: {UUID[]}} - The uuids of all the objects deleted.
     * @throws {HTTP500Error} - If the deletion of the meta class fails.
     * @memberOf Metamodel_classesController
     * @method
     */
    delete_classes_for_scene: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            const sc =
                await Metamodel_classes_connection.deleteAllByParentUuid(
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
                    `Cannot delete the meta class for the scene type ${req.params.uuid}.`
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

export default new Metamodel_classesController();
