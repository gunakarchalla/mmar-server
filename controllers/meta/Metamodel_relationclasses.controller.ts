import {plainToInstance} from "class-transformer";
import {RequestHandler} from "express";
import {Relationclass} from "../../../mmar-global-data-structure";
import {
    BaseError,
    HTTP500Error,
} from "../../data/services/middleware/error_handling/standard_errors.middleware";
import {filter_object} from "../../data/services/middleware/object_filter";
import Metamodel_relationclasses_connection from "../../data/meta/Metamodel_relationclasses.connection";
import { requireUser } from "../../data/services/middleware/auth.middleware";
import { withTransaction } from "../../data/services/transaction";

/**
 * @classdesc - This class is used to handle all the requests for the relationclasses.
 * @export - The class is exported so that it can be used by other files.
 * @class - Metamodel_relationclasses_controller
 */
class Metamodel_relationclassesController {
    /**
     * @description - Get all meta relationclasses.
     * @param req
     * @param res
     * @param next
     * @yield {status: 200, body: {Relationclass[]}} - The list of all meta relationclasses.
     * @throws {HTTP500Error} - If the acquisition of the meta relationclasses fails.
     * @memberof Metamodel_relationclasses_controller
     * @method
     */
    get_all_relationclasses: RequestHandler = withTransaction(async (client, req) => {
        const relationClasses = await Metamodel_relationclasses_connection.getAll(
            client,
            requireUser(req).uuid
        );
        if (Array.isArray(relationClasses)) {
            return relationClasses.map((cls) => filter_object(cls, req.query.filter));
        } else if (relationClasses instanceof BaseError) {
            throw relationClasses;
        } else {
            throw new HTTP500Error(`Failed to retrieve relationclasses`);
        }
    });

    /**
     * @description - Get a specific relationclass by its UUID.
     * @param {UUID} req.params.uuid - The uuid of the relationclass.
     * @param res
     * @param next
     * @yield {status: 200, body: {Relationclass}} - The relationclass.
     * @throws {HTTP404Error} - If the relationclass is not found.
     * @throws {HTTP500Error} - If the acquisition of the relationclass fails.
     * @memberof Metamodel_relationclasses_controller
     * @method
     */
    get_relationclass_by_uuid: RequestHandler = withTransaction(async (client, req) => {
        const sc = await Metamodel_relationclasses_connection.getByUuid(
            client,
            req.params.uuid,
            requireUser(req).uuid
        );
        if (sc instanceof Relationclass) {
            return sc;
        } else if (sc instanceof BaseError) {
            throw sc;
        } else {
            throw new HTTP500Error(`Failed to retrieve the relationclass ${req.params.uuid}.`);
        }
    });

