import {PoolClient} from "pg";
import {PortInstance, UUID} from "../../../mmar-global-data-structure";
import {queries} from "../../index";
import {CRUD} from "../common/crud.interface";
import Instance_objects_connection from "./Instance_objects.connection";
import Metamodel_common_functions from "../meta/Metamodel_common_functions.connection";
import Instance_attribute_connection from "./Instance_attributes.connection";
import {BaseError, HTTP403NORIGHT} from "../services/middleware/error_handling/standard_errors.middleware";

/**
 * @description - This is the class that handles the CRUD operations for the Port Instances.
 * @export - The class is exported so that it can be used by other files.
 * @class Instance_portsConnection
 * @implements {CRUD}
 */
class Instance_portsConnection implements CRUD {
    /**
     * @description - This function gets a port instance by its uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} portUuid - The uuid of the port instance to get.
     * @param {UUID} userUuid - The uuid of the user that wants to get the port instance.
     * @returns {Promise<PortInstance | undefined>} - The port instance if it exists, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error getting the port.
     * @memberof Instance_port_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     *
     */
    async getByUuid(
        client: PoolClient,
        portUuid: UUID,
        userUuid?: UUID
    ): Promise<PortInstance | undefined | BaseError> {
        try {

            const ports_query = queries.getQuery_get("instance_port_uuid_query");
            let newPort;

            if (userUuid) {
                const read_check = queries.getQuery_get("read_check");
                const res = await client.query(read_check, [portUuid, userUuid]);
                if (res.rowCount == 0) {
                    return new HTTP403NORIGHT(`The user ${userUuid} has no right to read the port instance ${portUuid}`);

                }
            }
            const res_port = await client.query(ports_query, [portUuid]);

            if (res_port.rowCount == 1) {
                newPort = PortInstance.fromJS(res_port.rows[0]) as PortInstance;

                const attributes = await Instance_attribute_connection.getAllByParentUuid(
                    client,
                    newPort.get_uuid(),
                    userUuid
                );
                if (Array.isArray(attributes)) newPort.set_attribute_instance(attributes);
            }
            return newPort;
        } catch (err) {
            throw new Error(`Error getting the port ${portUuid}: ${err}`);
        }
    }

