import {
    AttributeInstance,
    ClassInstance,
    PortInstance,
    RelationclassInstance,
    RoleInstance,
    SceneInstance,
    UUID,
} from "../../../mmar-global-data-structure";
import {PoolClient} from "pg";
import {queries} from "../../index";
import Instance_scene_connection from "../instance/Instance_scenes.connection";
import Instance_role_connection from "../instance/Instance_roles.connection";
import Instance_relationclass_connection from "../instance/Instance_relationclasses.connection";
import Instance_class_connection from "../instance/Instance_classes.connection";
import Instance_attribute_connection from "../instance/Instance_attributes.connection";
import Instance_port_connection from "../instance/Instance_ports.connection";
import {BaseError} from "../services/middleware/error_handling/standard_errors.middleware";

/**
 * @description - This is the class that handles some common operations for the Meta objects.
 * @export - The class is exported so that it can be used by other files.
 * @class Metamodel_common_functionsConnection
 */
class Metamodel_common_functionsConnection {
    /**
     * @description - This function is used to delete all metaobject with a specific query, a specific filter query and a specific filter uuid.
     * @param {PoolClient} client - The client is used to connect to the database.
     * @param {string} deletionQuery - The query that is used to delete the metaobject.
     * @param {UUID} uuidFilter - The filter is used to delete a specific metaobject for the deletionQuery.
     * @returns {Promise<UUID[] | undefined>} - The array of uuid of all the objects deleted, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error deleting the object.
     * @memberof Metamodel_common_functions
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export - This function is exported so that it can be used by other files.
     * @method
     * todo : add the user management with parameter userUuid to the query
     */
    async deleteAllItems(
        client: PoolClient,
        deletionQuery: string,
        uuidFilter?: UUID,
        userUuid?: UUID
    ): Promise<UUID[] | undefined | BaseError> {
        try {
            let res_uuid: Array<{ uuid_instance_object: UUID }> = [];
            const uuids = new Array<UUID>();

            if (uuidFilter) {
                // if a filter is specified, we get the uuid of the object to delete with the filter
                //Todo : add the user uuid to the query
                res_uuid = (await client.query(deletionQuery, [uuidFilter])).rows;
            } else {
                // if no filter is specified, we get the uuid of all the objects to delete
                res_uuid = (await client.query(deletionQuery)).rows;
            }

            if (res_uuid.length != 0) {
                // if there are objects to delete
                for (const uuid of res_uuid) {
                    // we delete each object
                    uuids.push(uuid.uuid_instance_object);
                }
            } else {
                // if there are no objects to delete we return undefined.
                return undefined;
            }
            return uuids;
        } catch (err) {
            throw new Error(`Error deleting the meta objects: ${err}`);
        }
    }

    /**
     * @description - This function is used to get the metaobject uuid and type with a specific instance uuid.
     * @param {PoolClient} client - The client is used to connect to the database.
     * @param {UUID} instanceUuid - The uuid of the instance object.
     * @returns {Promise<{ uuid: UUID, type: string } | undefined>} - The uuid and type ('scene_type', 'class', 'attribute', 'attribute_type', 'role', 'port', 'relationclass' ) of the metaobject, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error getting the metaobject.
     * @memberof Metamodel_common_functions
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export - This function is exported so that it can be used by other files.
     * @method
     */
    async getMetaobjectWithInstanceUuid(
        client: PoolClient,
        instanceUuid: UUID
    ): Promise<{ uuid: UUID; type: string } | undefined> {
        try {
            const query_getMeta_from_instance = queries.getQuery_get(
                "get_metauuid_from_instanceuuid"
            );
            const res_query = await client.query(query_getMeta_from_instance, [
                instanceUuid,
            ]);
            if (res_query.rowCount == 1) {
                return {
                    uuid: res_query.rows[0].uuid as UUID,
                    type: res_query.rows[0].source as string,
                };
            } else {
                return undefined;
            }
        } catch (err) {
            throw new Error(
                `Error in getMetaobjectWithInstanceUuid function: ${err}`
            );
        }
    }