    /**
     * @description - Get all the meta relationclasses for a specific scene type by its UUID.
     * @param {UUID} req.params.uuid - The uuid of the scene type.
     * @param res
     * @param next
     * @yield {status: 200, body: {Relationclass[]}} - The meta relationclasses.
     * @throws {HTTP404Error} - If the scene type is not found.
     * @throws {HTTP500Error} - If the acquisition of the meta relationclasses fails.
     * @memberof Metamodel_relationclasses_controller
     * @method
     */
    get_relationclasses_for_scene: RequestHandler = withTransaction(async (client, req) => {
        const sc = await Metamodel_relationclasses_connection.getAllByParentUuid(
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
                `Failed to retrieve the relationclasses for the scene type ${req.params.uuid}.`
            );
        }
    });

    /**
     * @description - Get the meta role from for a specific meta relationclass by its UUID.
     * @param {UUID} req.params.uuid - The uuid of the meta relationclass.
     * @param res
     * @param next
     * @yield {status: 200, body: {UUID}} - The uuid of the meta role from.
     * @throws {HTTP404Error} - If the meta relationclass is not found.
     * @throws {HTTP500Error} - If the acquisition of the meta role from fails.
     * @memberof Metamodel_relationclasses_controller
     * @method
     */
    get_rolefrom_for_relationclass: RequestHandler = withTransaction(async (client, req) => {
        const sc = await Metamodel_relationclasses_connection.getByUuid(
            client,
            req.params.uuid,
            requireUser(req).uuid
        );
        if (sc instanceof Relationclass) {
            return sc.get_role_from();
        } else if (sc instanceof BaseError) {
            throw sc;
        } else {
            throw new HTTP500Error(
                `Failed to retrieve the role from for the relationclass ${req.params.uuid}.`
            );
        }
    });

    /**
     * @description - Get the meta role to for a specific meta relationclass by its UUID.
     * @param {UUID} req.params.uuid - The uuid of the meta relationclass.
     * @param res
     * @param next
     * @yield {status: 200, body: {UUID}} - The uuid of the meta role to.
     * @throws {HTTP404Error} - If the meta relationclass is not found.
     * @throws {HTTP500Error} - If the acquisition of the meta role to fails.
     * @memberof Metamodel_relationclasses_controller
     * @method
     */
    get_roleto_for_relationclass: RequestHandler = withTransaction(async (client, req) => {
        const sc = await Metamodel_relationclasses_connection.getByUuid(
            client,
            req.params.uuid,
            requireUser(req).uuid
        );
        if (sc instanceof Relationclass) {
            return sc.get_role_to();
        } else if (sc instanceof BaseError) {
            throw sc;
        } else {
            throw new HTTP500Error(
                `Failed to retrieve the role to for the relationclass ${req.params.uuid}.`
            );
        }
    });

    /**
     * @description - Get all the meta roles for a specific meta relationclass by its UUID.
     * @param {UUID} req.params.uuid - The uuid of the meta relationclass.
     * @param res
     * @param next
     * @yield {status: 200, body: {Role[]}} - The meta roles.
     * @throws {HTTP404Error} - If the meta relationclass is not found.
     * @throws {HTTP500Error} - If the acquisition of the meta roles fails.
     * @memberof Metamodel_relationclasses_controller
     * @method
     */
    get_roles_for_relationclass: RequestHandler = withTransaction(async (client, req) => {
        const sc = await Metamodel_relationclasses_connection.getByUuid(
            client,
            req.params.uuid,
            requireUser(req).uuid
        );
        if (sc instanceof Relationclass) {
            const roles = [];
            roles.push(sc.get_role_from());
            roles.push(sc.get_role_to());
            return roles;
        } else if (sc instanceof BaseError) {
            throw sc;
        } else {
            throw new HTTP500Error(
                `Failed to retrieve the roles for the relationclass ${req.params.uuid}.`
            );
        }
    });

    /**
     * @description - Create a new meta relationclass by its UUID.
     * @param {UUID} req.params.uuid - The uuid of the meta relationclass.
     * @param res
     * @param next
     * @yield {status: 201, body: {Relationclass}} - The meta relationclass created.
     * @throws {HTTP500Error} - If the creation of the meta relationclass fails.
     * @memberof Metamodel_relationclasses_controller
     * @method
     */
    post_relationclass_by_uuid: RequestHandler = withTransaction(async (client, req) => {
        //let newRelClass = request_to_RelationClass(req.body);
        const newRelClass = Relationclass.fromJS(req.body) as Relationclass;
        newRelClass.set_uuid(req.params.uuid);
        const sc = await Metamodel_relationclasses_connection.create(
            client,
            newRelClass,
            requireUser(req).uuid
        );
        if (sc instanceof Relationclass) {
            return sc;
        } else if (sc instanceof BaseError) {
            throw sc;
        } else {
            throw new HTTP500Error(
                `Cannot post the meta relationclass for the scene type ${req.params.uuid}.`
            );
        }
    }, { status: 201 });

    /**
     * @description - Create a new meta relationclass for a specific scene type by its UUID.
     * @param {UUID} req.params.uuid - The uuid of the scene type.
     * @param {Relationclass | Relationclass[]} req.body - The meta relationclass to create.
     * @param res
     * @param next
     * @yield {status: 201, body: {Relationclass[]}} - The meta relationclass(es) created.
     * @throws {HTTP500Error} - If the creation of the meta relationclass fails.
     * @memberof Metamodel_relationclasses_controller
     * @method
     */
    post_relationclasses_for_scene: RequestHandler = withTransaction(async (client, req) => {
        const newRelClass = plainToInstance(Relationclass, req.body);
        const sc =
            await Metamodel_relationclasses_connection.postRelationClassesForSceneType(
                client,
                req.params.uuid,
                newRelClass,
                requireUser(req).uuid
            );
        if (Array.isArray(sc)) {
            return sc;
        } else if (sc instanceof BaseError) {
            throw sc;
        } else {
            throw new HTTP500Error(
                `Cannot post the meta relationclass for the scene type ${req.params.uuid}.`
            );
        }
    }, { status: 201 });

    /**
     * @description - Modify a specific meta relationclass by its UUID.
     * @param  {UUID} req.params.uuid - The uuid of the meta relationclass to modify.
     * @param res
     * @param next
     * @yield {status: 200, body: {Relationclass}} - The meta relationclass modified.
     * @throws {HTTP500Error} - If the modification of the meta relationclass fails.
     * @memberof Metamodel_relationclasses_controller
     * @method
     */
    patch_relationclass_by_uuid: RequestHandler = withTransaction(async (client, req) => {
        const newRelClass = Relationclass.fromJS(req.body) as Relationclass;

        const hardPatch = req.query.hardpatch === "true";
        let sc;
        if (hardPatch) {
            sc = await Metamodel_relationclasses_connection.hardUpdate(
                client,
                req.params.uuid,
                newRelClass,
                requireUser(req).uuid
            );
        } else {
            sc = await Metamodel_relationclasses_connection.update(
                client,
                req.params.uuid,
                newRelClass,
                requireUser(req).uuid
            );
        }

        if (sc instanceof Relationclass) {
            return sc;
        } else if (sc instanceof BaseError) {
            throw sc;
        } else {
            throw new HTTP500Error(`Failed to update the meta relationclass ${req.params.uuid}`);
        }
    });

    /**
     * @description - Delete a specific meta relationclass by its UUID.
     * @param {UUID} req.params.uuid - The uuid of the meta relationclass to delete.
     * @param res
     * @param next
     * @yield {status: 200, body: {UUID[]}} - The uuids of all the objects deleted.
     * @throws {HTTP500Error} - If the deletion of the meta relationclass fails.
     * @memberof Metamodel_relationclasses_controller
     * @method
     */
    delete_relationclass_by_uuid: RequestHandler = withTransaction(async (client, req) => {
        const deletedItems =
            await Metamodel_relationclasses_connection.deleteByUuid(
                client,
                req.params.uuid,
                requireUser(req).uuid
            );
        if (Array.isArray(deletedItems)) {
            //The result does not contains any uuid, i.e. the metaobject is not linked to any instance
            return deletedItems;
        } else if (deletedItems instanceof BaseError) {
            throw deletedItems;
        } else {
            throw new HTTP500Error(`Failed to delete the meta relationclass ${req.params.uuid}`);
        }
    });

    /**
     * @description - Delete all meta relationclasses for a specific scene type by its UUID.
     * @param {UUID} req.params.uuid - The uuid of the scene type.
     * @param res
     * @param next
     * @yield {status: 200, body: {UUID[]}} - The uuids of all the objects deleted.
     * @throws {HTTP500Error} - If the deletion of the meta relationclass fails.
     * @memberof Metamodel_relationclasses_controller
     * @method
     */
    delete_relationclasses_for_scene: RequestHandler = withTransaction(async (client, req) => {
        const sc =
            await Metamodel_relationclasses_connection.deleteAllByParentUuid(
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
                `Failed to delete the meta relationclasses for the scene type ${req.params.uuid}.`
            );
        }
    });
}

export default new Metamodel_relationclassesController();
