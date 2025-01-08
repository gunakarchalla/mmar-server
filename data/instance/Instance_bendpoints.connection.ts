import {queries} from "../../index";
import {ClassInstance, UUID} from "../../../mmar-global-data-structure";
import {PoolClient} from "pg";
import {CRUD} from "../common/crud.interface";
import Instance_class_connection from "./Instance_classes.connection";
import Instance_objects_connection from "./Instance_objects.connection";
import {BaseError} from "../services/middleware/error_handling/standard_errors.middleware";

/**
 * @description - This is the class that handles the CRUD operations for the BendPoint Instances.
 * @export - The class is exported so that it can be used by other files.
 * @class Instance_bendpointsConnection
 * @implements {CRUD}
 */
class Instance_bendpointsConnection implements CRUD {
    /**
     * @description - This function get a bendpoint instance by its uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} bendpointUuid - The uuid of the bendpoint instance to get.
     * @param {UUID} userUuid - The uuid of the user that want to get the bendpoint instance.
     * @returns {Promise<ClassInstance | undefined>} - The bendpoint instance if it exists, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error getting the bendpoint.
     * @memberof Instance_bendpoint_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async getByUuid(
        client: PoolClient,
        bendpointUuid: UUID,
        userUuid?: UUID
    ): Promise<ClassInstance | undefined | BaseError> {
        try {
            //This is just for better understanding
            return Instance_class_connection.getByUuid(
                client,
                bendpointUuid,
                userUuid
            );
        } catch (err) {
            throw new Error(`Error getting the bendpoint ${bendpointUuid}: ${err}`);
        }
    }

    /**
     * @description - This function get all the bendpoints instances of a relationclass instance by its uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} relationClassUuid - The uuid of the parent instance of the bendpoints instance to get.
     * @param {UUID} userUuid - The uuid of the user that want to get the bendpoints instance.
     * @returns {Promise<ClassInstance[]>} - The array of bendpoints instances if it exists, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error getting the bendpoint.
     * @memberof Instance_bendpoint_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async getAllByParentUuid(
        client: PoolClient,
        relationClassUuid: UUID,
        userUuid?: UUID
    ): Promise<ClassInstance[] | BaseError> {
        const bendpoint_query = queries.getQuery_get(
            "instance_bendpoints_from_relationClass_query"
        );
        const returnBendpoints = new Array<ClassInstance>();
        try {
            const res_bendpoints = await client.query(bendpoint_query, [
                relationClassUuid,
            ]);
            for (const cl of res_bendpoints.rows) {
                const newClass = await this.getByUuid(client, cl.uuid, userUuid);
                if (newClass instanceof ClassInstance) returnBendpoints.push(newClass);

            }
            return returnBendpoints;
        } catch (err) {
            throw new Error(
                `Error getting the bendpoint for the relationclass ${relationClassUuid}: ${err}`
            );
        }
    }

    /**
     * @description - This function update a bendpoint instance.
     * @param {PoolClient} client - The client to the database.
     * @param {ClassInstance} bendPointToUpdate - The bendpoint instance to update.
     * @param {UUID} bendPointUuidToUpdate - The uuid of the bendpoint instance to update.
     * @param {UUID} userUuid - The uuid of the user that want to update the bendpoint instance.
     * @returns {Promise<ClassInstance | undefined>} - The bendpoint instance updated, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error updating the bendpoint.
     * @memberof Instance_bendpoint_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async update(
        client: PoolClient,
        bendPointUuidToUpdate: UUID,
        bendPointToUpdate: ClassInstance,
        userUuid?: UUID
    ): Promise<ClassInstance | undefined | BaseError> {
        try {
            //The function is the same as classinstance
            return await Instance_class_connection.update(
                client,
                bendPointUuidToUpdate,
                bendPointToUpdate,
                userUuid
            );
        } catch (err) {
            throw new Error(
                `Error updating the bendpoint ${bendPointUuidToUpdate}: ${err}`
            );
        }
    }

    /**
     * @description - This function create a new bendpoint instance.
     * @param {PoolClient} client - The client to the database.
     * @param {ClassInstance[] | ClassInstance} newBendpoints - The bendpoint instance to create.
     * @param {UUID} sceneInstanceUUID - The uuid of the scene instance of the bendpoint instance to create.
     * @param {UUID} userUuid - The uuid of the user that want to create the bendpoint instance.
     * @returns {Promise<ClassInstance[] | undefined>} - The bendpoint instance created, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error creating the bendpoint.
     * @memberof Instance_bendpoint_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async create(
        client: PoolClient,
        newBendpoints: ClassInstance[] | ClassInstance,
        sceneInstanceUUID?: UUID,
        userUuid?: UUID
    ): Promise<ClassInstance[] | undefined | BaseError> {
        try {
            //The function is the same as classinstance
            return await Instance_class_connection.postClassInstances(
                client,
                newBendpoints,
                sceneInstanceUUID,
                userUuid
            );
        } catch (err) {
            throw new Error(`Error creating the bendpoint: ${err}`);
        }
    }

    /**
     * @description - This function delete bendpoint instances by uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} bendPointUuidToDelete - The uuid of the bendpoint to delete.
     * @param {UUID} userUuid - The uuid of the user that want to delete the bendpoint instance.
     * @returns {Promise<UUID[] | undefined>} - The array of uuid of all the objects deleted, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error deleting the bendpoint.
     * @memberof Instance_bendpoint_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async deleteByUuid(
        client: PoolClient,
        bendPointUuidToDelete: UUID,
        userUuid?: UUID
    ): Promise<UUID[] | undefined | BaseError> {
        try {
            return Instance_objects_connection.deleteByUuid(
                client,
                bendPointUuidToDelete,
                userUuid
            );
        } catch (err) {
            throw new Error(
                `Error deleting the bendpoint ${bendPointUuidToDelete}: ${err}`
            );
        }
    }
}

export default new Instance_bendpointsConnection();
