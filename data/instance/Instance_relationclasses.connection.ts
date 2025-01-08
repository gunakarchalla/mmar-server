import {RelationclassInstance, RoleInstance, UUID,} from "../../../mmar-global-data-structure";
import {PoolClient} from "pg";
import Instance_role_connection from "./Instance_roles.connection";
import {CRUD} from "../common/crud.interface";
import Instance_attribute_connection from "./Instance_attributes.connection";
import Instance_class_connection from "./Instance_classes.connection";
import Instance_objects_connection from "./Instance_objects.connection";
import {queries} from "../../index";
import {BaseError, HTTP403NORIGHT} from "../services/middleware/error_handling/standard_errors.middleware";

/**
 * @description - This is the class that handles the CRUD operations for the RelationClass Instances.
 * @export - The class is exported so that it can be used by other files.
 * @class Instance_relationclassesConnection
 * @implements {CRUD}
 */
class Instance_relationclassesConnection implements CRUD {
    /**
     * @description - This function gets the relationclass by the uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} relclassUuid - The uuid of the relationclass to get.
     * @param {UUID} userUuid - The uuid of the user that wants to get the relationclass.
     * @returns {Promise<RelationclassInstance | undefined>} - The relationclass instance if it exists, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error getting the port.
     * @memberof Instance_relationclass_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async getByUuid(
        client: PoolClient,
        relclassUuid: UUID,
        userUuid?: UUID
    ): Promise<RelationclassInstance | undefined | BaseError> {
        try {
            const relclasses_query: string =
                "select * from instance_object io, relationclass_instance ri, class_instance ci where io.uuid=ci.uuid_instance_object AND ri.uuid_class_instance=ci.uuid_instance_object AND ri.uuid_class_instance =$1 ";
            let newRelClass;
            if (userUuid) {
                const read_check = queries.getQuery_get("read_check");
                const res = await client.query(read_check, [relclassUuid, userUuid]);
                if (res.rowCount == 0) return new HTTP403NORIGHT(`The user ${userUuid} has no right to read the relationclass ${relclassUuid}`);
            }

            const res_relclass = await client.query(relclasses_query, [relclassUuid]);

            if (res_relclass.rowCount == 1) {
                const cl = res_relclass.rows.pop();
                newRelClass = RelationclassInstance.fromJS(cl) as RelationclassInstance;

                const attributes = await Instance_attribute_connection.getAllByParentUuid(
                    client,
                    cl.uuid,
                    userUuid
                );
                if (Array.isArray(attributes)) newRelClass.set_attribute_instances(attributes);

                const roleFrom = await Instance_role_connection.getByUuid(
                    client,
                    cl.uuid_role_instance_from,
                    userUuid
                );
                if (roleFrom instanceof RoleInstance) newRelClass.set_role_instance_from(roleFrom);

                const roleTo = await Instance_role_connection.getByUuid(
                    client,
                    cl.uuid_role_instance_to,
                    userUuid
                );
                if (roleTo instanceof RoleInstance) newRelClass.set_role_instance_to(roleTo);
            }

            return newRelClass;
        } catch (err) {
            throw new Error(
                `Error getting the relationclass ${relclassUuid}: ${err}`
            );
        }
    }

    /**
     * @description - This function get all the relationclass instances of a parent instance by its uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} uuidParent - The uuid of the parent instance of the relationclass instance to get.
     * @param {UUID} userUuid - The uuid of the user that wants to get the relationclass instances.
     * @returns {Promise<RelationclassInstance[]>} - The array of relationclass instances if it exists, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error getting the relationclass.
     * @memberof Instance_relationclass_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async getAllByParentUuid(
        client: PoolClient,
        uuidParent: UUID,
        userUuid?: UUID
    ): Promise<RelationclassInstance[] | BaseError> {
        const classes_query =
            "select ri.uuid_class_instance from scene_instance si, relationclass_instance ri , assigned_to_scene ats where ats.uuid_class_instance = ri.uuid_class_instance and ats.uuid_scene_instance = si.uuid_instance_object and si.uuid_instance_object =$1 ";

        const returnRelClasses = new Array<RelationclassInstance>();
        try {
            const res_relclasses = await client.query(classes_query, [uuidParent]);
            for (const cl of res_relclasses.rows) {
                const newRelClass = await this.getByUuid(
                    client,
                    cl.uuid_class_instance,
                    userUuid
                );
                if (newRelClass instanceof RelationclassInstance) returnRelClasses.push(newRelClass);

            }
            return returnRelClasses;
        } catch (err) {
            throw new Error(
                `Error getting the relationclasses for the parent ${uuidParent}: ${err}`
            );
        }
    }

    /**
     * @description - This function create a new relationclass instance.
     * @param {PoolClient} client - The client to the database.
     * @param {RelationclassInstance} newRelationclass - The relationclass instance to create.
     * @param {UUID} userUuid - The uuid of the user that wants to create the relationclass instance.
     * @returns {Promise<RelationclassInstance | undefined>} - The relationclass instance created, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error creating the relationclass.
     * @memberof Instance_relationclass_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async create(
        client: PoolClient,
        newRelationclass: RelationclassInstance,
        userUuid?: UUID
    ): Promise<RelationclassInstance | undefined | BaseError> {
        try {

            const query_create_relationClass =
                "insert into relationclass_instance (uuid_class_instance, uuid_role_instance_from,uuid_role_instance_to) values ($1,$2,$3) returning uuid_class_instance ";

            newRelationclass.set_class_instance_uuid(
                newRelationclass.uuid_relationclass
            );
            const created_instanceObject = await Instance_class_connection.create(
                client,
                newRelationclass,
                userUuid
            );

            if (created_instanceObject instanceof BaseError) {
                if (created_instanceObject.httpCode === 403) {
                    return new HTTP403NORIGHT(`The user ${userUuid} has no right to create the relationclass`);
                }
                return created_instanceObject;
            }
            if (!created_instanceObject) return undefined;


            const addedRoleFrom = await Instance_role_connection.postRolesInstance(
                client,
                newRelationclass.get_role_instance_from(),
                userUuid
            );
            const addedRoleTo = await Instance_role_connection.postRolesInstance(
                client,
                newRelationclass.get_role_instance_to(),
                userUuid
            );
            if (Array.isArray(addedRoleFrom) && Array.isArray(addedRoleTo)) {
                await client.query(query_create_relationClass, [
                    created_instanceObject.get_uuid(),
                    newRelationclass.get_role_instance_from().get_uuid(),
                    newRelationclass.get_role_instance_to().get_uuid(),
                ]);
                // otherwise the role can't be created with reference with not already created relationclass
                await Instance_role_connection.update(
                    client,
                    newRelationclass.get_role_instance_from().get_uuid(),
                    newRelationclass.get_role_instance_from()
                );
                await Instance_role_connection.update(
                    client,
                    newRelationclass.get_role_instance_to().get_uuid(),
                    newRelationclass.get_role_instance_to()
                );
            }


            await this.update(
                client,
                created_instanceObject.get_uuid(),
                newRelationclass
            );

            return await this.getByUuid(
                client,
                created_instanceObject.get_uuid(),
                userUuid
            );

        } catch (err) {
            throw new Error(`Error creating the relationclass: ${err}`);
        }
    }

    /**
     * @description - This function update a relationclass instance.
     * @param {PoolClient} client - The client to the database.
     * @param {RelationclassInstance} newRelClass - The relationclass instance to update.
     * @param {UUID} relclassUuidToUpdate - The uuid of the relationclass instance to update.
     * @param {UUID} userUuid - The uuid of the user that wants to update the relationclass instance.
     * @returns {Promise<RelationclassInstance | undefined>} - The relationclass instance updated, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error updating the relationclass.
     * @memberof Instance_relationclass_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async update(
        client: PoolClient,
        relclassUuidToUpdate: UUID,
        newRelClass: RelationclassInstance,
        userUuid?: UUID
    ): Promise<RelationclassInstance | undefined | BaseError> {
        const query_update_relationclass =
            "update relationclass_instance set uuid_role_instance_from=coalesce($2,uuid_role_instance_from),uuid_role_instance_to=coalesce($3,uuid_role_instance_to), line_points=coalesce($4,line_points) where uuid_class_instance = $1 ";

        try {
            const updated_obj = await Instance_class_connection.update(
                client,
                relclassUuidToUpdate,
                newRelClass,
                userUuid
            );

            if (updated_obj instanceof BaseError) {
                if (updated_obj.httpCode === 403) {
                    return new HTTP403NORIGHT(`The user ${userUuid} has no right to update the relationclass instance ${relclassUuidToUpdate}`);
                }
                return updated_obj;
            }
            if (!updated_obj) return undefined;

            await client.query(query_update_relationclass, [
                relclassUuidToUpdate,
                newRelClass.get_role_instance_from().get_uuid(),
                newRelClass.get_role_instance_to().get_uuid(),
                newRelClass.get_line_points(),
            ]);
            return await this.getByUuid(client, relclassUuidToUpdate);
        } catch (err) {
            throw new Error(
                `Error updating the relationclass ${relclassUuidToUpdate}: ${err}`
            );
        }
    }

    /**
     * @description - This function create and link a relationclass instance to a parent.
     * @param {PoolClient} client - The client to the database.
     * @param {RelationclassInstance[] | RelationclassInstance} newRelClass - The relationclass instance or array of relationclass instances to create.
     * @param {UUID} uuidParent - The uuid of the parent to link the relationclass instance to.
     * @param {UUID} userUuid - The uuid of the user that wants to create the relationclass instance.
     * @returns {Promise<RelationclassInstance[] | undefined>} - The relationclass instance created, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error creating the relationclass instance.
     * @memberof Instance_relationclass_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async postRelationClassInstance(
        client: PoolClient,
        newRelClass: RelationclassInstance[] | RelationclassInstance,
        uuidParent?: UUID,
        userUuid?: UUID
    ): Promise<RelationclassInstance[] | undefined | BaseError> {
        try {
            const query_connect_relclass_scenetype =
                "insert into assigned_to_scene (uuid_class_instance, uuid_scene_instance) values ($1,$2) ";
            const returnRelClass: Array<RelationclassInstance> = [];

            if (!Array.isArray(newRelClass)) newRelClass = [newRelClass];

            for (const relclassToAdd of newRelClass) {
                let currentRelClass = await this.create(client, relclassToAdd, userUuid);

                if (uuidParent) {
                    if (currentRelClass instanceof RelationclassInstance) {
                        await client.query(query_connect_relclass_scenetype, [
                            currentRelClass.get_uuid(),
                            uuidParent,
                        ]);
                    } else {
                        await client.query(query_connect_relclass_scenetype, [
                            relclassToAdd.get_uuid(),
                            uuidParent,
                        ]);
                        currentRelClass = await this.getByUuid(
                            client,
                            relclassToAdd.get_uuid()
                        );
                    }
                }
                if (currentRelClass instanceof RelationclassInstance) {
                    returnRelClass.push(currentRelClass);
                }
            }
            return returnRelClass;
        } catch (err) {
            throw new Error(`Error creating the relationclass: ${err}`);
        }
    }

    /**
     * @description - This function delete relationclass instances by uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} uuidToDelete - The uuid of the parent.
     * @param {UUID} userUuid - The uuid of the user that wants to delete the relationclass instance.
     * @returns {Promise<UUID[] | undefined>} - The array of uuid of all the objects deleted, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error deleting the relationclass instance.
     * @memberof Instance_relationclass_connection
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
            throw new Error(`Error deleting relationclass ${uuidToDelete}: ${err}`);
        }
    }

    /**
     * @description - This function delete relationclass instances by the parent's uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} parentUuid - The uuid of the parent.
     * @param {UUID} userUuid - The uuid of the user that wants to delete the relationclass instance.
     * @returns {Promise<UUID[] | undefined>} - The array of uuid of all the objects deleted, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error deleting the relationclass instance.
     * @memberof Instance_relationclass_connection
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
            const portInstances = await this.getAllByParentUuid(client, parentUuid, userUuid);
            if (portInstances instanceof BaseError) return portInstances;

            return await Instance_objects_connection.deleteCollectionObject(
                client,
                portInstances,
                userUuid
            );
        } catch (err) {
            throw new Error(
                `Error deleting the relationclass for the parent ${parentUuid}: ${err}`
            );
        }
    }

    /**
     * @description - This function return relationclass instances given a role from or a role to.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} roleUuidToTest - The uuid of the role to check.
     * @param {UUID} userUuid - The uuid of the user that wants to get the relationclass instance.
     * @returns {Promise<RelationclassInstance | undefined>} - The relationclass instances, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error getting the relationclass instance.
     * @memberof Instance_relationclass_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async getRelationclassIfRoleFromOrTo(
        client: PoolClient,
        roleUuidToTest: UUID,
        userUuid?: UUID
    ): Promise<RelationclassInstance | undefined | BaseError> {
        try {

            const query_get_relationclass_if_role_from_or_to =
                "select * from relationclass_instance where uuid_role_instance_from = $1 or uuid_role_instance_to = $1 ";

            const result = await client.query(
                query_get_relationclass_if_role_from_or_to,
                [roleUuidToTest]
            );
            if (result.rows.length > 0) {
                return this.getByUuid(
                    client,
                    result.rows[0].uuid_class_instance,
                    userUuid
                );
            }
            return undefined;

        } catch (err) {
            throw new Error(
                `Error getting the relationclass related to the role ${roleUuidToTest}: ${err}`
            );
        }
    }
}

export default new Instance_relationclassesConnection();
