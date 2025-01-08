import {RequestHandler} from "express";
import {plainToInstance} from "class-transformer";

import {
    API404Error,
    BaseError,
    HTTP500Error,
} from "../../data/services/middleware/error_handling/standard_errors.middleware";
import {AttributeInstance} from "../../../mmar-global-data-structure";
import {filter_object} from "../../data/services/middleware/object_filter";
import Instance_attribute_connection from "../../data/instance/Instance_attributes.connection";
import {database_connection} from "../../index";

/**
 * @classdesc - This class is used to handle all the requests for the attributes instance.
 * @export - The class is exported so that it can be used by other files.
 * @class - Instance_attribute_controller
 */
class Instance_attributesController {
    /**
     * @description - Get a specific attribute instance its uuid
     * @param {UUID} req.params.uuid - The uuid of the attribute instance
     * @param res
     * @param next
     * @yield {status: 200, body: {InstanceAttribute}} - The attribute instance
     * @throws {API404Error} - If the attribute instance is not found.
     * @throws {HTTP500Error} - If the acquisition of the attribute instance fails.
     * @memberof Instance_attribute_controller
     * @method
     */
    get_attribute_instance_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();
        try {
            await client.query("BEGIN");
            const sc = await Instance_attribute_connection.getByUuid(
                client,
                req.params.uuid,
                req.body.tokendata.uuid
            );
            if (sc instanceof AttributeInstance) {
                res.status(200).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to find the attribute instance ${req.params.uuid}.`
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
     * @description - Get all attribute instances of a specific class instance by its uuid
     * @param {UUID} req.params.uuid - The uuid of the instance class
     * @param res
     * @param next
     * @yield {status: 200, body: {InstanceAttribute[]}} - The attribute instances of the class instance.
     * @throws {API404Error} - If the class instance is not found.
     * @throws {HTTP500Error} - If the acquisition of the attribute instances fails.
     * @memberof Instance_attribute_controller
     * @method
     */
    get_attribute_instance_for_class: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");
            const sc = await Instance_attribute_connection.getAllByParentUuid(
                client,
                req.params.uuid,
                req.body.tokendata.uuid
            );
            if (Array.isArray(sc)) {
                res.status(200).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(`Failed to find the attribute instances for the class ${req.params.uuid}.`);
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
     * @description - Get all attribute instances of a specific scene instance by its uuid
     * @param {UUID} req.params.uuid - The uuid of the scene instance
     * @param res
     * @param next
     * @yield {status: 200, body: {InstanceAttribute[]}} - The attribute instances of the scene instance.
     * @throws {API404Error} - If the scene instance is not found
     * @throws {HTTP500Error} - If the acquisition of the attribute instances fails.
     * @memberof Instance_attribute_controller
     * @method
     */
    get_attribute_instance_for_scene: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();
        try {
            await client.query("BEGIN");
            const sc = await Instance_attribute_connection.getAllByParentUuid(
                client,
                req.params.uuid,
                req.body.tokendata.uuid
            );
            if (Array.isArray(sc)) {
                res.status(200).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(`Failed to find the attribute instances for the scene ${req.params.uuid}.`);
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
     * @description - Modify a specific attribute instance by its uuid
     * @param {UUID} req.params.uuid - The uuid of the attribute instance
     * @param res
     * @param next
     * @yield {status: 200, body: {InstanceAttribute}} - The modified attribute instance.
     * @throws {HTTP500Error} - If the modification of the attribute instance failed.
     * @memberof Instance_attribute_controller
     * @method
     */
    patch_attribute_instance_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");

            const newAttribute = AttributeInstance.fromJS(
                req.body
            ) as AttributeInstance;
            const sc = await Instance_attribute_connection.update(
                client,
                req.params.uuid,
                newAttribute,
                req.body.tokendata.uuid
            );
            if (Array.isArray(sc)) {
                res.status(200).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to update the attribute instance ${req.params.uuid}.`
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
     * @description - Create a new attribute instance for a specific class instance by its uuid
     * @param {UUID} req.params.uuid - The uuid of the class instance
     * @param {AttributeInstance} req.body - The attribute instance to create
     * @param res
     * @param next
     * @yield {status: 201, body: {InstanceAttribute[]}} - The attribute instance(s) created
     * @throws {HTTP500Error} - If the creation of the attribute instance fails.
     * @memberof Instance_attribute_controller
     * @method
     */
    post_attribute_instance_for_class: RequestHandler = async (
        req,
        res,
        next
    ) => {
        const client = await database_connection.getPool().connect();
        try {
            await client.query("BEGIN");

            const newAttribute: AttributeInstance | AttributeInstance[] = plainToInstance(AttributeInstance, req.body);
            const newAttributeArray = Array.isArray(newAttribute) ? newAttribute : [newAttribute];
            //To define the scene to be the one specified in the url
            for (const attrToAdd of newAttributeArray) {
                attrToAdd.set_assigned_uuid_class_instance(req.params.uuid);
            }
            const sc = await Instance_attribute_connection.postByParentUuid(
                client,
                req.params.uuid,
                newAttribute,
                req.body.tokendata.uuid
            );
            if (Array.isArray(sc)) {
                res.status(201).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to create the attribute instance for the class ${req.params.uuid}.`
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
     * @description - Create a new attribute instance for a specific scene instance by its uuid
     * @param {UUID} req.params.uuid - The uuid of the scene instance
     * @param {AttributeInstance} req.body - The attribute instance to create
     * @param res
     * @param next
     * @yield {status: 201, body: {InstanceAttribute[]}} - The attribute instance(s) created.
     * @throws {HTTP500Error} - If the creation of the attribute instance fails.
     * @memberof Instance_attribute_controller
     * @method
     */
    post_attribute_instance_for_scene: RequestHandler = async (
        req,
        res,
        next
    ) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");

            const newAttribute: AttributeInstance | AttributeInstance[] = plainToInstance(AttributeInstance, req.body);
            const newAttributeArray = Array.isArray(newAttribute) ? newAttribute : [newAttribute];
            //To define the scene to be the one specified in the url
            for (const attrToAdd of newAttributeArray) {
                attrToAdd.set_assigned_uuid_scene_instance(req.params.uuid);
            }
            const sc = await Instance_attribute_connection.postByParentUuid(
                client,
                req.params.uuid,
                newAttribute,
                req.body.tokendata.uuid
            );
            if (Array.isArray(sc)) {
                res.status(201).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to create the attribute instance for the scene ${req.params.uuid}.`
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
     * @description - Create a new attribute instance by its uuid
     * @param {UUID} req.params.uuid - The uuid of the attribute instance
     * @param {AttributeInstance} req.body - The attribute instance to create
     * @param res
     * @param next
     * @yield {status: 201, body: {InstanceAttribute[]}} - The attribute instance(s) created.
     * @throws {HTTP500Error} - If the creation of the attribute instance fails.
     * @memberof Instance_attribute_controller
     * @method
     */
    post_attribute_instance_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");

            const newAttribute = AttributeInstance.fromJS(
                req.body
            ) as AttributeInstance;
            newAttribute.uuid = req.params.uuid;
            const sc = await Instance_attribute_connection.postAttributesInstance(
                client,
                newAttribute,
                req.body.tokendata.uuid
            );
            if (Array.isArray(sc)) {
                res.status(201).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to create the attribute instance ${req.params.uuid}.`
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
     * @description - Delete all attribute instances for a specific class instance by its uuid
     * @param {UUID} req.params.uuid - The uuid of the class instance
     * @param res
     * @param next
     * @yield {status: 200, body: {UUID[]}} - The uuids of all the deleted objects.
     * @throws {HTTP500Error} - If the deletion of the attribute instance fails.
     * @memberof Instance_attribute_controller
     * @method
     */
    delete_attribute_instance_for_class: RequestHandler = async (
        req,
        res,
        next
    ) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");
            const sc = await Instance_attribute_connection.deleteAllByParentUuid(
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
                    `Cannot delete the attribute instance for the class ${req.params.uuid}.`
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
     * @description - Delete all attribute instances for a specific scene instance by its uuid
     * @param {UUID} req.params.uuid - The uuid of the scene instance
     * @param res
     * @param next
     * @yield {status: 200, body: {UUID[]}} - The uuids of all the deleted objects.
     * @throws {HTTP500Error} - If the deletion of the attribute instance fails.
     * @memberof Instance_attribute_controller
     * @method
     */
    delete_attribute_instance_for_scene: RequestHandler = async (
        req,
        res,
        next
    ) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");
            const sc = await Instance_attribute_connection.deleteAllByParentUuid(
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
                    `Cannot delete the attribute instance for the scene ${req.params.uuid}.`
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
     * @description - Delete an attribute instance by its uuid
     * @param {UUID} req.params.uuid - The uuid of the attribute instance
     * @param res
     * @param next
     * @yield {status: 200, body: {UUID[]}} - The uuids of all the deleted objects.
     * @throws {HTTP500Error} - If the deletion of the attribute instance fails.
     * @memberof Instance_attribute_controller
     * @method
     */
    delete_attribute_instance_by_uuid: RequestHandler = async (
        req,
        res,
        next
    ) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");
            const sc = await Instance_attribute_connection.deleteByUuid(
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
                    `Failed to delete the attribute instance ${req.params.uuid}.`
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

export default new Instance_attributesController();
