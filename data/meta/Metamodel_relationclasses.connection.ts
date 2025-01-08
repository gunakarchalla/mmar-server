import {Relationclass, Role, UUID,} from "../../../mmar-global-data-structure";
import {PoolClient} from "pg";
import {queries} from "../..";
import {CRUD} from "../common/crud.interface";
import Metamodel_metaobject_connection from "./Metamodel_metaobjects.connection";
import Metamodel_classes_connection from "./Metamodel_classes.connection";
import Metamodel_attributes_connection from "./Metamodel_attributes.connection";
import Metamodel_ports_connection from "./Metamodel_ports.connection";
import Metamodel_roles_connection from "./Metamodel_roles.connection";
import Metamodel_common_functions from "./Metamodel_common_functions.connection";
import {BaseError, HTTP403NORIGHT} from "../services/middleware/error_handling/standard_errors.middleware";

/**
 * @description - This is the class that handles the CRUD operations for the Meta relationclass.
 * @class Metamodel_relationclassesConnection
 * @implements {CRUD}
 * @export - This class is exported so that it can be used by other classes.
 */
class Metamodel_relationclassesConnection implements CRUD {
    async getAll(client: PoolClient, userUuid?: UUID): Promise<Relationclass[] | BaseError> {
        try {
            const relclasses_query =
                "SELECT rc.uuid_class as uuid FROM relationclass rc;";

            const returnRelClasses = new Array<Relationclass>();
            const res_classes = await client.query(relclasses_query);
            for (const rcl of res_classes.rows) {
                const newRelClass = await this.getByUuid(client, rcl.uuid, userUuid);
                if (newRelClass instanceof Relationclass) {
                    // in this case the class is retrieved properly
                    returnRelClasses.push(newRelClass);
                }
            }
            return returnRelClasses;
        } catch (err) {
            throw new Error(`Error getting all the classes: ${err}`);
        }
    }

    /**
     * @description - This function gets a relationclass by its uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} relclassUuid - The uuid of the relationclass to get.
     * @param {UUID} userUuid - The uuid of the user that wants to get the relationclass.
     * @returns {Promise<Relationclass | undefined>} - The relationclass if it exists, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error getting the relationclass.
     * @memberof Metamodel_relationclasses_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export - This function is exported so that it can be used by other classes.
     * @method
     */
    async getByUuid(
        client: PoolClient,
        relclassUuid: UUID,
        userUuid?: UUID
    ): Promise<Relationclass | undefined | BaseError> {
        try {
            const relclasses_query = queries.getQuery_get("relationclass_uuid_query");
            let newRelClass;
            if (userUuid) {
                const read_check = queries.getQuery_get("read_check");
                const res = await client.query(read_check, [relclassUuid, userUuid]);
                if (res.rowCount == 0) {
                    return new HTTP403NORIGHT(`The user ${userUuid} has no right to read the relationclass ${relclassUuid}`);
                }
            }

            const res_class = await client.query(relclasses_query, [relclassUuid]);


            if (res_class.rowCount == 1) {
                newRelClass = Relationclass.fromJS(res_class.rows[0]) as Relationclass;
                const role_from = await Metamodel_roles_connection.getByUuid(
                    client,
                    res_class.rows[0].role_from,
                    userUuid
                );
                if (role_from instanceof Role) newRelClass.set_role_from(role_from);

                const role_to = await Metamodel_roles_connection.getByUuid(
                    client,
                    res_class.rows[0].role_to,
                    userUuid
                );
                if (role_to instanceof Role) newRelClass.set_role_to(role_to);

                const class_bendpoint = await Metamodel_classes_connection.getBendpointsForRelationClass(
                    client,
                    newRelClass.get_uuid(),
                    userUuid
                );
                if (typeof class_bendpoint === "string") newRelClass.set_bendpoint(class_bendpoint);

                const classes = await Metamodel_attributes_connection.getAllByParentUuid(
                    client,
                    newRelClass.get_uuid(),
                    userUuid
                );
                if (Array.isArray(classes)) newRelClass.set_attribute(classes);

                const ports = await Metamodel_ports_connection.getAllByParentUuid(
                    client,
                    newRelClass.get_uuid(),
                    userUuid
                );
                if (Array.isArray(ports)) newRelClass.set_port(ports);
            }

            return newRelClass;
        } catch (err) {
            throw new Error(
                `Error getting the relation class ${relclassUuid}: ${err}`
            );
        }
    }

