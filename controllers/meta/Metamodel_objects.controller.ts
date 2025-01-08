import {RequestHandler} from "express";
import {database_connection} from "../../index";
import {filter_object} from "../../data/services/middleware/object_filter";
import Metamodel_metaobject_connection from "../../data/meta/Metamodel_metaobjects.connection";
import {BaseError, HTTP500Error,} from "../../data/services/middleware/error_handling/standard_errors.middleware";

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
            await client.query("BEGIN");
            const sc = await Metamodel_metaobject_connection.deleteByUuid(
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
                    `Failed to delete meta object ${req.params.uuid}`
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

export default new Metamodel_objectsController();
