import { PoolClient } from "pg";
import { queries } from "../..";
import { MetaObject, UUID } from "../../../mmar-global-data-structure";
import { CRUD } from "../common/crud.interface";
import Metamodel_common_functions from "./Metamodel_common_functions.connection";
import {
    BaseError,
    HTTP403NORIGHT,
    HTTP409CONFLICT,
    HTTP500Error,
} from "../services/middleware/error_handling/standard_errors.middleware";

/**
 * @description - This is the class that handles the CRUD operations for the Meta object.
 * @export - The class is exported so that it can be used by other files.
 * @class Metamodel_metaobjectsConnection
 * @implements {CRUD}
 */
class Metamodel_metaobjectsConnection implements CRUD {
    /**
     * @description - This function gets an object by its UUID from the database using a provided client.
     * @param {PoolClient} client - The client used to connect to the database.
     * @param {UUID} metaObjectUUID - The UUID of the object to retrieve.
     * @returns {Promise<MetaObject>} - A promise that resolves with the retrieved object, or undefined if the object does not exist.
     * @throws {Error} - This function throws an error if there is an error getting the object.
     * @memberof Metamodel_metaobject_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export - This function is exported so that it can be used by other files.
     * @method
     */
    async getByUuid(
        client: PoolClient,
        metaObjectUUID: UUID,
        userUuid?: UUID,
    ): Promise<MetaObject | undefined | BaseError> {
        try {
            // Define the SQL query for getting an object by UUID
            const metaobject_query = queries.getQuery_get("metaobject_query");

            if (userUuid) {
                const read_check = queries.getQuery_get("read_check");
                const res = await client.query(read_check, [metaObjectUUID, userUuid]);
                if (res.rowCount == 0) {
                    return new HTTP403NORIGHT(`The user ${userUuid} has no right to read the meta object ${metaObjectUUID}`);
                }
            }
            // Execute the query with the provided client, passing in the UUID as a parameter
            const res_metaObject = await client.query(metaobject_query, [
                metaObjectUUID,
            ]);

            if (res_metaObject.rowCount === 0) return undefined;
            return MetaObject.fromJS(res_metaObject.rows[0]) as MetaObject;

        } catch (err) {
            // Throw an error with a message containing the UUID and the error message if there is an error getting the object
            throw new Error(
                `Error getting the meta object with UUID: ${metaObjectUUID}. Error: ${err}`
            );
        }
    }

    /**
     * @todo - This function is not implemented yet.
     * @description - This function get all the objects of a parent instance by its uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} uuidParent - The uuid of the parent instance of the attribute to get.
     * @returns {Promise<MetaObject[] | undefined>} - The array of attribute if it exists, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error getting the attribute.
     * @memberof Metamodel_metaobject_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export - This function is exported so that it can be used by other files.
     * @method
     */
    async getAllByParentUuid(): Promise<MetaObject[] | BaseError> {
        throw new Error("Not implemented");
    }

