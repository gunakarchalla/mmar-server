import {ClassInstance, UUID,} from "../../../mmar-global-data-structure";
import {PoolClient} from "pg";
import {queries} from "../..";
import {CRUD} from "../common/crud.interface";
import Instance_port_connection from "./Instance_ports.connection";
import Instance_attribute_connection from "./Instance_attributes.connection";
import Instance_objects_connection from "./Instance_objects.connection";
import Metamodel_classesConnection from "../meta/Metamodel_classes.connection";
import {
    BaseError,
    HTTP403NORIGHT,
    HTTP404Error
} from "../services/middleware/error_handling/standard_errors.middleware";

/**
 * @description - This is the class that handles the CRUD operations for the Class Instances.
 * @export - The class is exported so that it can be used by other files.
 * @class Instance_classesConnection
 * @implements {CRUD}
 */
class Instance_classesConnection implements CRUD {
    /**
     * @description - This function get a class instance by its uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} instanceClassUuid - The uuid of the class instance to get.
     * @param {UUID} userUuid - The uuid of the user that want to get the class instance.
     * @returns {Promise<ClassInstance | undefined>} - The class instance if it exists, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error getting the class instance.
     * @memberof Instance_class_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async getByUuid(
        client: PoolClient,
        instanceClassUuid: UUID,
        userUuid?: UUID
    ): Promise<ClassInstance | undefined | BaseError> {
        try {
            const classes_query = queries.getQuery_get("instance_classe_query");
            let returnClass;


            if (userUuid) {
                const read_check = queries.getQuery_get("read_check");
                const res = await client.query(read_check, [instanceClassUuid, userUuid]);
                if (res.rowCount == 0) {
                    return new HTTP403NORIGHT(`The user ${userUuid} has no right to read the class instance ${instanceClassUuid}`);
                }
            }


            const res_classes = await client.query(classes_query, [instanceClassUuid]);

            if (res_classes.rowCount == 1) {
                returnClass = ClassInstance.fromJS(
                    res_classes.rows.pop()
                ) as ClassInstance;

                const classes =

                    await Instance_attribute_connection.getAllByParentUuid(
                        client,
                        returnClass.get_uuid(),
                        userUuid
                    );
                if (Array.isArray(classes)) returnClass.set_attribute_instances(classes);

                const ports = await Instance_port_connection.getAllByParentUuid(
                    client,
                    returnClass.get_uuid(),
                    userUuid
                );
                if (Array.isArray(ports)) returnClass.set_port_instances(ports);
            }
            return returnClass;
        } catch (err) {
            throw new Error(`Error getting the class ${instanceClassUuid}: ${err}`);
        }
    }

    /**
     * @description - This function get all the class instances of a parent instance by its uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} parentUUID - The uuid of the parent instance of the class instance to get.
     * @param {UUID} userUuid - The uuid of the user that want to get the class instance.
     * @returns {Promise<ClassInstance[]>} - The array of class instances if it exists, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error getting the class instance.
     * @memberof Instance_class_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async getAllByParentUuid(
        client: PoolClient,
        parentUUID: UUID,
        userUuid?: UUID
    ): Promise<ClassInstance[] | BaseError> {
        try {
            const classes_query = queries.getQuery_get(
                "instance_classes_for_scene_instance_query"
            );
            const returnClasses: ClassInstance[] = new Array<ClassInstance>();
            const res_classes = await client.query(classes_query, [parentUUID]);
            for (const cl of res_classes.rows) {
                const newClass = await this.getByUuid(
                    client,
                    cl.uuid_instance_object,
                    userUuid
                );
                if (newClass instanceof ClassInstance) returnClasses.push(newClass);

            }
            return returnClasses;
        } catch (err) {
            throw new Error(
                `Error getting the classes for the parent ${parentUUID}: ${err}`
            );
        }
    }

    /**
     * @description - This function create a new class instance.
     * @param {PoolClient} client - The client to the database.
     * @param {ClassInstance} newClass - The class instance to create.
     * @param {UUID} userUuid - The uuid of the user that want to create the class instance.
     * @returns {Promise<ClassInstance | undefined>} - The class instance created, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error creating the class instance.
     * @memberof Instance_class_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async create(
        client: PoolClient,
        newClass: ClassInstance,
        userUuid?: UUID
    ): Promise<ClassInstance | undefined | BaseError> {
        try {
            const class_uuid = newClass.get_class_uuid();

            const query_create_instanceClass = queries.getQuery_post(
                "create_class_instance"
            );
            const [created_instanceObject, class_exists] = await Promise.all([
                Instance_objects_connection.create(client, newClass, userUuid),
                Metamodel_classesConnection.getByUuid(client, class_uuid),
            ]);


            if (created_instanceObject instanceof BaseError) {
                if (created_instanceObject.httpCode === 403) {
                    return new HTTP403NORIGHT(`The user ${userUuid} has no right to create the class instance`);
                }
                return created_instanceObject;
            }
            if (!created_instanceObject) return undefined;


            if (!class_exists) throw new HTTP404Error(`The class ${class_uuid} does not exist`);


            await client.query(query_create_instanceClass, [created_instanceObject.get_uuid(), class_uuid]);

            await Instance_attribute_connection.postByParentUuid(
                client,
                created_instanceObject.get_uuid(),
                newClass.get_attribute_instances(),
                userUuid
            );
            await Instance_port_connection.postPortsInstance(
                client,
                newClass.get_port_instances(),
                userUuid
            );

            await this.update(client, created_instanceObject.get_uuid(), newClass);

            return await this.getByUuid(client, created_instanceObject.get_uuid(), userUuid);
        } catch (err) {
            throw new Error(`Error creating the class: ${err}`);
        }
    }

    /**
     * @description - This function update a class instance.
     * @param {PoolClient} client - The client to the database.
     * @param {ClassInstance} classToUpdate - The class instance to update.
     * @param {UUID} classUuidToUpdate - The uuid of the class instance to update.
     * @param {UUID} userUuid - The uuid of the user that want to update the class instance.
     * @returns {Promise<ClassInstance | undefined>} - The class instance updated, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error updating the class instance.
     * @memberof Instance_class_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async update(
        client: PoolClient,
        classUuidToUpdate: UUID,
        classToUpdate: ClassInstance,
        userUuid?: UUID
    ): Promise<ClassInstance | undefined | BaseError> {
        try {
            const query_update_class = queries.getQuery_post("update_class_instance");
            const updated_obj = await Instance_objects_connection.update(
                client,
                classUuidToUpdate,
                classToUpdate,
                userUuid
            );

            if (updated_obj instanceof BaseError) {
                if (updated_obj.httpCode === 403) {
                    return new HTTP403NORIGHT(`The user ${userUuid} has no right to update the class instance ${classUuidToUpdate}`);
                }
                return updated_obj;
            }
            if (!updated_obj) return undefined;


            await client.query(query_update_class, [
                classUuidToUpdate,
                classToUpdate.uuid_relationclass,
                classToUpdate.uuid_decomposable_class,
                classToUpdate.uuid_aggregator_class,
                classToUpdate.uuid_relationclass_bendpoint,
            ]);

            const current_class = ClassInstance.fromJS(
                await this.getByUuid(client, classUuidToUpdate)
            ) as ClassInstance;

            const attribute_difference = current_class.get_attribute_instance_difference(classToUpdate.get_attribute_instances())
            const port_difference = current_class.get_port_instance_difference(classToUpdate.get_port_instances())

            await Instance_attribute_connection.postByParentUuid(
                client,
                classUuidToUpdate,
                attribute_difference.added,
                userUuid
            );


            for (const attribute of attribute_difference.modified) {
                await Instance_attribute_connection.update(
                    client,
                    attribute.get_uuid(),
                    attribute,
                    userUuid
                );
            }

            for (const port of port_difference.added) {
                await Instance_port_connection.create(
                    client,
                    port,
                    userUuid
                );
            }

            for (const port of port_difference.modified) {
                await Instance_port_connection.update(
                    client,
                    port.get_uuid(),
                    port,
                    userUuid
                );
            }

            return await this.getByUuid(client, classUuidToUpdate, userUuid);
        } catch (err) {
            throw new Error(`Error updating the class ${classUuidToUpdate}: ${err}`);
        }
    }

    async hardUpdate(
        client: PoolClient,
        classUuidToUpdate: UUID,
        classToUpdate: ClassInstance,
        userUuid?: UUID
    ): Promise<ClassInstance | undefined | BaseError> {
        try {

            const updated_obj = await this.update(client, classUuidToUpdate, classToUpdate, userUuid);

            if (updated_obj instanceof BaseError) {
                if (updated_obj.httpCode === 403) {
                    return new HTTP403NORIGHT(`The user ${userUuid} has no right to hard update the class instance  ${classUuidToUpdate}`);
                }
                return updated_obj;
            }
            if (!updated_obj) return undefined;

            const current_class = ClassInstance.fromJS(
                await this.getByUuid(client, classUuidToUpdate)
            ) as ClassInstance;
            const attribute_difference = current_class.get_attribute_instance_difference(classToUpdate.get_attribute_instances())
            const port_difference = current_class.get_port_instance_difference(classToUpdate.get_port_instances())

            for (const attribute of attribute_difference.removed) {
                await Instance_attribute_connection.deleteByUuid(
                    client,
                    attribute.get_uuid(),
                    userUuid
                );
            }

            for (const port of port_difference.removed) {
                await Instance_port_connection.deleteByUuid(
                    client,
                    port.get_uuid(),
                    userUuid
                );
            }

            return await this.getByUuid(client, classUuidToUpdate, userUuid);

        } catch (err) {
            throw new Error(`Error hard updating the class ${classUuidToUpdate}: ${err}`);
        }
    }

    /**
     * @description - This function create and link a class instance to a scene instance.
     * @param {PoolClient} client - The client to the database.
     * @param {ClassInstance[] | ClassInstance} newClasses - The class instance or array of class instances to create.
     * @param {UUID} sceneInstanceUUID - The uuid of the scene instance for the classes to be created into.
     * @param {UUID} userUuid - The uuid of the user that want to create the class instance.
     * @returns {Promise<ClassInstance[] | undefined>} - The class instance created, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error creating the class instance.
     * @memberof Instance_class_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async postClassInstances(
        client: PoolClient,
        newClasses: ClassInstance[] | ClassInstance,
        sceneInstanceUUID?: UUID,
        userUuid?: UUID
    ): Promise<ClassInstance[] | undefined | BaseError> {
        try {
            const returnClass = new Array<ClassInstance>();

            if (!Array.isArray(newClasses)) newClasses = [newClasses];

            for (const currentClass of newClasses) {
                const createdClass = await this.create(client, currentClass, userUuid);
                if (createdClass instanceof ClassInstance) {
                    if (sceneInstanceUUID) {
                        await client.query(
                            `
                                INSERT INTO assigned_to_scene (uuid_class_instance, uuid_scene_instance)
                                VALUES ($1, $2);`,
                            [createdClass.get_uuid(), sceneInstanceUUID]
                        );
                    }
                    returnClass.push(createdClass as ClassInstance);
                }
            }
            return returnClass;
        } catch (err) {
            throw new Error(`Error creating the classe(s): ${err}`);
        }
    }

    /**
     * @description - This function delete class instances by uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} uuidToDelete - The uuid of the class to delete.
     * @param {UUID} userUuid - The uuid of the user that want to delete the class instance.
     * @returns {Promise<UUID[] | undefined>} - The array of uuid of all the objects deleted, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error deleting the class instance.
     * @memberof Instance_class_connection
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
            throw new Error(`Error deleting the class ${uuidToDelete}: ${err}`);
        }
    }

    /**
     * @description - This function delete class instances by the parent's uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} parentUuid - The uuid of the parent.
     * @param {UUID} userUuid - The uuid of the user that want to delete the class instance.
     * @returns {Promise<UUID[] | undefined>} - The array of uuid of all the objects deleted, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error deleting the class instance.
     * @memberof Instance_class_connection
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
            const classesInstances = await this.getAllByParentUuid(
                client,
                parentUuid,
                userUuid
            );
            if (classesInstances instanceof BaseError) return classesInstances;

            return await Instance_objects_connection.deleteCollectionObject(
                client,
                classesInstances,
                userUuid
            );
        } catch (err) {
            throw new Error(
                `Error deleting classes for the parent ${parentUuid}: ${err}`
            );
        }
    }
}

export default new Instance_classesConnection();
