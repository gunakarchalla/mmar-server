import {PoolClient} from "pg";
import {queries} from "../..";
import {Class, UUID} from "../../../mmar-global-data-structure";
import Metamodel_attributes_connection from "./Metamodel_attributes.connection";
import {BaseError, HTTP403NORIGHT} from "../services/middleware/error_handling/standard_errors.middleware";
import Metamodel_ports_connection from "./Metamodel_ports.connection";

/**
 * @description - This is the class that handles the CRUD operations for the Meta aggregator classes.
 * @class Metamodel_aggregator_classesConnection
 * @export - This class is exported so that it can be used by other classes.
 */
class Metamodel_aggregator_classesConnection {
    /**
     * @description - This function get all the aggregator class of a parent instance by its uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} uuidParent - The uuid of the parent instance of the aggregator class to get.
     * @returns {Promise<Class[]>} - The array of decomposable class if it exists, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error getting the aggregator class.
     * @memberof Metamodel_aggregator_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export - This function is exported so that it can be used by other files.
     * @method
     */
    async getAllByParentUuid(
        client: PoolClient,
        uuidParent: UUID,
        userUuid?: UUID
    ): Promise<Class[] | BaseError> {
        try {
            const classes_query = queries.getQuery_get(
                "decomposableClasses_scene_query"
            );
            const returnClasses: Class[] = [];

            const res_classes = await client.query(classes_query, [uuidParent]);
            for (const cl of res_classes.rows) {
                const newDecClass = await this.getByUuid(client, cl.uuid, userUuid);
                if (newDecClass instanceof Class) {
                    returnClasses.push(newDecClass);
                }
            }
            return returnClasses;
        } catch (err) {
            throw new Error(
                `Error getting the aggregator class for the parent ${uuidParent}: ${err}`
            );
        }
    }

    /**
     * @description - This function gets the aggregator class by uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} aggrClassUuid - The uuid of the aggregator class to get.
     * @returns {Promise<Class | undefined>} - The aggregator class with the uuid.
     * @throws {Error} - This function throws an error if there is an error getting the aggregator class.
     * @memberof Metamodel_aggregator_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export - This function is exported so that it can be used by other aggregator classes.
     * @method
     */
    async getByUuid(
        client: PoolClient,
        aggrClassUuid: UUID,
        userUuid?: UUID
    ): Promise<Class | undefined | BaseError> {
        try {
            // TODO in V2: modify the SQL query
            const classes_query = queries.getQuery_get(
                "aggregatableClasses_uuid_query"
            );
            let newClass;

            if (userUuid) {
                const read_check = queries.getQuery_get("read_check");
                const res = await client.query(read_check, [aggrClassUuid, userUuid]);
                if (res.rowCount == 0) {
                    return new HTTP403NORIGHT(`The user ${userUuid} has no right to read the aggregator class ${aggrClassUuid}`);
                }
            }

            const res_class = await client.query(classes_query, [aggrClassUuid]);
            if (res_class.rowCount == 1) {
                newClass = Class.fromJS(res_class.rows[0]) as Class;

                const attributes = await Metamodel_attributes_connection.getAllByParentUuid(
                    client,
                    newClass.get_uuid(),
                    userUuid
                );
                if (Array.isArray(attributes)) newClass.set_attribute(attributes);

                const ports = await Metamodel_ports_connection.getAllByParentUuid(
                    client,
                    newClass.get_uuid(),
                    userUuid
                );
                if (Array.isArray(ports)) newClass.set_port(ports);

            }

            return newClass;
        } catch (err) {
            throw new Error(
                `Error getting the aggregator class ${aggrClassUuid}: ${err}`
            );
        }
    }
}

export default new Metamodel_aggregator_classesConnection();