    /**
     * @description - This function get all the ports instances of a parent instance by its uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} uuidParent - The uuid of the parent instance of the ports instance to get.
     * @param {UUID} userUuid - The uuid of the user that wants to get the ports instance.
     * @returns {Promise<PortInstance[]>} - The array of ports instances if it exists, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error getting the ports.
     * @memberof Instance_port_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async getAllByParentUuid(
        client: PoolClient,
        uuidParent: UUID,
        userUuid?: UUID
    ): Promise<PortInstance[] | BaseError> {
        let port_query: string;
        const returnPorts = new Array<PortInstance>();
        try {
            const uuid_type =
                await Metamodel_common_functions.getMetaobjectWithInstanceUuid(
                    client,
                    uuidParent
                );

            if (uuid_type) {
                switch (uuid_type.type) {
                    case "scene_type":
                        port_query = queries.getQuery_get(
                            "instance_port_for_scene_instance_query"
                        );
                        break;
                    case "class":
                        port_query = queries.getQuery_get(
                            "instance_port_by_class_uuid_query"
                        );
                        break;
                    case "relationclass":
                        port_query = queries.getQuery_get(
                            "instance_port_by_class_uuid_query"
                        );
                        break;
                    default:
                        throw new Error(
                            `Error the uuid ${uuidParent} cannot be a parent for a port`
                        );
                }
                const res_port = await client.query(port_query, [uuidParent]);
                for (const cl of res_port.rows) {
                    const newPort = await this.getByUuid(
                        client,
                        cl.uuid_instance_object,
                        userUuid
                    );
                    if (newPort instanceof PortInstance) returnPorts.push(newPort);

                }
            }
            return returnPorts;
        } catch (err) {
            throw new Error(`Error getting ports for parent ${uuidParent}: ${err}`);
        }
    }

    /**
     * @description - This function create a new port instance.
     * @param {PoolClient} client - The client to the database.
     * @param {PortInstance} newPort - The port instance to create.
     * @param {UUID} userUuid - The uuid of the user that wants to create the port instance.
     * @returns {Promise<PortInstance | undefined>} - The port instance created, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error creating the port.
     * @memberof Instance_port_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async create(
        client: PoolClient,
        newPort: PortInstance,
        userUuid?: UUID
    ): Promise<PortInstance | undefined | BaseError> {
        const query_create_port = queries.getQuery_post("create_port_instance");
        try {
            const created_instanceObject = await Instance_objects_connection.create(
                client,
                newPort,
                userUuid
            );


            if (created_instanceObject instanceof BaseError) {
                if (created_instanceObject.httpCode === 403) {
                    return new HTTP403NORIGHT(`The user ${userUuid} has no right to create the port instance`);
                }
                return created_instanceObject;
            }
            if (!created_instanceObject) return undefined;


            await client.query(query_create_port, [
                created_instanceObject.get_uuid(),
                newPort.get_uuid_port(),
            ]);
            await this.update(client, created_instanceObject.get_uuid(), newPort);
            return await this.getByUuid(
                client,
                created_instanceObject.get_uuid()
            );

        } catch (err) {
            throw new Error(`Error creating the port: ${err}`);
        }
    }

    /**
     * @description - This function update a port instance.
     * @param {PoolClient} client - The client to the database.
     * @param {PortInstance} portToUpdate - The port instance to update.
     * @param {UUID} portUuid - The uuid of the port instance to update.
     * @param {UUID} userUuid - The uuid of the user that wants to update the port instance.
     * @returns {Promise<PortInstance | undefined>} - The port instance updated, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error updating the port.
     * @memberof Instance_port_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async update(
        client: PoolClient,
        portUuid: UUID,
        portToUpdate: PortInstance,
        userUuid?: UUID
    ): Promise<PortInstance | undefined | BaseError> {
        try {
            const query_update_port = queries.getQuery_post("update_port_instance");

            // update the instance object
            const updated_obj = await Instance_objects_connection.update(
                client,
                portUuid,
                portToUpdate,
                userUuid
            );

            if (updated_obj instanceof BaseError) {
                if (updated_obj.httpCode === 403) {
                    return new HTTP403NORIGHT(`The user ${userUuid} has no right to update the port instance ${portUuid}`);
                }
                return updated_obj;
            }
            if (!updated_obj) return undefined;


            // update the relations of the port
            await client.query(query_update_port, [
                portToUpdate.get_uuid_class_instance(),
                portToUpdate.get_uuid_scene_instance(),
                portUuid,
            ]);

            const current_port = PortInstance.fromJS(await this.getByUuid(client, portUuid)) as PortInstance;

            const attribute_difference = current_port.get_attribute_instance_difference(portToUpdate.get_attribute_instances());

            await Instance_attribute_connection.postByParentUuid(client, portUuid, attribute_difference.added, userUuid)

            for (const att of attribute_difference.modified) {
                await Instance_attribute_connection.update(client, att.get_uuid(), att, userUuid);
            }

            return await this.getByUuid(client, portUuid);
        } catch (err) {
            throw new Error(`Error updating the port ${portUuid}: ${err}`);
        }
    }

    async hardUpdate(
        client: PoolClient,
        portUuid: UUID,
        portToUpdate: PortInstance,
        userUuid?: UUID
    ): Promise<PortInstance | undefined | BaseError> {
        try {
            const updated_obj = await this.update(client, portUuid, portToUpdate, userUuid);
            if (updated_obj instanceof BaseError) {
                if (updated_obj.httpCode === 403) {
                    return new HTTP403NORIGHT(`The user ${userUuid} has no right to hard update the port instance  ${portUuid}`);
                }
                return updated_obj;
            }
            if (!updated_obj) return undefined;

            const current_port = PortInstance.fromJS(await this.getByUuid(client, portUuid)) as PortInstance;


            const attribute_difference = current_port.get_attribute_instance_difference(portToUpdate.get_attribute_instances());

            for (const att of attribute_difference.removed) {
                await Instance_attribute_connection.deleteByUuid(client, att.get_uuid(), userUuid);
            }


            return await this.getByUuid(client, portUuid, userUuid);
        } catch (err) {
            throw new Error(`Error updating the port ${portUuid}: ${err}`);
        }
    }


    /**
     * @description - This function create and link a port instance to a parent.
     * @param {PoolClient} client - The client to the database.
     * @param {PortInstance[] | PortInstance} newPort - The class instance or array of class instances to create.
     * @param {UUID} userUuid - The uuid of the user that wants to create the class instance.
     * @returns {Promise<PortInstance[] | undefined>} - The class instance created, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error creating the class instance.
     * @memberof Instance_port_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async postPortsInstance(
        client: PoolClient,
        newPort: PortInstance[] | PortInstance,
        userUuid?: UUID
    ): Promise<PortInstance[] | undefined | BaseError> {
        try {

            const returnPorts = new Array<PortInstance>();

            if (!Array.isArray(newPort)) newPort = [newPort];

            for (const portToAdd of newPort) {
                const currentPort = await this.create(client, portToAdd, userUuid);
                if (currentPort instanceof PortInstance) returnPorts.push(currentPort);

            }
            return returnPorts;
        } catch (err) {
            throw new Error(`Error creating the ports: ${err}`);
        }
    }

    /**
     * @description - This function delete port instances by uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} uuidToDelete - The uuid of the port to delete.
     * @param {UUID} userUuid - The uuid of the user that wants to delete the port instance.
     * @returns {Promise<UUID[] | undefined>} - The array of uuid of all the objects deleted, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error deleting the port instance.
     * @memberof Instance_port_connection
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
            throw new Error(`Error error deleting the port ${uuidToDelete}: ${err}`);
        }
    }

    /**
     * @description - This function delete port instances by the parent's uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} parentUuid - The uuid of the parent.
     * @param {UUID} userUuid - The uuid of the user that wants to delete the port instance.
     * @returns {Promise<UUID[] | undefined>} - The array of uuid of all the objects deleted, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error deleting the port instance.
     * @memberof Instance_port_connection
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
                `Error deleting the ports for the parent ${parentUuid}: ${err}`
            );
        }
    }
}

export default new Instance_portsConnection();
