import {RequestHandler} from "express";
import {database_connection} from "../../index";
import {SceneInstance} from "../../../mmar-global-data-structure";
import {
    API404Error,
    BaseError,
    HTTP500Error,
} from "../../data/services/middleware/error_handling/standard_errors.middleware";
import Instance_scene_connection from "../../data/instance/Instance_scenes.connection";
import {filter_object} from "../../data/services/middleware/object_filter";

/**
 * @classdesc - This class is used to handle all the requests for the scene instances.
 * @export - The class is exported so that it can be used by other files.
 * @class - Instance_scene_controller
 */
class Instance_scenesController {
    /**
     * @description - Get a all the scene instances of a specific scene type by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the scene type.
     * @param res
     * @param next
     * @yield {status: 200, body: {SceneInstance[]}} - The scene instance(s) of the scene type.
     * @throws {API404Error} - If the scene type is not found.
     * @throws {HTTP500Error} - If the acquisition of the scene instances fails.
     * @memberof Instance_scene_controller
     * @method
     */
    get_scene_instances: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN"); // Start a transaction
            const sc = await Instance_scene_connection.getAllByParentUuid(
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
                    `Failed to retrieve scene instances for scene type ${req.params.uuid}`
                );
            }
            await client.query("COMMIT"); // End the transaction
        } catch (err) {
            await client.query("ROLLBACK"); // Rollback the transaction
            next(err);
        } finally {
            client.release();
        }
    };

    /**
     * @description - Get a specific scene instance by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the scene instance.
     * @param res
     * @param next
     * @yield {status: 200, body: {SceneInstance}} - The scene instance.
     * @throws {API404Error} - If the scene instance is not found.
     * @throws {HTTP500Error} - If the acquisition of the scene instance fails.
     * @memberof Instance_scene_controller
     * @method
     */
    get_scene_instance_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN"); // Start a transaction
            const sc = await Instance_scene_connection.getByUuid(
                client,
                req.params.uuid,
                req.body.tokendata.uuid
            );
            if (sc instanceof SceneInstance) {
                res.status(200).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to retrieve scene instance ${req.params.uuid}`
                );
            }
            await client.query("COMMIT"); // End the transaction
        } catch (err) {
            await client.query("ROLLBACK"); // Rollback the transaction
            next(err);
        } finally {
            client.release();
        }
    };

    /**
     * @description - Modify a specific scene instance by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the scene instance.
     * @param {SceneInstance} req.body - The scene instance to modify.
     * @param res
     * @param next
     * @yield {status: 200, body: {SceneInstance}} - The scene instance.
     * @throws {HTTP500Error} - If the modification of the scene instance fails.
     * @memberof Instance_scene_controller
     * @method
     */
    patch_scene_instance_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN"); // Start a transaction
            const newSceneInstance = SceneInstance.fromJS(req.body) as SceneInstance;
            const sc = await Instance_scene_connection.update(
                client,
                req.params.uuid,
                newSceneInstance,
                req.body.tokendata.uuid
            );
            if (sc instanceof SceneInstance) {
                res.status(200).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to update scene instance ${req.params.uuid}`
                );
            }
            await client.query("COMMIT"); // End the transaction
        } catch (err) {
            await client.query("ROLLBACK"); // Rollback the transaction
            next(err);
        } finally {
            client.release();
        }
    };

    /**
     * @description - Create a new scene instance for a specific scene type by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the scene type.
     * @param {SceneInstance} req.body - The scene instance to create.
     * @param res
     * @param next
     * @yield {status: 201, body: {SceneInstance[]}} - The scene instance(s) of the scene type.
     * @throws {HTTP500Error} - If the creation of the scene instance fails.
     * @memberof Instance_scene_controller
     * @method
     */
    post_scene_instances: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN"); // Start a transaction
            const newSceneInstance = SceneInstance.fromJS(req.body) as SceneInstance;
            newSceneInstance.uuid_scene_type = req.params.uuid;
            const sc = await Instance_scene_connection.create(
                client,
                newSceneInstance,
                req.body.tokendata.uuid
            );
            if (sc instanceof SceneInstance) {
                res.status(201).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to create scene instance for scene type ${req.params.uuid}`
                );
            }
            await client.query("COMMIT"); // End the transaction
        } catch (err) {
            await client.query("ROLLBACK"); // Rollback the transaction
            next(err);
        } finally {
            client.release();
        }
    };

    test_post_scene_instances_wholeUser: RequestHandler = async (
        req,
        res,
        next
    ) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN"); // Start a transaction
            const newSceneInstance = SceneInstance.fromJS(req.body) as SceneInstance;
            newSceneInstance.uuid_scene_type = req.params.uuid;
            const sc = await Instance_scene_connection.create(
                client,
                newSceneInstance,
                req.body.tokendata.uuid
            );
            if (sc instanceof SceneInstance) {
                res.status(201).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to create scene instance for scene type ${req.params.uuid}`
                );
            }
            await client.query("COMMIT"); // End the transaction
        } catch (err) {
            await client.query("ROLLBACK"); // Rollback the transaction
            next(err);
        } finally {
            client.release();
        }
    };

    /**
     * @description - Create a new scene instance by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the scene instance.
     * @param {SceneInstance} req.body - The scene instance to create.
     * @param res
     * @param next
     * @yield {status: 201, body: {SceneInstance}} - The scene instance.
     * @throws {HTTP500Error} - If the creation of the scene instance fails.
     * @memberof Instance_scene_controller
     * @method
     */
    post_scene_instance_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN"); // Start a transaction
            const sceneInstance = SceneInstance.fromJS(req.body) as SceneInstance;
            sceneInstance.set_uuid(req.params.uuid);
            const sc = await Instance_scene_connection.create(
                client,
                sceneInstance,
                req.body.tokendata.uuid
            );
            if (sc instanceof SceneInstance) {
                res.status(201).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to create scene instance ${req.params.uuid}`
                );
            }
            await client.query("COMMIT"); // End the transaction
        } catch (err) {
            await client.query("ROLLBACK"); // Rollback the transaction
            next(err);
        } finally {
            client.release();
        }
    };

    /**
     * @description - Delete all scene instances of a specific scene type by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the scene type.
     * @param res
     * @param next
     * @yield {status:200, body{UUID[]}} - The uuids of all deleted objects.
     * @throws {HTTP500Error} - If the deletion of the scene instances fails.
     * @memberof Instance_scene_controller
     * @method
     */
    delete_scene_instances: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();
        try {
            await client.query("BEGIN"); // Start a transaction
            const sc = await Instance_scene_connection.deleteAllByParentUuid(
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
                    `Failed to delete scene instances for scene type ${req.params.uuid}`
                );
            }
            await client.query("COMMIT"); // End the transaction
        } catch (err) {
            await client.query("ROLLBACK"); // Rollback the transaction
            next(err);
        } finally {
            client.release();
        }
    };

    /**
     * @description - Delete a specific scene instance by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the scene instance.
     * @param res
     * @param next
     * @yield {status:200, body{UUID[]}} - The uuid of all deleted object.
     * @throws {HTTP500Error} - If the deletion of the scene instance fails.
     * @memberof Instance_scene_controller
     * @method
     */
    delete_scene_instance_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN"); // Start a transaction
            const sc = await Instance_scene_connection.deleteByUuid(
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
                    `Failed to delete scene instance ${req.params.uuid}`
                );
            }
            await client.query("COMMIT"); // End the transaction
        } catch (err) {
            await client.query("ROLLBACK"); // Rollback the transaction
            next(err);
        } finally {
            client.release();
        }
    };
}

export default new Instance_scenesController();
