import {PoolClient} from "pg";
import {ObjectInstance, UUID} from "../../../mmar-global-data-structure";

import {v4 as uuid} from "uuid";
import {queries} from "../../index";
import {CRUD} from "../common/crud.interface";
import {BaseError} from "../services/middleware/error_handling/standard_errors.middleware";

/**
 * @description - This is the class that handles the CRUD operations for the Object Instances.
 * @export - The class is exported so that it can be used by other files.
 * @class Instance_objectsConnection
 * @implements {CRUD}
 */
class Instance_objectsConnection implements CRUD {
    /**
     * @description - This function gets the instance object by its uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} objectUUID - The uuid of the instance object.
     * @returns {Promise<ObjectInstance | undefined>} - The instance object if it exists or undefined if it doesn't.
     * @throws {Error} - This function throws an error if there is an error getting the object.
     * @memberof Instance_objects_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async getByUuid(
        client: PoolClient,
        objectUUID: UUID,
        _userUuid?: UUID
    ): Promise<ObjectInstance | undefined | BaseError> {
        try {

            const get_object_query = queries.getQuery_get(
                "instance_object_uuid_query"
            );

            // Authorization happens at the scene boundary, never per instance
            // object: the routes that address this object by uuid resolve the
            // scene instance that owns it and check that instead. Do not add a
            // per-object right check here — it would also fire for every child
            // of a scene read, which has already been authorized.

            const res_object = await client.query(get_object_query, [objectUUID]);
            if (res_object.rowCount === 0) return undefined;
            return ObjectInstance.fromJS(res_object.rows[0]);

        } catch (err) {
            // The transaction belongs to the caller: rolling it back from a read
            // would undo work this function knows nothing about, and would leave
            // the controller's own rollback running against a finished transaction.
            throw new Error(`Error getting the object ${objectUUID}: ${err}`);
        }
    }

    /**
     * @description - This function deletes the instance object by its uuid.
     * @param {PoolClient} client - The client to the database.
     * @param  {UUID} objectUUID - The uuid of the instance object.
     * @param {UUID} userUUID - The uuid of the user that wants to delete the object.
     * @returns {Promise<UUID[] | undefined>} - The array of uuid of all the objects deleted, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error deleting the object.
     * @memberof Instance_objects_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async deleteByUuid(
        client: PoolClient,
        objectUUID: UUID,
        _userUUID?: UUID
    ): Promise<UUID[] | undefined | BaseError> {
        try {
            const returnUuids: UUID[] = new Array<UUID>();
            const query_del = queries.getQuery_delete("delete_instance_object");
            const query_get = queries.getQuery_delete("get_cascaded_delete_object");

            // Authorization happens at the scene boundary, never per instance
            // object: the routes that address this object by uuid resolve the
            // scene instance that owns it and check that instead. Do not add a
            // per-object right check here — it would also fire for every child
            // of a scene read, which has already been authorized.

            await client.query(query_del, [objectUUID]);
            const res_uuids = await client.query(query_get, [objectUUID]);
            for (const uuid of res_uuids.rows) {
                returnUuids.push(uuid.affected_uuid);
            }
            return returnUuids;
        } catch (err) {
            throw new Error(`Error deleting the object ${objectUUID}: ${err}`);
        }
    }

    /**
     * @description - This function deletes an array of objects.
     * @param {PoolClient} client - The client to the database.
     * @param {ObjectInstance[]} objectsToDelete - The array of objects to delete.
     * @param {UUID} userUUID - The uuid of the user that wants to delete the objects.
     * @returns {Promise<UUID[] | undefined>} - The array of uuid of all the objects deleted, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error deleting the objects.
     * @memberof Instance_objects_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async deleteCollectionObject(
        client: PoolClient,
        objectsToDelete: ObjectInstance[],
        userUUID?: UUID
    ): Promise<UUID[] | undefined | BaseError> {
        try {
            let returnUuids: UUID[] = [];
            for (const objects of objectsToDelete) {
                const sc = await this.deleteByUuid(client, objects.get_uuid(), userUUID);
                if (Array.isArray(sc)) returnUuids = returnUuids.concat(sc);
            }
            return returnUuids;
        } catch (err) {
            throw new Error(`Error deleting the objects: ${err}`);
        }
    }

    async create(
        client: PoolClient,
        instanceObjectToAdd: ObjectInstance,
        userUuid?: UUID | undefined
    ): Promise<ObjectInstance | undefined | BaseError> {
        try {

            const search_instanceObject_query = queries.getQuery_rules(
                "search_instanceobject"
            );
            const requested_uuid = instanceObjectToAdd.get_uuid();

            if (requested_uuid) {
                // The object already exists: undefined means "nothing was created",
                // which the callers treat as a no-op rather than as a failure.
                const existing = await client.query(search_instanceObject_query, [
                    requested_uuid,
                ]);
                if (existing.rowCount !== 0) return undefined;
            }

            // The uuid is supplied by the client, so it is bound as a parameter and
            // never interpolated into the statement. COALESCE lets the column
            // default generate one when the client did not propose any.
            const queryResult = await client.query(
                `INSERT INTO instance_object (uuid)
                 VALUES (COALESCE($1::uuid, gen_random_uuid()))
                 RETURNING uuid`,
                [requested_uuid ?? null]
            );
            if (queryResult.rowCount && queryResult.rowCount > 0) {

                await this.update(client, queryResult.rows[0].uuid, instanceObjectToAdd, userUuid);
                return await this.getByUuid(client, queryResult.rows[0].uuid);
            }
            return undefined

        } catch (err) {
            throw new Error(`Error creating the instance object: ${err}`);
        }
    }

    async createBulk(
        client: PoolClient,
        instanceObjectsToAdd: ObjectInstance[]
    ): Promise<ObjectInstance[] | undefined | BaseError> {
        try {
            const query_create_instanceObject_bulk = queries.getQuery_post(
                "create_object_instance_bulk"
            );
            const curated = instanceObjectsToAdd.map((obj) => {
                if (typeof obj.uuid == "undefined") {
                    obj.set_uuid(uuid());
                }
                return [
                    obj.get_uuid(),
                    obj.get_coordinates_2d(),
                    obj.get_absolute_coordinate_3d(),
                    obj.get_relative_coordinate_3d(),
                    obj.get_rotation(),
                    obj.get_geometry(),
                    obj.get_visibility(),
                    obj.get_custom_variables(),
                    obj.get_name(),
                    obj.get_description(),
                ];
            });
            await client.query(query_create_instanceObject_bulk, [curated]);
            return instanceObjectsToAdd;
        } catch (err) {
            throw new Error(`Error creating the instance objects: ${err}`);
        }
    }

    /**
     * @description - This function update an object instance.
     * @param {PoolClient} client - The client to the database.
     * @param {ObjectInstance} instanceObjectUpdated - The object instance to update.
     * @param {UUID} instanceObjectUUID - The uuid of the object instance to update.
     * @param {UUID} userUUID - The uuid of the user that wants to update the object instance.
     * @returns {Promise<ObjectInstance | undefined>} - The object instance updated, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error updating the object instance.
     * @memberof Instance_objects_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async update(
        client: PoolClient,
        instanceObjectUUID: UUID,
        instanceObjectUpdated: ObjectInstance,
        _userUUID?: UUID
    ): Promise<ObjectInstance | undefined | BaseError> {
        try {

            const query_update_instanceObj =
                "UPDATE instance_object set coordinates_2d =coalesce($2,coordinates_2d), absolute_coordinate_3d = coalesce ($3, absolute_coordinate_3d), relative_coordinate_3d =coalesce ($4,relative_coordinate_3d), geometry = coalesce ($5,geometry), visibility = coalesce ($6,visibility), custom_variables = coalesce ($7,custom_variables), name =coalesce($8,name), description =coalesce($9,description), rotation =coalesce($10,rotation) where uuid = $1 ";

            const params = [
                instanceObjectUUID,
                instanceObjectUpdated.get_coordinates_2d(),
                instanceObjectUpdated.get_absolute_coordinate_3d(),
                instanceObjectUpdated.get_relative_coordinate_3d(),
                instanceObjectUpdated.get_geometry(),
                instanceObjectUpdated.get_visibility(),
                instanceObjectUpdated.get_custom_variables(),
                instanceObjectUpdated.get_name(),
                instanceObjectUpdated.get_description(),
                instanceObjectUpdated.get_rotation(),
            ];


            // Authorization happens at the scene boundary, never per instance
            // object: the routes that address this object by uuid resolve the
            // scene instance that owns it and check that instead. Do not add a
            // per-object right check here — it would also fire for every child
            // of a scene read, which has already been authorized.
            await client.query(query_update_instanceObj, params);
            return await this.getByUuid(client, instanceObjectUUID);
        } catch (err) {
            throw new Error(
                `Error updating the instance object ${instanceObjectUUID}: ${err}`
            );
        }
    }

    /**
     * @todo - This function is not implemented yet.
     * @description - This function get all the object instances by the uuid of the parent.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} uuidParent - The uuid of the parent.
     * @returns {Promise<ObjectInstance[] | undefined>} - The array of object instances, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error getting the object instances.
     * @memberof Instance_objects_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async getAllByParentUuid(): Promise<ObjectInstance[] | BaseError> {
        throw new Error("Not implemented");
    }
}

export default new Instance_objectsConnection();
