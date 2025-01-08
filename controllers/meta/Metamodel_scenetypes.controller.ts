import {RequestHandler} from "express";
import {database_connection} from "../../index";
import {Metamodel, SceneType} from "../../../mmar-global-data-structure";
import {
    API404Error,
    BaseError,
    HTTP403NORIGHT,
    HTTP409CONFLICT,
    HTTP500Error,
} from "../../data/services/middleware/error_handling/standard_errors.middleware";
import {filter_object} from "../../data/services/middleware/object_filter";
import Metamodel_scenetypes_connection from "../../data/meta/Metamodel_scenetypes.connection";
import Metamodel_classes_connection from "../../data/meta/Metamodel_classes.connection";
import Metamodel_relationclassesConnection from "../../data/meta/Metamodel_relationclasses.connection";

/**
 * @classdesc - This class is used to handle all the requests for the meta scene.
 * @export - The class is exported so that it can be used by other files.
 * @class - Metamodel_scenetypes_controller
 */
class Metamodel_scenetypesController {
    /**
     * @description - Get a specific scene type by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the scene type.
     * @param {userUuid} req.body.tokendata.uuid - The uuid of the user.
     * @param res
     * @param next
     * @yield {status: 200, body: {SceneType}} - The scene type.
     * @throws {API404Error} - If the scene type is not found.
     * @throws {HTTP403NORIGHT} - If the user has no right to access the scene type.
     * @throws {HTTP500Error} - If the acquisition of the scene type fails.
     * @memberof Metamodel_scenetypes_controller
     * @method
     */
    get_scenetypes_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();
        try {
            await client.query("BEGIN");
            const sc = await Metamodel_scenetypes_connection.getByUuid(
                client,
                req.params.uuid,
                req.body.tokendata.uuid,
            );
            if (sc instanceof SceneType) {
                res.status(200).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(`Failed to retrieve scene type ${req.params.uuid}`);
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
     * @description - Get all the scene types.
     * @param req
     * @param res
     * @param next
     * @yield {status: 200, body: {SceneType[]}} - The scene types.
     * @throws {HTTP500Error} - If the acquisition of the scene types fails.
     * @memberof Metamodel_scenetypes_controller
     * @method
     */
    get_scenetypes: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();
        try {
            await client.query("BEGIN");
            const mm = new Metamodel();
            const sceneTypes = await Metamodel_scenetypes_connection.getAll(
                client,
                req.body.tokendata.uuid,
            );
            if (Array.isArray(sceneTypes)) {
                mm.set_sceneType(sceneTypes);
            }

            const classes = await Metamodel_classes_connection.getAll(
                client,
                req.body.tokendata.uuid,
            );
            if (Array.isArray(classes)) {
                mm.set_class(classes);
            }

            const relations = await Metamodel_relationclassesConnection.getAll(
                client,
                req.body.tokendata.uuid,
            );
            if (Array.isArray(relations)) {
                mm.set_relationclass(relations);
            }

            res.status(200).json(filter_object(mm, req.query.filter));
            await client.query("COMMIT");
        } catch (err) {
            await client.query("ROLLBACK");
            next(err);
        } finally {
            (await client).release();
        }
    };

    /**
     * @description - Create a new scene type.
     * @param {SceneType} req.body - The scene type to create.
     * @param res
     * @param next
     * @yield {status: 200, body: {SceneType}} - The created scene type.
     * @throws {HTTP500Error} - If the creation of the scene type fails.
     * @memberof Metamodel_scenetypes_controller
     * @method
     */
    post_scenetype: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");
            const newSceneType = SceneType.fromJS(req.body) as SceneType;

            if (req.params.uuid) {
                newSceneType.set_uuid(req.params.uuid);
            }
            const sc = await Metamodel_scenetypes_connection.create(
                client,
                newSceneType,
                req.body.tokendata.uuid,
            );
            if (sc instanceof SceneType) {
                res.status(200).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(`Failed to create scene type.`);
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
     * @description - Modify a specific scene type by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the scene type.
     * @param {SceneType} req.body - The scene type to modify.
     * @param res
     * @param next
     * @yield {status: 200, body: {SceneType}} - The modified scene type.
     * @throws {HTTP500Error} - If the modification of the scene type fails.
     * @memberOf Metamodel_scenetypesController
     * @method
     */
    patch_scenetype: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");
            const newSceneType = SceneType.fromJS(req.body) as SceneType;

            const hardPatch = req.query.hardpatch === "true";
            let sc;

            if (hardPatch) {
                sc = await Metamodel_scenetypes_connection.hardupdate(
                    client,
                    req.params.uuid,
                    newSceneType,
                    req.body.tokendata.uuid,
                );
            } else {
                sc = await Metamodel_scenetypes_connection.update(
                    client,
                    req.params.uuid,
                    newSceneType,
                    req.body.tokendata.uuid,
                );
            }

            if (sc instanceof SceneType) {
                res.status(200).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(`Failed to update scene type ${req.params.uuid}`);
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
     * @description - Delete a specific scene type by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the scene type.
     * @param res
     * @param next
     * @yield {status: 200, body: {UUID[]}} - The uuids of all the deleted objects.
     * @throws {HTTP500Error} - If the deletion of the scene type fails.
     * @memberOf Metamodel_scenetypesController
     * @method
     */
    delete_scenetypes_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");
            const sc = await Metamodel_scenetypes_connection.deleteByUuid(
                client,
                req.params.uuid,
                req.body.tokendata.uuid,
            );
            if (Array.isArray(sc)) {
                //The result does not contains any uuid, i.e. the metaobject is not linked to any instance
                res.status(200).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(`Failed to delete scene type ${req.params.uuid}`);
            }
            await client.query("COMMIT");
        } catch (err) {
            await client.query("ROLLBACK");
            if (err instanceof HTTP403NORIGHT) res.status(403).json(err.message);
            else if (err instanceof HTTP500Error) res.status(500).json(err.message);
            else if (err instanceof HTTP409CONFLICT)
                res.status(409).json(err.message);
            else next(err);
        } finally {
            client.release();
        }
    };

    /**
     * @description - Delete all the scene types.
     * @param {UUID} req.params.uuid - The uuid of the scene type.
     * @param res
     * @param next
     * @yield {status: 200, body: {UUID[]}} - The uuids of all the deleted objects.
     * @throws {HTTP500Error} - If the deletion of the scene types fails.
     * @memberOf Metamodel_scenetypesController
     * @method
     */
    delete_scenetypes: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");
            const sc = await Metamodel_scenetypes_connection.deleteAll(client, req.body.tokendata.uuid);
            if (Array.isArray(sc)) {
                //The result does not contains any uuid, i.e. the metaobject is not linked to any instance
                res.status(200).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(`Failed to delete scene types.`);
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

export default new Metamodel_scenetypesController();