    /**
     * @description - This function create a new object.
     * @param {PoolClient} client - The client to the database.
     * @param {MetaObject} newMetaObject - The object to create.
     * @param userUUID
     * @param {| "scene_type" | "class" | "attribute" | "attribute_type" | "role" | "port" | "relationclass"} metaobjectType
     * @returns {Promise<MetaObject | undefined>} - The object created, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error creating the object.
     * @memberof Metamodel_metaobject_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export - This function is exported so that it can be used by other files.
     * @method
     */
    async create(
        client: PoolClient,
        newMetaObject: MetaObject,
        userUuid?: UUID,
        metaobjectType?:
            | "scene_type"
            | "class"
            | "attribute"
            | "attribute_type"
            | "role"
            | "port"
            | "relationclass"
            | "user"
            | "user_group"
            | "file"
            | "procedure"
    ): Promise<MetaObject | undefined | BaseError> {
        try {
            if (!newMetaObject) return undefined;
            const name = newMetaObject.name;
            const uuid: UUID | undefined = newMetaObject.uuid;


            if (userUuid && metaobjectType) {
                const tableTypes: { [key: string]: string } = {
                    "scene_type": "can_create_scenetype",
                    "attribute": "can_create_attribute",
                    "attribute_type": "can_create_attribute_type",
                    "class": "can_create_class",
                    "relationclass": "can_create_relationclass",
                    "role": "can_create_role",
                    "port": "can_create_port",
                    "procedure": "can_create_procedure",
                    "user_group": "can_create_user_group",
                };
                const tableName = tableTypes[metaobjectType];
                if (!tableName) return new HTTP500Error(`Invalid metaobject type: ${metaobjectType}`);

                const columnName = tableTypes[metaobjectType];
                if (!columnName) return new HTTP500Error(`Invalid column name: ${columnName}`);

                //const meta_create_check = queries.getQuery_get("meta_create_check");
                const meta_create_check = `SELECT 1
                                           WHERE EXISTS (SELECT 1
                                                         FROM user_group ug
                                                                  JOIN has_user_user_group huug ON ug.uuid_metaobject = huug.uuid_user_group
                                                         WHERE ug.${columnName} = true
                                                           AND huug.uuid_user = $1)
                                              OR $1 = 'ff892138-77e0-47fe-a323-3fe0e1bf0240';`;
                const res = await client.query(meta_create_check, [userUuid]);
                if (res.rowCount == 0) {
                    return new HTTP403NORIGHT(`The user ${userUuid} has no right to create a ${metaobjectType}`);
                }
            }

            // Check if the meta object already exists return undefined if it does
            if (uuid && (await Metamodel_common_functions.doesMetaObjectAlreadyExists(client, uuid))) {
                return new HTTP409CONFLICT(`The meta object with UUID ${uuid} already exists`);
            }

            const query = uuid
                ? queries.getQuery_post("create_metaObject_with_uuid")
                : queries.getQuery_post("create_metaObject");
            // if the meta object has a uuid, execute the query with the provided client, passing in the uuid and the name as a parameter
            const values = uuid ? [uuid, name] : [name];
            const res = await client.query(query, values)
            if (res.rowCount && res.rowCount > 0) {
                const created_metaObject = MetaObject.fromJS(res.rows[0]) as MetaObject;
                return this.getByUuid(client, created_metaObject.get_uuid());
            }
            return undefined;

        } catch (err) {
            throw new Error(`Error creating the meta object: ${err}`);
        }
    }

    /**
     * @description - This function update an object.
     * @param {PoolClient} client - The client to the database.
     * @param {MetaObject} metaObjectUpdated - The object to update.
     * @param {UUID} metaObjectUUID - The uuid of the object to update.
     * @param {UUID} userUuid - The uuid of the user that wants to update the object.
     * @returns {Promise<MetaObject | undefined>} - The object updated, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error updating the object.
     * @memberof Metamodel_metaobject_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export - This function is exported so that it can be used by other files.
     * @method
     */
    async update(
        client: PoolClient,
        metaObjectUUID: UUID,
        metaObjectUpdated: MetaObject,
        userUuid?: UUID
    ): Promise<MetaObject | undefined | BaseError> {
        try {
            // check if the user has the right to update the metaobject
            const query_update_metaObj =
                "UPDATE metaobject set name = coalesce($1, name), description =coalesce($2,description), coordinates_2d =coalesce($3,coordinates_2d), absolute_coordinate_3d = coalesce ($4, absolute_coordinate_3d), relative_coordinate_3d =coalesce ($5,relative_coordinate_3d), geometry = coalesce ($6,geometry) where uuid = $7 ";

            const parameters = [
                metaObjectUpdated.name,
                metaObjectUpdated.description,
                metaObjectUpdated.coordinates_2d,
                metaObjectUpdated.absolute_coordinate_3d,
                metaObjectUpdated.relative_coordinate_3d,
                metaObjectUpdated.geometry,
                metaObjectUUID,
            ];

            if (userUuid) {
                const write_check = queries.getQuery_get("write_check");
                const res = await client.query(write_check, [metaObjectUUID, userUuid]);
                if (res.rowCount == 0) return new HTTP403NORIGHT(`The user ${userUuid} has no right to update the meta object ${metaObjectUUID}`);
            }
            await client.query(query_update_metaObj, parameters);

            return await this.getByUuid(client, metaObjectUUID);
        } catch (err) {
            throw new Error(
                `Error updating the meta object ${metaObjectUUID}: ${err}`
            );
        }
    }

