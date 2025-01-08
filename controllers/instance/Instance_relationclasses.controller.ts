import {RequestHandler} from "express";
import {database_connection} from "../../index";
import {RelationclassInstance} from "../../../mmar-global-data-structure";
import {
    API404Error,
    BaseError,
    HTTP500Error,
} from "../../data/services/middleware/error_handling/standard_errors.middleware";
import {filter_object} from "../../data/services/middleware/object_filter";
import Instance_relationclass_connection from "../../data/instance/Instance_relationclasses.connection";

/**
 * @classdesc - This class is used to handle all the requests for the relationclass instances.
 * @export - The class is exported so that it can be used by other files.
 * @class - Instance_relationclass_controller
 */
class Instance_relationclassesController {
    /**
     * @description - Get a specific relationclass instance by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the relationclass instance.
     * @param res
     * @param next
     * @yield {status: 200, body: {RelationclassInstance}} - The relationclass instance.
     * @throws {API404Error} - If the relationclass instance is not found.
     * @throws {HTTP500Error} - If the acquisition of the relationclass instance fails.
     * @memberof Instance_relationclass_controller
     * @method
     */
    get_relationclass_instances_by_uuid: RequestHandler = async (
        req,
        res,
        next
    ) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");
            const sc = await Instance_relationclass_connection.getByUuid(
                client,
                req.params.uuid,
                req.body.tokendata.uuid
            );
            if (sc instanceof RelationclassInstance) {
                res.status(200).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to retrieve relationclass instance ${req.params.uuid}`
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
     * @description - Get all the relationclass instances of a specific scene instance by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the scene instance.
     * @param res
     * @param next
     * @yield {status: 200, body: {RelationclassInstance[]}} - The relationclass instance(s) of the scene instance.
     * @throws {API404Error} - If the scene instance is not found.
     * @throws {HTTP500Error} - If the acquisition of the relationclass instances fails.
     * @memberof Instance_relationclass_controller
     * @method
     */
    get_relationclasses_instances_for_scene: RequestHandler = async (
        req,
        res,
        next
    ) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");
            const sc = await Instance_relationclass_connection.getAllByParentUuid(
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
                    `Failed to retrieve relationclass instances for scene ${req.params.uuid}`
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
     * @description - Create a new relationclass instance for a specific scene instance by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the scene instance.
     * @param {RelationclassInstance} req.body - The relationclass instance to create.
     * @param res
     * @param next
     * @yield {status: 201, body: {RelationclassInstance}} - The created relationclass instance.
     * @throws {HTTP500Error} - If the creation of the relationclass instance fails.
     * @memberof Instance_relationclass_controller
     * @method
     */
    post_relationclass_instances_for_scene: RequestHandler = async (
        req,
        res,
        next
    ) => {
        const client = await database_connection.getPool().connect();

        try {
            if (!Array.isArray(req.body)) req.body = [req.body];

            const newRelClass: RelationclassInstance[] = [];
            for (let i = 0; i < req.body.length; i++) {
                newRelClass.push(
                    RelationclassInstance.fromJS(req.body[i]) as RelationclassInstance
                );
            }
            const sc =
                await Instance_relationclass_connection.postRelationClassInstance(
                    client,
                    newRelClass,
                    req.params.uuid,
                    req.body.tokendata.uuid
                );
            if (Array.isArray(sc)) {
                res.status(201).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(`Failed to create relationclass instances for scene ${req.params.uuid}`);
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
     * @description - Create a new relationclass instance by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the relationclass instance.
     * @param {RelationclassInstance} req.body - The relationclass instance to create.
     * @param res
     * @param next
     * @yield {status: 201, body: {RelationclassInstance}} - The created relationclass instance.
     * @throws {HTTP500Error} - If the creation of the relationclass instance fails.
     * @memberof Instance_relationclass_controller
     * @method
     */
    post_relationclass_instances_by_uuid: RequestHandler = async (
        req,
        res,
        next
    ) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");

            const newRelClass = RelationclassInstance.fromJS(
                req.body
            ) as RelationclassInstance;
            newRelClass.uuid = req.params.uuid;
            const sc =
                await Instance_relationclass_connection.postRelationClassInstance(
                    client,
                    newRelClass,
                    undefined,
                    req.body.tokendata.uuid
                );
            if (Array.isArray(sc)) {
                res.status(201).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to create relationclass instance ${req.params.uuid}`
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
     * @description - Update a specific relationclass instance by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the relationclass instance.
     * @param {RelationclassInstance} req.body - The relationclass instance to update.
     * @param res
     * @param next
     * @yield {status: 200, body: {RelationclassInstance}} - The updated relationclass instance.
     * @throws {HTTP500Error} - If the update of the relationclass instance fails.
     * @memberof Instance_relationclass_controller
     * @method
     */
    patch_relationclass_instances_by_uuid: RequestHandler = async (
        req,
        res,
        next
    ) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");

            const newRelClass = RelationclassInstance.fromJS(
                req.body
            ) as RelationclassInstance;
            const sc = await Instance_relationclass_connection.update(
                client,
                req.params.uuid,
                newRelClass,
                req.body.tokendata.uuid
            );
            if (sc instanceof RelationclassInstance) {
                res.status(200).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to update relationclass instance ${req.params.uuid}`
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
     * @description - Delete a specific relationclass instance by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the relationclass instance.
     * @param res
     * @param next
     * @yield {status: 200, body: {UUID[]}} - The uuids of all objects that were deleted.
     * @throws {HTTP500Error} - If the deletion of the relationclass instance fails.
     * @memberof Instance_relationclass_controller
     * @method
     */
    delete_relationclass_instances_by_uuid: RequestHandler = async (
        req,
        res,
        next
    ) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");
            const sc = await Instance_relationclass_connection.deleteByUuid(
                client,
                req.params.uuid,
                req.body.tokendata.uuid
            );
            if (Array.isArray(sc)) {
                //The result does not contain any uuid, i.e. the metaobject is not linked to any instance
                res.status(200).json(sc);
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to delete relationclass instance ${req.params.uuid}`
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

export default new Instance_relationclassesController();
