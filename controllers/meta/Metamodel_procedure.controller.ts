import {plainToInstance} from "class-transformer";
import {RequestHandler} from "express";
import {database_connection} from "../..";
import {Procedure} from "../../../mmar-global-data-structure/";
import {
    BaseError,
    HTTP403NORIGHT,
    HTTP500Error,
} from "../../data/services/middleware/error_handling/standard_errors.middleware";
import {filter_object} from "../../data/services/middleware/object_filter";
import Metamodel_procedure_connection from "../../data/meta/Metamodel_procedure.connection";
import { requireUser } from "../../data/services/middleware/auth.middleware";
import { begin_transaction } from "../../data/services/transaction";

/**
 * @classdesc - This class is used to handle all the requests for the meta procedures.
 * @export - The class is exported so that it can be used by other files.
 * @class - Metamodel_procedure_controller
 */
class Metamodel_procedureController {
    /**
     * @description - Get a specific meta procedure by its UUID.
     * @param {UUID} req.params.uuid - The uuid of the meta procedure.
     * @param res
     * @param next
     * @yield {status: 200, body: {Procedure}} - The meta procedure.
     * @throws {API404Error} - If the meta procedure is not found.
     * @throws {HTTP500Error} - If the acquisition of the meta procedure fails.
     * @memberof Metamodel_procedure_controller
     * @method
     */
    get_procedure_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();
        try {
            await begin_transaction(client);
            const sc = await Metamodel_procedure_connection.getByUuid(
                client,
                req.params.uuid,
                requireUser(req).uuid
            );
            if (sc instanceof Procedure) {
                // The transaction is made durable before the client is told it succeeded:
                // answering first left a window in which a caller could act on a 201
                // and not yet see what it had been promised.
                await client.query("COMMIT");
                res.status(200).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to retrieve the meta procedure ${req.params.uuid}.`
                );
            }
        } catch (err) {
            try {
                await client.query("ROLLBACK");
            } catch {
                // The connection is already gone; the error below is the
                // one worth reporting.
            }
            next(err);
        } finally {
            (await client).release();
        }
    };

    get_procedures: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();
        try {
            await begin_transaction(client);

            const procedure: Procedure[] = [];
            const sc =
                await Metamodel_procedure_connection.getAlgorithms(
                    client,
                    requireUser(req).uuid
                );
            if (Array.isArray(sc)) {
                procedure.push(...sc);
                // The transaction is made durable before the client is told it succeeded:
                // answering first left a window in which a caller could act on a 201
                // and not yet see what it had been promised.
                await client.query("COMMIT");
                res.status(200).json(filter_object(procedure, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(`Failed to retrieve the procedures.`);
            }

        } catch (err) {
            try {
                await client.query("ROLLBACK");
            } catch {
                // The connection is already gone; the error below is the
                // one worth reporting.
            }
            next(err);
        } finally {
            (await client).release();
        }
    };

    get_independent_procedures: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();
        try {
            await begin_transaction(client);

            const procedure: Procedure[] = [];
            const sc =
                await Metamodel_procedure_connection.getIndependentAlgorithms(
                    client,
                    requireUser(req).uuid
                );
            if (Array.isArray(sc)) {
                procedure.push(...sc);
                // The transaction is made durable before the client is told it succeeded:
                // answering first left a window in which a caller could act on a 201
                // and not yet see what it had been promised.
                await client.query("COMMIT");
                res.status(200).json(filter_object(procedure, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(`Failed to retrieve the procedures.`);
            }

        } catch (err) {
            try {
                await client.query("ROLLBACK");
            } catch {
                // The connection is already gone; the error below is the
                // one worth reporting.
            }
            next(err);
        } finally {
            (await client).release();
        }
    };

    post_procedure: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();
        try {
            await begin_transaction(client);
            const newProcedure = Procedure.fromJS(req.body) as Procedure;
            const sc = await Metamodel_procedure_connection.create(
                await client,
                newProcedure,
                requireUser(req).uuid
            );
            if (sc instanceof Procedure) {
                // The transaction is made durable before the client is told it succeeded:
                // answering first left a window in which a caller could act on a 201
                // and not yet see what it had been promised.
                await client.query("COMMIT");
                res.status(200).json(filter_object(sc, req.query.filter));
            } else if (typeof sc === "undefined") {
                throw new HTTP500Error(`Cannot post the procedure ${req.body}.`);
            } else {
                throw new HTTP403NORIGHT(
                    requireUser(req).username +
                    " does not have the right for the procedure: " +
                    req.params.uuid
                );
            }
        } catch (err) {
            try {
                await client.query("ROLLBACK");
            } catch {
                // The connection is already gone; the error below is the
                // one worth reporting.
            }
            next(err);
        } finally {
            (await client).release();
        }
    };

    delete_all_procedures: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();
        try {
            await begin_transaction(client);
            const sc = await Metamodel_procedure_connection.deleteAll(client, requireUser(req).uuid);
            if (Array.isArray(sc)) {
                //The result does not contains any uuid, i.e. the metaobject is not linked to any instance
                // The transaction is made durable before the client is told it succeeded:
                // answering first left a window in which a caller could act on a 201
                // and not yet see what it had been promised.
                await client.query("COMMIT");
                res.status(200).json(sc);
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(`Failed to delete all procedures.`);
            }
        } catch (err) {
            try {
                await client.query("ROLLBACK");
            } catch {
                // The connection is already gone; the error below is the
                // one worth reporting.
            }
            next(err);
        } finally {
            (await client).release();
        }
    };

    /**
     * @description - Get all the meta procedures for a specific scene type.
     * @param {UUID} req.params.uuid - The uuid of the scene type.
     * @param res
     * @param next
     * @yield {status: 200, body: {Procedure[]}} - The meta procedures.
     * @throws {HTTP500Error} - If the acquisition of the meta procedures fails.
     * @throws {API404Error} - If the scene type is not found.
     * @memberof Metamodel_procedure_controller
     * @method
     */
    get_procedure_by_scene_type_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();
        try {
            await begin_transaction(client);
            const sc = await Metamodel_procedure_connection.getAllByParentUuid(
                client,
                req.params.uuid,
                requireUser(req).uuid
            );
            if (Array.isArray(sc)) {
                // The transaction is made durable before the client is told it succeeded:
                // answering first left a window in which a caller could act on a 201
                // and not yet see what it had been promised.
                await client.query("COMMIT");
                res.status(200).json(sc);
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to retrieve the meta procedures for the scene type ${req.params.uuid}.`
                );
            }
        } catch (err) {
            try {
                await client.query("ROLLBACK");
            } catch {
                // The connection is already gone; the error below is the
                // one worth reporting.
            }
            next(err);
        } finally {
            (await client).release();
        }
    };

    /**
     * @description - Create a new meta procedure by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the meta procedure.
     * @param {Procedure} req.body - The meta procedure to create.
     * @param res
     * @param next
     * @yield {status: 201, body: {Procedure}} - The meta procedure created.
     * @throws {HTTP500Error} - If the creation of the meta procedure fails.
     * @memberOf Metamodel_procedure_controller
     * @method
     */
    post_procedure_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await begin_transaction(client);

            const newProcedure = Procedure.fromJS(req.body) as Procedure;
            newProcedure.uuid = req.params.uuid;
            const sc = await Metamodel_procedure_connection.create(
                client,
                newProcedure,
                requireUser(req).uuid
            );
            if (sc instanceof Procedure) {
                // The transaction is made durable before the client is told it succeeded:
                // answering first left a window in which a caller could act on a 201
                // and not yet see what it had been promised.
                await client.query("COMMIT");
                res.status(201).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Cannot post the meta procedure ${req.params.uuid}.`
                );
            }
        } catch (err) {
            try {
                await client.query("ROLLBACK");
            } catch {
                // The connection is already gone; the error below is the
                // one worth reporting.
            }
            next(err);
        } finally {
            (await client).release();
        }
    };

    /**
     * @description - Create a new procedure for a specific scene type by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the scene type.
     * @param {Procedure | Procedure[]} req.body - The meta procedure(s) to create.
     * @param res
     * @param next
     * @yield {status: 201, body: {Procedure[]}} - The meta procedure(s) created.
     * @throws {HTTP500Error} - If the creation of the meta procedure(s) fails.
     * @memberOf Metamodel_procedure_controller
     * @method
     */
    post_procedure_for_scenetype: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await begin_transaction(client);

            const newProcedure = plainToInstance(Procedure, req.body);
            const sc = await Metamodel_procedure_connection.postProceduresForSceneType(
                await client,
                req.params.uuid,
                newProcedure,
                requireUser(req).uuid
            );
            if (Array.isArray(sc)) {
                // The transaction is made durable before the client is told it succeeded:
                // answering first left a window in which a caller could act on a 201
                // and not yet see what it had been promised.
                await client.query("COMMIT");
                res.status(201).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Cannot post the meta procedure for the scene type ${req.params.uuid}.`
                );
            }
        } catch (err) {
            try {
                await client.query("ROLLBACK");
            } catch {
                // The connection is already gone; the error below is the
                // one worth reporting.
            }
            next(err);
        } finally {
            (await client).release();
        }
    };

    /**
     * @description - Modify a specific meta procedure by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the meta procedure.
     * @param {Procedure} req.body - The meta procedure to modify.
     * @param res
     * @param next
     * @yield {status: 200, body: {Procedure}} - The meta procedure modified.
     * @throws {HTTP500Error} - If the modification of the meta procedure fails.
     * @memberOf Metamodel_procedure_controller
     * @method
     */
    patch_procedure_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            const newProcedure = Procedure.fromJS(req.body) as Procedure;
            const sc = await Metamodel_procedure_connection.update(
                client,
                req.params.uuid,
                newProcedure,
                requireUser(req).uuid
            );
            if (sc instanceof Procedure) {
                res.status(200).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to update the meta procedure ${req.params.uuid}.`
                );
            }
            await client.query("COMMIT");
        } catch (err) {
            try {
                await client.query("ROLLBACK");
            } catch {
                // The connection is already gone; the error below is the
                // one worth reporting.
            }
            next(err);
        } finally {
            (await client).release();
        }
    };

    /**
     * @description - Delete a specific procedure for a specific procedure by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the meta procedure to delete.
     * @param res
     * @param next
     * @yield {status: 200, body: {UUID[]}} - The uuids of all the objects deleted.
     * @throws {HTTP500Error} - If the deletion of the meta procedure fails.
     * @memberOf Metamodel_procedure_controller
     * @method
     */
    delete_procedure_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();
        try {
            await begin_transaction(client);
            const sc = await Metamodel_procedure_connection.deleteByUuid(
                client,
                req.params.uuid,
                requireUser(req).uuid
            );
            if (Array.isArray(sc)) {
                // The transaction is made durable before the client is told it succeeded:
                // answering first left a window in which a caller could act on a 201
                // and not yet see what it had been promised.
                await client.query("COMMIT");
                res.status(200).json(sc);
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Cannot delete the meta procedure ${req.params.uuid}.`
                );
            }
        } catch (err) {
            try {
                await client.query("ROLLBACK");
            } catch {
                // The connection is already gone; the error below is the
                // one worth reporting.
            }
            next(err);
        } finally {
            (await client).release();
        }
    };

    /**
     * @description - Delete all the procedures for a specific scene type by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the scene type.
     * @param res
     * @param next
     * @yield {status: 200, body: {UUID[]}} - The uuids of all the objects deleted.
     * @throws {HTTP500Error} - If the deletion of the meta procedure fails.
     * @memberOf Metamodel_procedure_controller
     * @method
     */
    delete_procedure_for_scene: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            const resultQuery =
                await Metamodel_procedure_connection.deleteAllByParentUuid(
                    client,
                    req.params.uuid,
                    requireUser(req).uuid
                );
            if (Array.isArray(resultQuery)) {
                res.status(200).json(resultQuery);
            } else if (resultQuery instanceof BaseError) {
                throw resultQuery;
            } else {
                throw new HTTP500Error(
                    `Failed to delete the meta procedures for the scene type ${req.params.uuid}.`
                );
            }
            await client.query("COMMIT");
        } catch (err) {
            try {
                await client.query("ROLLBACK");
            } catch {
                // The connection is already gone; the error below is the
                // one worth reporting.
            }
            next(err);
        } finally {
            (await client).release();
        }
    };
}

export default new Metamodel_procedureController();
