import {RequestHandler} from "express";
import {database_connection} from "../..";
import {
    BaseError,
    HTTP500Error
} from "../../data/services/middleware/error_handling/standard_errors.middleware";
import {filter_object} from "../../data/services/middleware/object_filter";
import Metamodel_decomposableclass_connection from "../../data/meta/Metamodel_decomposable_classes.connection";
import {Class} from "../../../mmar-global-data-structure/models/meta/Metamodel_classes.structure";
import { requireUser } from "../../data/services/middleware/auth.middleware";
import { begin_transaction } from "../../data/services/transaction";

/**
 * @classdesc - This class is used to handle all the requests for the meta decompasable classes.
 * @export - The class is exported so that it can be used by other files.
 * @class - Metamodel_decomposableClasses_controller
 */
class Metamodel_decomposable_classesController {
    /**
     * @description - Get a specific meta decompasable class by its UUID.
     * @param {UUID} req.params.uuid - The uuid of the meta decompasable class.
     * @param res
     * @param next
     * @yield {status: 200, body: {DecomposableClass}} - The meta decompasable class.
     * @throws {API404Error} - If the meta decompasable class is not found.
     * @throws {HTTP500Error} - If the acquisition of the meta decompasable class fails.
     * @memberof Metamodel_decomposableClasses_controller
     * @method
     */
    get_decomposableclass_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await begin_transaction(client);
            const sc = await Metamodel_decomposableclass_connection.getByUuid(
                client,
                req.params.uuid,
                requireUser(req).uuid
            );
            if (sc instanceof Class) {
                // The transaction is made durable before the client is told it succeeded:
                // answering first left a window in which a caller could act on a 201
                // and not yet see what it had been promised.
                await client.query("COMMIT");
                res.status(200).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to retrieve meta decomposable class ${req.params.uuid}`
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
     * @description - Get all meta decompasable classes for a specific scene by its UUID.
     * @param {UUID} req.params.uuid - The uuid of the scene type.
     * @param res
     * @param next
     * @yield {status: 200, body: {DecomposableClass[]}} - The meta decompasable class.
     * @throws {API404Error} - If the meta decompasable class is not found.
     * @throws {HTTP500Error} - If the acquisition of the meta decompasable class fails.
     * @memberof Metamodel_decomposableClasses_controller
     * @method
     */
    get_decomposableclasses_for_scene: RequestHandler = async (
        req,
        res,
        next
    ) => {
        const client = await database_connection.getPool().connect();

        try {
            await begin_transaction(client);
            const sc = await Metamodel_decomposableclass_connection.getAllByParentUuid(
                client,
                req.params.uuid,
                requireUser(req).uuid
            );
            if (Array.isArray(sc)) {
                // The transaction is made durable before the client is told it succeeded:
                // answering first left a window in which a caller could act on a 201
                // and not yet see what it had been promised.
                await client.query("COMMIT");
                res.status(200).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to retrieve meta decomposable class ${req.params.uuid}`
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
}

export default new Metamodel_decomposable_classesController();
