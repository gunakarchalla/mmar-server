import {PoolClient} from "pg";
import {UUID} from "../../../mmar-global-data-structure";
import {BaseError} from "../services/middleware/error_handling/standard_errors.middleware";

export interface CRUD {
    /**
     * @description - Get a specific object by its uuid.
     * @param client - The database client connection.
     * @param uuidToGet - The uuid of the object to get.
     * @returns {Promise<any | undefined>} - The object behind a promise.
     * @memberof CRUD
     * @method
     */
    getByUuid: (
        client: PoolClient,
        uuidToGet: UUID
    ) => Promise<any | undefined | BaseError>;

    /**
     * @description - Get all the objects by the uuid of the parent object.
     * @param client - The database client connection.
     * @param uuidParent - The uuid of the parent object.
     * @returns {Promise<any[]>} - The objects behind a promise.
     * @memberof CRUD
     * @method
     */
    getAllByParentUuid: (client: PoolClient, uuidParent: UUID) => Promise<any[] | BaseError>;

    /**
     * @description - Create a new object in the database.
     * @param client - The database client connection.
     * @param objectToCreate - The object to create.
     * @returns {Promise<any | undefined>} - The created object behind a promise.
     * @memberof CRUD
     * @method
     */
    create: (
        client: PoolClient,
        objectToCreate: any
    ) => Promise<any | undefined | BaseError>;

    /**
     * @description - Modify an existing object in the database.
     * @param client - The database client connection.
     * @param uuidToUpdate - The uuid of the object to update.
     * @param objectToUpdate - The object to update.
     * @returns {Promise<any | undefined>} - The updated object behind a promise.
     * @memberof CRUD
     * @method
     */
    update: (
        client: PoolClient,
        uuidToUpdate: UUID,
        objectToUpdate: any
    ) => Promise<any | undefined | BaseError>;

    /**
     * @description - Delete an existing object from the database.
     * @param client - The database client connection.
     * @param uuidToDelete - The uuid of the object to delete.
     * @returns {Promise<UUID[] | undefined>} - The uuids of all deleted object, behind a promise.
     * @memberof CRUD
     * @method
     */
    deleteByUuid: (
        client: PoolClient,
        uuidToDelete: UUID
    ) => Promise<UUID[] | undefined | BaseError>;
}
