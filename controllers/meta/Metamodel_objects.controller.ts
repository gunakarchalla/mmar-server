import {RequestHandler} from "express";
import {database_connection} from "../../index";
import {filter_object} from "../../data/services/middleware/object_filter";
import Metamodel_metaobject_connection from "../../data/meta/Metamodel_metaobjects.connection";
import {BaseError, HTTP500Error,} from "../../data/services/middleware/error_handling/standard_errors.middleware";
import { requireUser } from "../../data/services/middleware/auth.middleware";
import { begin_transaction } from "../../data/services/transaction";

/**
 * @classdesc - This class is used to handle some the requests for the meta objects.
 * @export - The class is exported so that it can be used by other files.
 * @class - Metamodel_metaobject_controller
 */
class Metamodel_objectsController {
    /**
     * @description - Delete a specific meta object by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the meta object.
     * @param res
     * @param next
     * @yield {status: 200, body: {UUID[]}} - The uuids of all the deleted objects.
     * @throws {HTTP500Error} - If the deletion of the meta object fails.
     * @memberof Metamodel_metaobject_controller
     * @method
     */
    delete_meta_object_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await begin_transaction(client);
            const sc = await Metamodel_metaobject_connection.deleteByUuid(
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
                    `Failed to delete meta object ${req.params.uuid}`
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

export default new Metamodel_objectsController();
