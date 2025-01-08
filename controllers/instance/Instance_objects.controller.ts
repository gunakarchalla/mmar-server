import {RequestHandler} from "express";
import {database_connection} from "../../index";
import {filter_object} from "../../data/services/middleware/object_filter";
import {BaseError, HTTP500Error,} from "../../data/services/middleware/error_handling/standard_errors.middleware";
import Instance_objects_connection from "../../data/instance/Instance_objects.connection";

/**
 * @classdesc - This class is used to handle all the requests for the object instances.
 * @export - The class is exported so that it can be used by other files.
 * @class - Instance_object_controller
 */
class Instance_objectsController {
    /**
     * @description - Delete a specific object instance by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the object instance.
     * @param res
     * @param next
     * @yield {status: 200, body: {UUID[]}} - The uuids of all the deleted object instances.
     * @throws {HTTP500Error} - If the deletion of the object instance fails.
     * @memberof Instance_object_controller
     * @method
     */
    delete_object_instance_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");
            const sc = await Instance_objects_connection.deleteByUuid(
                client,
                req.params.uuid,
                req.body.tokendata.uuid
            );
            if (Array.isArray(sc)) {
                (await client).release();
                res.status(200).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to delete the object instance ${req.params.uuid}.`
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

export default new Instance_objectsController();
