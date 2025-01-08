import {PoolClient} from "pg";
import {RoleInstance, UUID} from "../../../mmar-global-data-structure";
import {queries} from "../../index";
import {CRUD} from "../common/crud.interface";
import Instance_objects_connection from "./Instance_objects.connection";
import Metamodel_common_functions from "../meta/Metamodel_common_functions.connection";
import {BaseError, HTTP403NORIGHT} from "../services/middleware/error_handling/standard_errors.middleware";

/**
 * @description - This is the class that handles the CRUD operations for the Role Instances.
 * @export - The class is exported so that it can be used by other files.
 * @class Instance_rolesConnection
 * @implements {CRUD}
 */
class Instance_rolesConnection implements CRUD {
    /**
     * @description - This function gets the role by the uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} roleUuid - The uuid of the role to get.
     * @param {UUID} userUuid - The uuid of the user that wants to get the role.
     * @returns {Promise<RoleInstance | undefined>} - The role instance if it exists, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error getting the role.
     * @memberof Instance_role_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async getByUuid(
        client: PoolClient,
        roleUuid: UUID,
        userUuid?: UUID
    ): Promise<RoleInstance | undefined | BaseError> {
        const role_query = queries.getQuery_get("instance_role_uuid_query");
        let newRole;
        try {
            if (userUuid) {
                const read_check = queries.getQuery_get("read_check");
                const res = await client.query(read_check, [roleUuid, userUuid]);
                if (res.rowCount == 0) return new HTTP403NORIGHT(`The user ${userUuid} has no right to read the role ${roleUuid}`);
            }
            const res_role = await client.query(role_query, [roleUuid]);

            if (res_role.rowCount == 1) {
                //dynamic way to return the result
                newRole = RoleInstance.fromJS(res_role.rows[0]) as RoleInstance;
            }
            return newRole;
        } catch (err) {
            throw new Error(`Error getting the role ${roleUuid}: ${err}`);
        }
    }

    /**
     * @description - This function get all the role instances of a parent instance by its uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} uuidParent - The uuid of the parent instance of the role instance to get.
     * @param {UUID} userUuid - The uuid of the user that wants to get the role instances.
     * @returns {Promise<RoleInstance[]>} - The array of role instances if it exists, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error getting the role.
     * @memberof Instance_role_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async getAllByParentUuid(
        client: PoolClient,
        uuidParent: UUID,
        userUuid?: UUID
    ): Promise<RoleInstance[] | BaseError> {
        try {
            let role_query: string;
            const returnRoles = new Array<RoleInstance>();
            const uuid_type =
                await Metamodel_common_functions.getMetaobjectWithInstanceUuid(
                    client,
                    uuidParent
                );
            if (uuid_type !== undefined) {
                switch (uuid_type.type) {
                    case "scene_type":
                        role_query = queries.getQuery_get(
                            "instance_role_for_scene_instance_query"
                        );
                        break;
                    case "class":
                        role_query = queries.getQuery_get(
                            "instance_role_for_class_instance_query"
                        );
                        break;
                    case "relationclass":
                        role_query = queries.getQuery_get(
                            "instance_role_for_relationclass_instance_query"
                        );
                        break;
                    case "attribute":
                        role_query = queries.getQuery_get(
                            "instance_role_for_attribute_instance_query"
                        );
                        break;
                    case "port":
                        role_query = queries.getQuery_get(
                            "instance_role_for_port_instance_query"
                        );
                        break;
                    default:
                        throw new Error(
                            "Error the uuid provided cannot be a parent for a role"
                        );
                }
                const res_role = await client.query(role_query, [uuidParent]);
                for (const cl of res_role.rows) {
                    const newRole = await this.getByUuid(await client, cl.uuid, userUuid);
                    if (newRole instanceof RoleInstance) returnRoles.push(newRole);

                }
            }
            return returnRoles;
        } catch (err) {
            throw new Error(`Error getting roles for ${uuidParent}: ${err}`);
        }
    }

    /**
     * @description - This function update a role instance.
     * @param {PoolClient} client - The client to the database.
     * @param {RoleInstance} roleToUpdate - The role instance to update.
     * @param {UUID} roleUuidToUpdate - The uuid of the role instance to update.
     * @param {UUID} userUuid - The uuid of the user that wants to update the role instance.
     * @returns {Promise<RoleInstance | undefined>} - The role instance updated, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error updating the role.
     * @memberof Instance_role_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async update(
        client: PoolClient,
        roleUuidToUpdate: UUID,
        roleToUpdate: RoleInstance,
        userUuid?: UUID
    ): Promise<RoleInstance | undefined | BaseError> {
        const query_update_roleInstance = queries.getQuery_post(
            "update_role_instance"
        );
        try {
            const updated_obj = await Instance_objects_connection.update(
                client,
                roleUuidToUpdate,
                roleToUpdate,
                userUuid
            );
            if (updated_obj instanceof BaseError) {
                if (updated_obj.httpCode === 403) {
                    return new HTTP403NORIGHT(`The user ${userUuid} has no right to update the role instance ${roleUuidToUpdate}`);
                }
                return updated_obj;
            }
            if (!updated_obj) return undefined;

            await client.query(query_update_roleInstance, [
                roleToUpdate.uuid_has_reference_class_instance,
                roleToUpdate.uuid_has_reference_port_instance,
                roleToUpdate.uuid_has_reference_scene_instance,
                roleToUpdate.uuid_has_reference_attribute_instance,
                roleToUpdate.uuid_has_reference_relationclass_instance,
                roleUuidToUpdate,
            ]);
            return await this.getByUuid(client, roleUuidToUpdate, userUuid);
        } catch (err) {
            throw new Error(`Error updating the role ${roleUuidToUpdate}: ${err}`);
        }
    }

    /**
     * @description - This function create a new role instance.
     * @param {PoolClient} client - The client to the database.
     * @param {RoleInstance} newRole - The role instance to create.
     * @param {UUID} userUuid - The uuid of the user that wants to create the role instance.
     * @returns {Promise<RoleInstance | undefined>} - The role instance created, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error creating the role.
     * @memberof Instance_role_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async create(
        client: PoolClient,
        newRole: RoleInstance,
        userUuid?: UUID
    ): Promise<RoleInstance | undefined | BaseError> {
        try {
            const query_create_role = queries.getQuery_post("create_role_instance");

            const created_instanceObject = await Instance_objects_connection.create(
                client,
                newRole,
                userUuid
            );

            if (created_instanceObject instanceof BaseError) {
                if (created_instanceObject.httpCode === 403) {
                    return new HTTP403NORIGHT(`The user ${userUuid} has no right to create the role instance`);
                }
                return created_instanceObject;
            }

            if (!created_instanceObject) return undefined;

            await client.query(query_create_role, [
                created_instanceObject.get_uuid(),
                newRole.uuid_role,
            ]);
            await this.update(client, created_instanceObject.get_uuid(), newRole);
            return await this.getByUuid(client, created_instanceObject.get_uuid());

        } catch (err) {
            throw new Error(`Error creating the role instance: ${err}`);
        }
    }

    /**
     * @description - This function create and link a role instance to a parent.
     * @param {PoolClient} client - The client to the database.
     * @param {RoleInstance[] | RoleInstance} newRole - The role instance or array of role instances to create.
     * @param {UUID} userUuid - The uuid of the user that wants to create the role instance.
     * @returns {Promise<RoleInstance[] | undefined>} - The role instance created, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error creating the role instance.
     * @memberof Instance_role_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async postRolesInstance(
        client: PoolClient,
        newRole: RoleInstance[] | RoleInstance,
        userUuid?: UUID
    ): Promise<RoleInstance[] | undefined | BaseError> {
        const returnRole = new Array<RoleInstance>();
        try {
            if (!Array.isArray(newRole)) newRole = [newRole];

            //if roleParam is an array of roles
            for (const roleToAdd of newRole) {
                const currentRole = await this.create(client, roleToAdd, userUuid);
                if (currentRole instanceof RoleInstance) returnRole.push(currentRole);
            }
            return returnRole;
        } catch (err) {
            throw new Error(`Error creating the role instance: ${err}`);
        }
    }

    /**
     * @description - This function delete role instances by uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} uuidToDelete - The uuid of the parent.
     * @param {UUID} userUuid - The uuid of the user that wants to delete the role instance.
     * @returns {Promise<UUID[] | undefined>} - The array of uuid of all the objects deleted, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error deleting the role instance.
     * @memberof Instance_role_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async deleteByUuid(
        client: PoolClient,
        uuidToDelete: UUID,
        userUuid?: UUID
    ): Promise<UUID[] | undefined | BaseError> {
        try {
            return Instance_objects_connection.deleteByUuid(
                client,
                uuidToDelete,
                userUuid
            );
        } catch (err) {
            throw new Error(
                `Error deleting the role instance ${uuidToDelete}: ${err}`
            );
        }
    }

    /**
     * @description - This function delete role instances by the parent's uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} parentUuid - The uuid of the parent.
     * @param {UUID} userUuid - The uuid of the user that wants to delete the role instance.
     * @returns {Promise<UUID[] | undefined>} - The array of uuid of all the objects deleted, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error deleting the role instance.
     * @memberof Instance_role_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async deleteAllByParentUuid(
        client: PoolClient,
        parentUuid: UUID,
        userUuid?: UUID
    ): Promise<UUID[] | undefined | BaseError> {
        try {
            const roles = await this.getAllByParentUuid(client, parentUuid, userUuid);
            if (roles instanceof BaseError) return roles;
            return await Instance_objects_connection.deleteCollectionObject(
                client,
                roles,
                userUuid
            );
        } catch (err) {
            throw new Error(
                `Error deleting the roles for the parent ${parentUuid}: ${err}`
            );
        }
    }
}

export default new Instance_rolesConnection();