    /**
     * @description - This function delete object by uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} uuidToDelete - The uuid of the object to delete.
     * @param {UUID} userUuid - The uuid of the user that wants to delete the object.
     * @returns {Promise<UUID[] | undefined>} - The array of uuid of all the objects deleted, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error deleting the object.
     * @memberof Metamodel_metaobject_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export - This function is exported so that it can be used by other files.
     * @method
     */
    async deleteByUuid(
        client: PoolClient,
        uuidToDelete: UUID,
        userUuid?: UUID
    ): Promise<UUID[] | undefined | BaseError> {
        // Holds the UUIDs of objects to be returned
        const returnUuids: UUID[] = [];

        // Holds the UUIDs of objects that cannot be deleted due to restrictions
        const restrictedUuids: { uuid: UUID; name: string; type: string }[] = [];

        // Base query to delete the object and return violations if any
        let queryDel = "select delete_and_return_violation($1);";
        const queryParams = [uuidToDelete];


        if (userUuid) {
            const delete_check = queries.getQuery_get("delete_check");
            const res = await client.query(delete_check, [uuidToDelete, userUuid]);
            if (res.rowCount == 0) return new HTTP403NORIGHT(`The user ${userUuid} has no right to delete the meta object ${uuidToDelete}`);

            // If a user UUID is provided, modify the query to include user-specific deletion checks
            queryDel = "select delete_and_return_violation($1,$2)";
            queryParams.push(userUuid);
        }

        const metaobject_check = queries.getQuery_get("metaobject_query");
        const resultMetaobject = await client.query(metaobject_check, [uuidToDelete]);
        if (resultMetaobject.rowCount == 0) {
            return new HTTP500Error(`The meta object ${uuidToDelete} does not exist`);
        }

        // Execute the query
        const resultDel = await client.query(queryDel, queryParams);
        // Process the result
        for (const row of resultDel.rows) {
            switch (row.error) {
                case "403":
                    if (userUuid) {
                        return new HTTP403NORIGHT(
                            `The user ${userUuid} has no right to delete the meta object ${uuidToDelete} or its dependencies`
                        );
                    } else {
                        return new HTTP500Error(
                            `The meta object ${uuidToDelete} or its dependencies could not be deleted`
                        )
                    }
                case "23503":
                    // If the error is a foreign key violation, add the violating UUID to the restricted UUIDs array
                    restrictedUuids.push({
                        uuid: row.uuid,
                        name: row.name,
                        type: row.type,
                    });
                    break;
                default:
                    // If the error is not a foreign key violation, throw an error with the error message
                    returnUuids.push(row.uuid);
                    break;
            }
        }
        if (restrictedUuids.length > 0) {
            // If there are restricted UUIDs, throw a conflict error with details about the violating objects
            return new HTTP409CONFLICT(
                `Cannot delete the meta object ${uuidToDelete}, because it is referenced by the following ${restrictedUuids
                    .map((obj) => `${obj.type}: ${obj.name} (${obj.uuid})`)
                    .join(", ")}`
            );
        }

        // If there are UUIDs to return, return them, else return undefined
        return returnUuids[0] != undefined ? returnUuids : resultDel.rows[0].delete_and_return_violation as UUID[];
    }
}

export default new Metamodel_metaobjectsConnection();
