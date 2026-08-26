import {plainToInstance} from "class-transformer";
import {RequestHandler} from "express";
import {Class} from "../../../mmar-global-data-structure";
import {
    BaseError,
    HTTP500Error,
} from "../../data/services/middleware/error_handling/standard_errors.middleware";
import Metamodel_classes_connection from "../../data/meta/Metamodel_classes.connection";
import { requireUser } from "../../data/services/middleware/auth.middleware";
import { withTransaction } from "../../data/services/transaction";

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
    get_all_classes: RequestHandler = withTransaction(async (client, req) => {
        const classes = await Metamodel_classes_connection.getAll(
            client,
            requireUser(req).uuid
        );
        if (Array.isArray(classes)) {
            return classes;
        } else if (classes instanceof BaseError) {
            throw classes;
        } else {
            throw new HTTP500Error("Failed to retrieve meta classes.");
        }
    });

    /**
     * @description - Get a specific meta class by its UUID.
     * @param {UUID} req.params.uuid - The uuid of the meta class.
     * @param res
     * @param next
     * @yield {status: 200, body: {Class}} - The meta class.
     * @throws {HTTP404Error} - If the meta class is not found.
     * @throws {HTTP500Error} - If the acquisition of the meta class fails.
     * @memberof Metamodel_classes_controller
     * @method
     */
    get_class_by_uuid: RequestHandler = withTransaction(async (client, req) => {
        const sc = await Metamodel_classes_connection.getByUuid(
            client,
            req.params.uuid,
            requireUser(req).uuid
        );
        if (sc instanceof Class) {
            return sc;
        } else if (sc instanceof BaseError) {
            throw sc
        } else {
            throw new HTTP500Error(
                `Failed to retrieve the meta class ${req.params.uuid}.`
            );
        }
    });

    /**
     * @description - Get all the meta classes for a specific scene type.
     * @param {UUID} req.params.uuid - The uuid of the scene type.
     * @param res
     * @param next
     * @yield {status: 200, body: {Class[]}} - The meta classes.
     * @throws {HTTP500Error} - If the acquisition of the meta classes fails.
     * @throws {HTTP404Error} - If the scene type is not found.
     * @memberof Metamodel_classes_controller
     * @method
     */
    get_classes_for_scene: RequestHandler = withTransaction(async (client, req) => {
        const sc = await Metamodel_classes_connection.getAllByParentUuid(
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
                `Failed to retrieve the meta classes for the scene ${req.params.uuid}.`
            );
        }
    });

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
    post_class_by_uuid: RequestHandler = withTransaction(async (client, req) => {
        const newClass = Class.fromJS(req.body) as Class;
        newClass.uuid = req.params.uuid;
        const sc = await Metamodel_classes_connection.create(
            client,
            newClass,
            requireUser(req).uuid
        );
        if (sc instanceof Class) {
            return sc;
        } else if (sc instanceof BaseError) {
            throw sc;
        } else {
            throw new HTTP500Error(
                `Cannot post the meta class ${req.params.uuid}.`
            );
        }
    }, { status: 201 });

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
    post_class_for_scenetype: RequestHandler = withTransaction(async (client, req) => {
        const newClass = plainToInstance(Class, req.body);
        const sc = await Metamodel_classes_connection.postClassesForSceneType(
            client,
            req.params.uuid,
            newClass,
            requireUser(req).uuid
        );
        if (Array.isArray(sc)) {
            return sc;
        } else if (sc instanceof BaseError) {
            throw sc;
        } else {
            throw new HTTP500Error(
                `Cannot post the meta class for the scene type ${req.params.uuid}.`
            );
        }
    }, { status: 201 });

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
    patch_class_by_uuid: RequestHandler = withTransaction(async (client, req) => {
        const newClass = Class.fromJS(req.body) as Class;

        const hardPatch = req.query.hardpatch === "true";
        let sc;

        if (hardPatch) {
            sc = await Metamodel_classes_connection.hardUpdate(
                client,
                req.params.uuid,
                newClass,
                requireUser(req).uuid
            );
        } else {
            sc = await Metamodel_classes_connection.update(
                client,
                req.params.uuid,
                newClass,
                requireUser(req).uuid
            );
        }
        if (sc instanceof Class) {
            return sc;
        } else if (sc instanceof BaseError) {
            throw sc;
        } else {
            throw new HTTP500Error(
                `Cannot patch the meta class ${req.params.uuid}.`
            );
        }
    });

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
    delete_classes_by_uuid: RequestHandler = withTransaction(async (client, req) => {
        const sc = await Metamodel_classes_connection.deleteByUuid(
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
                `Cannot delete the meta class ${req.params.uuid}.`
            );
        }
    });

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
    delete_classes_for_scene: RequestHandler = withTransaction(async (client, req) => {
        const sc =
            await Metamodel_classes_connection.deleteAllByParentUuid(
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
                `Cannot delete the meta class for the scene type ${req.params.uuid}.`
            );
        }
    });
}

export default new Metamodel_classesController();