    /**
     * @description - This function get all the relationclasses of a parent instance by its uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} uuidParent - The uuid of the parent instance of the relationclasses to get.
     * @param {UUID} userUuid - The uuid of the user that wants to get the relationclasses.
     * @returns {Promise<Relationclass[] | undefined>} - The array of relationclasses if it exists, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error getting the relationclass.
     * @memberof Metamodel_relationclasses_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export - This function is exported so that it can be used by other files.
     * @method
     */
    async getAllByParentUuid(
        client: PoolClient,
        uuidParent: UUID,
        userUuid?: UUID
    ): Promise<Relationclass[] | BaseError> {
        try {
            const relClasses_query = queries.getQuery_get("relationclass_query");
            const returnRelClasses = new Array<Relationclass>();

            const res_relclasses = await client.query(relClasses_query, [uuidParent]);
            for (const cl of res_relclasses.rows) {
                const newClass = await this.getByUuid(client, cl.uuid, userUuid);
                if (newClass instanceof Relationclass) returnRelClasses.push(newClass);
            }
            return returnRelClasses;
        } catch (err) {
            throw new Error(
                `Error getting the relation classes for the parent ${uuidParent}: ${err}`
            );
        }
    }

    /**
     * @description - This function create a new relationclass.
     * @param {PoolClient} client - The client to the database.
     * @param {Relationclass} newRelClass - The relationclass to create.
     * @param {UUID} userUuid - The uuid of the user that wants to create the relationclass.
     * @returns {Promise<Relationclass | undefined>} - The relationclass created, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error creating the relationclass.
     * @memberof Metamodel_relationclasses_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export - This function is exported so that it can be used by other files.
     * @method
     */
    async create(
        client: PoolClient,
        newRelClass: Relationclass,
        userUuid?: UUID
    ): Promise<Relationclass | undefined | BaseError> {
        try {
            const query_create_relationClass = queries.getQuery_post(
                "create_relationclass"
            ); // role from, role to, bendpoint uuid, relclass uuid

            const created_class = await Metamodel_classes_connection.create(
                client,
                newRelClass,
                userUuid
            );


            if (created_class instanceof BaseError) {
                if (created_class.httpCode === 403) {
                    return new HTTP403NORIGHT(`The user ${userUuid} has no right to create the relationclass`);
                }
                return created_class;
            }
            if (!created_class) return undefined;


            await Metamodel_roles_connection.postRoles(
                client,
                [newRelClass.get_role_from(), newRelClass.get_role_to()],
                userUuid
            );


            await client.query(query_create_relationClass, [
                created_class.uuid,
                newRelClass.get_role_from().get_uuid(),
                newRelClass.get_role_to().get_uuid(),
                newRelClass.get_bendpoint(),
            ]);
            await this.update(client, created_class.get_uuid(), newRelClass);

            return await this.getByUuid(client, created_class.get_uuid(), userUuid);
        } catch (err) {
            throw new Error(`Error creating the relation class: ${err}`);
        }
    }

    /**
     * @description - This function update a relationclass.
     * @param {PoolClient} client - The client to the database.
     * @param {Relationclass} newRelClass - The attribute to update.
     * @param {UUID} relclassUuidToUpdate - The uuid of the relationclass to update.
     * @param {UUID} userUuid - The uuid of the user that wants to update the relationclass.
     * @returns {Promise<Relationclass | undefined>} - The relationclass updated, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error updating the relationclass.
     * @memberof Metamodel_relationclasses_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export - This function is exported so that it can be used by other files.
     * @method
     */
    async update(
        client: PoolClient,
        relclassUuidToUpdate: UUID,
        newRelClass: Relationclass,
        userUuid?: UUID
    ): Promise<Relationclass | undefined | BaseError> {
        try {
            const query_update_relationclass = queries.getQuery_post(
                "update_relationclass"
            ); //from, to, bendpoint, relationclass uuid

            const updated_metaobj = await Metamodel_classes_connection.update(
                client,
                relclassUuidToUpdate,
                newRelClass,
                userUuid
            );


            if (updated_metaobj instanceof BaseError) {
                if (updated_metaobj.httpCode === 403) {
                    return new HTTP403NORIGHT(`The user ${userUuid} has no right to update the relationclass ${relclassUuidToUpdate}`);
                }
                return updated_metaobj;
            }
            if (!updated_metaobj) return undefined;

            await client.query('UPDATE relationclass set uuid_class_bendpoint = $1 where uuid_class = $2;', [newRelClass.get_bendpoint(), relclassUuidToUpdate]);

            await client.query(query_update_relationclass, [
                newRelClass.get_role_from().get_uuid(),
                newRelClass.get_role_to().get_uuid(),
                newRelClass.get_bendpoint(),
                relclassUuidToUpdate,
            ]);

            // update roles
            await Metamodel_roles_connection.update(
                client,
                newRelClass.get_role_from().get_uuid(),
                newRelClass.get_role_from(),
                userUuid
            );
            await Metamodel_roles_connection.update(
                client,
                newRelClass.get_role_to().get_uuid(),
                newRelClass.get_role_to(),
                userUuid
            );

            return await this.getByUuid(client, relclassUuidToUpdate, userUuid);
        } catch (err) {
            throw new Error(
                `Error updating the relation class ${relclassUuidToUpdate}: ${err}`
            );
        }
    }


