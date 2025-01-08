import {RequestHandler} from "express";
import {database_connection} from "../..";
import {
    API404Error,
    BaseError,
    HTTP500Error
} from "../../data/services/middleware/error_handling/standard_errors.middleware";
import {filter_object} from "../../data/services/middleware/object_filter";
import Metamodel_aggregator_connection from "../../data/meta/Metamodel_aggregator_classes.connection";
import {Class} from "../../../mmar-global-data-structure/models/meta/Metamodel_classes.structure";

/**
 * @classdesc - This class is used to handle all the requests for the meta aggregator classes.
 * @export - The class is exported so that it can be used by other files.
 * @class - Metamodel_aggregatorclasses_controller
 */
class Metamodel_aggregatorclassesController {
    /**
     * @description - Get all the meta aggregator classes for a specific scene type by its UUID.
     * @param {UUID} req.params.uuid - The uuid of the scene type.
     * @param res
     * @param next
     * @yield {status: 200, body: {Class[]}} - The meta aggregator classes.
     * @throws {HTTP500Error} - If the acquisition of the meta aggregator classes fails.
     * @throws {API404Error} - If the scene type is not found.
     * @memberof Metamodel_aggregatorclasses_controller
     * @method
     */
    get_aggregatableclasses_for_scene: RequestHandler = async (
        req,
        res,
        next
    ) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");
            const sc = await Metamodel_aggregator_connection.getAllByParentUuid(
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
                    `Failed to retrieve aggregator classes for scene ${req.params.uuid}`
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
     * @description - Get a specific meta aggregator class by its UUID.
     * @param {UUID} req.params.uuid - The uuid of the meta aggregator class.
     * @param res
     * @param next
     * @yield {status: 200, body: {Class}} - The meta aggregator class.
     * @throws {API404Error} - If the meta aggregator class is not found.
     * @throws {HTTP500Error} - If the acquisition of the meta aggregator class fails.
     * @memberof Metamodel_aggregatorclasses_controller
     * @method
     */
    get_aggregatableclass_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");
            const sc = await Metamodel_aggregator_connection.getByUuid(
                client,
                req.params.uuid,
                req.body.tokendata.uuid
            );
            if (sc instanceof Class) {
                res.status(200).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to retrieve aggregator class ${req.params.uuid}`
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

export default new Metamodel_aggregatorclassesController();