    /**
     * @description - This function get the instance object giving any instance object's uuid.
     * @param {PoolClient} client - The client is used to connect to the database.
     * @param {UUID} instanceUuid - The uuid of any instance object.
     * @returns {Promise<Instance_scene_connection | Instance_role_connection | Instance_relationclass_connection | Instance_class_connection | Instance_attribute_connection | Instance_port_connection | undefined>} - The instance object if found, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error getting the instance object.
     * @memberof Metamodel_common_functions
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export - This function is exported so that it can be used by other files.
     * @method
     */
    async getInstanceObjectByAnyInstanceUuid(
        client: PoolClient,
        instanceUuid: UUID,
        userUuid?: UUID
    ): Promise<
        | SceneInstance
        | ClassInstance
        | PortInstance
        | RoleInstance
        | AttributeInstance
        | RelationclassInstance
        | undefined
        | BaseError
    > {
        try {
            const uuid_type = await this.getMetaobjectWithInstanceUuid(
                client,
                instanceUuid
            );
            if (uuid_type !== undefined) {
                switch (uuid_type.type) {
                    case "scene_type":
                        return await Instance_scene_connection.getByUuid(
                            client,
                            instanceUuid,
                            userUuid
                        );
                    case "class":
                        return await Instance_class_connection.getByUuid(
                            client,
                            instanceUuid,
                            userUuid
                        );
                    case "relationclass":
                        return await Instance_relationclass_connection.getByUuid(
                            client,
                            instanceUuid,
                            userUuid
                        );
                    case "role":
                        return await Instance_role_connection.getByUuid(
                            client,
                            instanceUuid,
                            userUuid
                        );
                    case "attribute":
                        return await Instance_attribute_connection.getByUuid(
                            client,
                            instanceUuid,
                            userUuid
                        );
                    case "port":
                        return await Instance_port_connection.getByUuid(
                            client,
                            instanceUuid,
                            userUuid
                        );

                    default:
                        // if the type is not recognized, we return undefined
                        return undefined;
                }
            }
            return undefined;

        } catch (err) {
            throw new Error(
                `Error getting the instance object for ${instanceUuid}: ${err}`
            );
        }
    }

    /**
     * @description - This function is used to get the meta type given any meta uuid.
     * @param {PoolClient} client - The client is used to connect to the database.
     * @param {UUID} metaUuid - The uuid of any meta object.
     * @returns {Promise<string | undefined>} - The type of the meta object ('scene_type', 'class', 'attribute', 'role', 'port', 'relationclass') if found, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error getting the meta object.
     * @memberof Metamodel_common_functions
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export - This function is exported so that it can be used by other files.
     * @method
     */
    async getMetaTypeWithMetaUuid(
        client: PoolClient,
        metaUuid: UUID
    ): Promise<string | undefined> {
        try {
            const query_getMetaType_from_metaUuid = queries.getQuery_get(
                "get_metatype_from_uuid"
            );
            const res_query = await client.query(query_getMetaType_from_metaUuid, [
                metaUuid,
            ]);
            if (res_query.rowCount == 1) {
                return res_query.rows[0].source as string;
            }
            return undefined;
        } catch (err) {
            throw new Error(
                `Error getting the meta type for the meta uuid ${metaUuid}: ${err}`
            );
        }
    }

    /**
     * @description - This function returns true if the meta object already exists in the database, false otherwise.
     * @param {PoolClient} client - The client is used to connect to the database.
     * @param {UUID} metaUuid - The uuid of the meta object.
     * @returns {Promise<boolean>} - True if the meta object already exists, false otherwise.
     * @throws {Error} - This function throws an error if there is an error getting the meta object.
     * @memberof Metamodel_common_functions
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export - This function is exported so that it can be used by other files.
     * @method
     */
    async doesMetaObjectAlreadyExists(
        client: PoolClient,
        metaUuid: UUID
    ): Promise<boolean> {
        try {
            const search_metaobject_query =
                queries.getQuery_rules("search_metaobject"); //$1 uuid
            const queryResult = await client.query(search_metaobject_query, [
                metaUuid,
            ]);
            return queryResult.rowCount == 1;
        } catch (err) {
            throw new Error(
                `Error checking if the meta object ${metaUuid} already exists in the database: ${err}`
            );
        }
    }

    async getTypeOfObject(
        client: PoolClient,
        objectUuid: UUID
    ): Promise<string | undefined> {
        try {
            const query_getType = "SELECT 'metaobject' AS table_name FROM metaobject WHERE uuid = $1 UNION SELECT 'instanceobject' AS table_name FROM instance_object WHERE uuid = $1";
            const res_query = await client.query(query_getType, [objectUuid]);
            if (res_query.rowCount == 1) {
                const test = res_query.rows[0].table_name as string;
                console.log(test);
                return test
            }
            return undefined;
        } catch (err) {
            throw new Error(
                `Error getting the type of the object for the uuid ${objectUuid}: ${err}`
            );
        }
    }
}

export default new Metamodel_common_functionsConnection();