    async hardUpdate(
        client: PoolClient,
        relclassUuidToUpdate: UUID,
        newRelClass: Relationclass,
        userUuid?: UUID
    ): Promise<Relationclass | undefined | BaseError> {
        try {
            const updated_metaobj = await this.update(
                client,
                relclassUuidToUpdate,
                newRelClass,
                userUuid
            );

            if (updated_metaobj instanceof BaseError) {
                if (updated_metaobj.httpCode === 403) {
                    return new HTTP403NORIGHT(`The user ${userUuid} has no right to hard update the relationclass ${relclassUuidToUpdate}`);
                }
                return updated_metaobj;
            }
            if (!updated_metaobj) return undefined;

            await Metamodel_classes_connection.hardUpdate(
                client,
                relclassUuidToUpdate,
                newRelClass,
                userUuid
            );

            // update roles
            await Metamodel_roles_connection.hardUpdate(
                client,
                newRelClass.get_role_from().get_uuid(),
                newRelClass.get_role_from(),
                userUuid
            );
            await Metamodel_roles_connection.hardUpdate(
                client,
                newRelClass.get_role_to().get_uuid(),
                newRelClass.get_role_to(),
                userUuid
            );

            return await this.getByUuid(client, relclassUuidToUpdate, userUuid);
        } catch (err) {
            throw new Error(
                `Error updating the relation class ${relclassUuidToUpdate}: ${err}`
            );
        }
    }

    /**
     * @description - This function create relationclass for the parent by the uuid of the scenetype.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} sceneTypeUUID - The uuid of the sceneType.
     * @param {Relationclass[] | Relationclass} newRelClass - The relationclass or an array of attributes to create.
     * @param {UUID} userUuid - The uuid of the user that wants to create the relationclass.
     * @returns {Promise<Relationclass[] | undefined>} - The array of relationclass created, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error creating the relationclass.
     * @memberof Metamodel_relationclasses_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export - This function is exported so that it can be used by other files.
     * @method
     */
    async postRelationClassesForSceneType(
        client: PoolClient,
        sceneTypeUUID: UUID,
        newRelClass: Relationclass[] | Relationclass,
        userUuid?: UUID
    ): Promise<Relationclass[] | undefined | BaseError> {
        try {
            const query_connect_scene_class = queries.getQuery_post(
                "connect_class_scenetype"
            );
            const returnRelationClass = new Array<Relationclass>();

            // ensure newRelClass is always an array
            if (!Array.isArray(newRelClass)) newRelClass = [newRelClass];

            for (const relClassToAdd of newRelClass) {
                const currentRelClass = await this.create(client, relClassToAdd, userUuid);

                if (currentRelClass instanceof Relationclass) {
                    await client.query(query_connect_scene_class, [
                        currentRelClass.get_uuid(),
                        sceneTypeUUID,
                    ]);
                    returnRelationClass.push(currentRelClass);
                } else {
                    const existingRelClass = await this.getByUuid(client, relClassToAdd.get_uuid(), userUuid);
                    if (existingRelClass instanceof Relationclass) {
                        await client.query(query_connect_scene_class, [
                            existingRelClass.get_uuid(),
                            sceneTypeUUID,
                        ]);
                        returnRelationClass.push(existingRelClass);
                    }
                }
            }
            return returnRelationClass;
        } catch (err) {
            throw new Error(
                `Error creating the relationclass for the scene type ${sceneTypeUUID}: ${err}`
            );
        }
    }

    /**
     * @description - This function delete relationclass for a given parent by uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} uuidParent - The uuid of the parent to delete the relationclass for.
     * @param {UUID} userUuid - The uuid of the user that wants to delete the relationclass.
     * @returns {Promise<UUID[] | undefined>} - The array of uuid of all the objects deleted, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error deleting the relationclass.
     * @memberof Metamodel_relationclasses_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async deleteAllByParentUuid(
        client: PoolClient,
        uuidParent: UUID,
        userUuid?: UUID
    ): Promise<UUID[] | undefined | BaseError> {
        try {
            const delete_classes_for_scene_query = queries.getQuery_delete(
                "delete_relationclasses_for_scene"
            );

            return await Metamodel_common_functions.deleteAllItems(
                client,
                delete_classes_for_scene_query,
                uuidParent,
                userUuid
            );
        } catch (err) {
            throw new Error(
                `Error deleting the relationclasses for the parent ${uuidParent}: ${err}`
            );
        }
    }

    /**
     * @description - This function delete relationclass by uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} uuidToDelete - The uuid of the relationclass to delete.
     * @param {UUID} userUuid - The uuid of the user that wants to delete the relationclass.
     * @returns {Promise<UUID[] | undefined>} - The array of uuid of all the objects deleted, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error deleting the attribute.
     * @memberof Metamodel_relationclasses_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export - This function is exported so that it can be used by other files.
     * @method
     */
    async deleteByUuid(
        client: PoolClient,
        uuidToDelete: UUID,
        userUuid?: UUID
    ): Promise<UUID[] | undefined | BaseError> {
        return await Metamodel_metaobject_connection.deleteByUuid(
            client,
            uuidToDelete,
            userUuid
        );
    }
}

export default new Metamodel_relationclassesConnection();
