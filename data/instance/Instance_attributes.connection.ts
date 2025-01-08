import {PoolClient} from "pg";
import {AttributeInstance, RoleInstance, UUID,} from "../../../mmar-global-data-structure";
import {queries} from "../../index";
import {CRUD} from "../common/crud.interface";
import Instance_objects_connection from "./Instance_objects.connection";
import Metamodel_common_functions from "../meta/Metamodel_common_functions.connection";
import instance_rolesConnection from "./Instance_roles.connection";
import Instance_rolesConnection from "./Instance_roles.connection";
import {BaseError, HTTP403NORIGHT} from "../services/middleware/error_handling/standard_errors.middleware";

/**
 * @description - This is the class that handles the CRUD operations for the AttributeInstances.
 * @export - The class is exported so that it can be used by other files.
 * @class Instance_attributesConnection
 * @implements {CRUD}
 */
class Instance_attributesConnection implements CRUD {
    /**
     * @description - This function get an attribute instance by its uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} attributeUuid - The uuid of the attribute instance to get.
     * @param {UUID} userUuid - The uuid of the user that wants to get the attribute instance.
     * @returns {Promise<AttributeInstance | undefined>} - The attribute instance if it exists, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error getting the attribute instance.
     * @memberof Instance_attribute_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async getByUuid(
        client: PoolClient,
        attributeUuid: UUID,
        userUuid?: UUID
    ): Promise<AttributeInstance | undefined | BaseError> {
        try {
            const attribute_query = queries.getQuery_get("instance_attribute_uuid_query");
            let newAttribute;

            if (userUuid) {
                const read_check = queries.getQuery_get("read_check");
                const res = await client.query(read_check, [attributeUuid, userUuid]);
                if (res.rowCount == 0) {
                    return new HTTP403NORIGHT(`The user ${userUuid} has no right to read the attribute instance ${attributeUuid}`);
                }

            }

            const res_attribute = await client.query(attribute_query, [attributeUuid]);

            // res_attribute.rowcount is 0 if no row is found and at most 1 if an attribute is found, normally impossible to have more than 1 row.
            if (res_attribute.rowCount == 1) {
                // dynamically create the attribute instance
                newAttribute = AttributeInstance.fromJS(
                    // res_attribute.rows[0] is the attribute instance.
                    res_attribute.rows[0]
                ) as AttributeInstance;

                // get the role instance from if it exists
                if (res_attribute.rows[0].role_instance_from !== null) {
                    const uuid_role_instance_from =
                        res_attribute.rows[0].role_instance_from;
                    const role_instance_from = await instance_rolesConnection.getByUuid(
                        client,
                        uuid_role_instance_from,
                        userUuid
                    );
                    if (role_instance_from instanceof RoleInstance) newAttribute.set_role_instance_from(role_instance_from);
                }

                // get the table if the attribute is a table
                const table_query = queries.getQuery_get(
                    "get_attributes_table_from_attribute_uuid"
                );
                const rest_table = await client.query(table_query, [attributeUuid]);
                if (rest_table.rowCount && rest_table.rowCount > 0) {
                    // the attribute is a table
                    for (const cell of rest_table.rows) {
                        const full_attr = await this.getByUuid(
                            client,
                            cell.uuid_instance_object,
                            userUuid
                        );
                        if (full_attr instanceof AttributeInstance) newAttribute.add_table_attributes(full_attr);

                    }
                }
            }
            return newAttribute;
        } catch (err) {
            throw new Error(`Error getting the attribute ${attributeUuid}: ${err}`);
        }
    }

    /**
     * @description - This function get all the attribute instances of a parent instance by its uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} uuidParent - The uuid of the parent instance of the attribute instance to get.
     * @param {UUID} userUuid - The uuid of the user that wants to get the attribute instance.
     * @returns {Promise<AttributeInstance[] | undefined>} - The array of attribute instances if it exists, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error getting the attribute instance.
     * @memberof Instance_attribute_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async getAllByParentUuid(
        client: PoolClient,
        uuidParent: UUID,
        userUuid?: UUID
    ): Promise<AttributeInstance[] | BaseError> {
        try {
            let attr_query: string;
            const returnAttributes = new Array<AttributeInstance>();
            const uuid_type =
                await Metamodel_common_functions.getMetaobjectWithInstanceUuid(
                    client,
                    uuidParent
                );
            // if the meta parent exists
            if (uuid_type !== undefined) {
                // select the right query depending on the type of the parent
                switch (uuid_type.type) {
                    case "scene_type":
                        attr_query = queries.getQuery_get(
                            "instance_attribute_by_scene_uuid_query"
                        );
                        break;
                    case "class":
                        attr_query = queries.getQuery_get(
                            "instance_attribute_by_class_uuid_query"
                        );
                        break;
                    case "relationclass":
                        attr_query = queries.getQuery_get(
                            "instance_attribute_by_class_uuid_query"
                        );
                        break;
                    case "port":
                        attr_query = queries.getQuery_get(
                            "instance_attribute_by_port_uuid_query"
                        );
                        break;
                    default:
                        throw new Error(
                            `Error the uuid ${uuidParent} cannot be a parent for an Attribute`
                        );
                }
                const res_attr = await client.query(attr_query, [uuidParent]);
                // create the array of attribute instances
                for (const cl of res_attr.rows) {
                    const newAttribute = await this.getByUuid(
                        client,
                        cl.uuid_instance_object,
                        userUuid
                    );
                    if (newAttribute instanceof AttributeInstance) returnAttributes.push(newAttribute);

                }
            }
            return returnAttributes;
        } catch (err) {
            throw new Error(
                `Error getting attributes for parent ${uuidParent}: ${err}`
            );
        }
    }

    /**
     * @description - This function create a new attribute instance.
     * @param {PoolClient} client - The client to the database.
     * @param {AttributeInstance} paramAttributeInstance - The attribute instance to create.
     * @param {UUID} userUuid - The uuid of the user that wants to create the attribute instance.
     * @returns {Promise<AttributeInstance | undefined>} - The attribute instance created, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error creating the attribute instance.
     * @memberof Instance_attribute_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async create(
        client: PoolClient,
        paramAttributeInstance: AttributeInstance,
        userUuid?: UUID
    ): Promise<AttributeInstance | undefined | BaseError> {
        try {
            const query_create_attributeInstance = queries.getQuery_post(
                "create_attribute_instance"
            );

            // create the object in the database
            const created_instanceObject = await Instance_objects_connection.create(
                client,
                paramAttributeInstance,
                userUuid
            );


            if (created_instanceObject instanceof BaseError) {
                if (created_instanceObject.httpCode === 403) {
                    return new HTTP403NORIGHT(`The user ${userUuid} has no right to create the attribute instance`);
                }
                return created_instanceObject;
            }
            if (!created_instanceObject) return undefined;


            // the object was created successfully then we create the attribute instance
            await client.query(query_create_attributeInstance, [
                created_instanceObject.get_uuid(),
                paramAttributeInstance.get_uuid_attribute(),
            ]);

            // We update the attribute with the optional values.
            await this.update(
                client,
                created_instanceObject.get_uuid(),
                paramAttributeInstance
            );
            return await this.getByUuid(
                client,
                created_instanceObject.get_uuid(),
                userUuid
            );

        } catch (err) {
            throw new Error(`Error creating the attribute: ${err}`);
        }
    }

    /**
     * @description - This function update an attribute instance.
     * @param {PoolClient} client - The client to the database.
     * @param {AttributeInstance} newAttributeInstance - The attribute instance to update.
     * @param {UUID} attrUuidToUpdate - The uuid of the attribute instance to update.
     * @returns {Promise<AttributeInstance | undefined>} - The attribute instance updated, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error updating the attribute instance.
     * @memberof Instance_attribute_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async update(
        client: PoolClient,
        attrUuidToUpdate: UUID,
        newAttributeInstance: AttributeInstance,
        userUuid?: UUID
    ): Promise<AttributeInstance | undefined | BaseError> {
        try {
            const query_update_attribute = queries.getQuery_post(
                "update_attribute_instance"
            );
            const updated_obj = await Instance_objects_connection.update(
                client,
                attrUuidToUpdate,
                newAttributeInstance,
                userUuid
            );
            if (updated_obj instanceof BaseError) {
                if (updated_obj.httpCode === 403) {
                    return new HTTP403NORIGHT(`The user ${userUuid} has no right to update the attribute instance ${attrUuidToUpdate}`);
                }
                return updated_obj;
            }
            if (!updated_obj) return undefined;


            const roleInstance = newAttributeInstance.get_role_instance_from();
            let returnRoles;
            if (roleInstance) {
                returnRoles = await Instance_rolesConnection.postRolesInstance(client, RoleInstance.fromJS(roleInstance) as RoleInstance, userUuid);
                if (Array.isArray(returnRoles)) {
                    returnRoles = RoleInstance.fromJS(returnRoles[0]) as RoleInstance;
                }
                if (returnRoles instanceof RoleInstance) {
                    returnRoles = returnRoles.get_uuid();
                } else {
                    returnRoles = null;
                }
            }


            await client.query(query_update_attribute, [
                newAttributeInstance.get_is_propagated(),
                newAttributeInstance.get_value(),
                newAttributeInstance.get_assigned_uuid_scene_instance(),
                newAttributeInstance.get_assigned_uuid_class_instance(),
                newAttributeInstance.get_assigned_uuid_port_instance(),
                newAttributeInstance.get_table_attribute_reference(),
                newAttributeInstance.get_table_row(),
                returnRoles,
                attrUuidToUpdate,
            ]);

            const current_attr = AttributeInstance.fromJS(
                await this.getByUuid(client, attrUuidToUpdate)
            ) as AttributeInstance;

            const tableAttrs = newAttributeInstance.get_table_attributes();
            if (tableAttrs && tableAttrs.length > 0) {
                for (const cellToUpdateRaw of tableAttrs) {
                    const cellToUpdate = AttributeInstance.fromJS(
                        cellToUpdateRaw
                    ) as AttributeInstance;
                    cellToUpdate.set_table_attribute_reference(
                        newAttributeInstance.get_uuid()
                    );

                    if (current_attr.find_table_attributes(cellToUpdate.get_uuid())) {
                        await this.update(client, cellToUpdate.get_uuid(), cellToUpdate);
                    } else {
                        await this.create(client, cellToUpdate);
                    }
                }
            }
            return await this.getByUuid(client, attrUuidToUpdate, userUuid);
        } catch (err) {
            throw new Error(
                `Error updating the attribute ${attrUuidToUpdate}: ${err}`
            );
        }
    }


    async hardUpdate(
        client: PoolClient,
        attrUuidToUpdate: UUID,
        newAttributeInstance: AttributeInstance,
        userUuid?: UUID
    ): Promise<AttributeInstance | undefined | BaseError> {
        // The function is the same as update because the attribute instance does not need a hard update.
        return await this.update(client, attrUuidToUpdate, newAttributeInstance, userUuid);
    }

    /**
     * @description - This function create attributes instance.
     * @param {PoolClient} client - The client to the database.
     * @param {AttributeInstance[] | AttributeInstance} attributeparam - The attribute instance or an array of attributes to create.
     * @param {UUID} userUuid - The uuid of the user that wants to create the attribute instance.
     * @returns {Promise<AttributeInstance[] | undefined>} - The array of attribute instance created, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error creating the attribute instance.
     * @memberof Instance_attribute_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async postAttributesInstance(
        client: PoolClient,
        attributeparam: AttributeInstance[] | AttributeInstance,
        userUuid?: UUID
    ): Promise<AttributeInstance[] | undefined | BaseError> {
        try {
            const returnAttributes = new Array<AttributeInstance>();
            if (!Array.isArray(attributeparam)) attributeparam = [attributeparam];

            for (const attrToAdd of attributeparam) {
                const currentAttr = await this.create(client, attrToAdd, userUuid);
                if (currentAttr instanceof AttributeInstance) returnAttributes.push(currentAttr);
            }

            return returnAttributes;
        } catch (err) {
            throw new Error(`Error creating the attributes: ${err}`);
        }
    }

    /**
     * @description - This function create attributes instance for a given parent by uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {AttributeInstance[] | AttributeInstance} newAttribute - The attribute instance or an array of attributes to create.
     * @param {UUID} uuidParent - The uuid of the parent to create the attributes instance for.
     * @param {UUID} userUuid - The uuid of the user that wants to create the attribute instance.
     * @returns {Promise<AttributeInstance[] | undefined>} - The array of attribute instance created, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error creating the attribute instance.
     * @memberof Instance_attribute_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async postByParentUuid(
        client: PoolClient,
        uuidParent: UUID,
        newAttribute: AttributeInstance[] | AttributeInstance,
        userUuid?: UUID
    ): Promise<AttributeInstance[] | undefined | BaseError> {
        try {
            let attr_query;
            let returnAttributes;

            if (!Array.isArray(newAttribute)) newAttribute = [newAttribute];

            // get the meta type of the parent
            const uuid_type =
                await Metamodel_common_functions.getMetaobjectWithInstanceUuid(
                    client,
                    uuidParent
                );
            if (uuid_type !== undefined) {
                switch (uuid_type.type) {
                    case "scene_type":
                        attr_query = queries.getQuery_post(
                            "connect_attribute_instance_to_scene"
                        );
                        break;
                    case "class":
                        attr_query = queries.getQuery_post(
                            "connect_attribute_instance_to_class"
                        );
                        break;
                    case "relationclass":
                        attr_query = queries.getQuery_post(
                            "connect_attribute_instance_to_class"
                        );
                        break;
                    case "port":
                        attr_query = queries.getQuery_post(
                            "connect_attribute_instance_to_port"
                        );
                        break;
                    default:
                        throw new Error(
                            "Error the uuid provided cannot be a parent for a Attribute"
                        );
                }
                returnAttributes = await this.createAttributeForX(
                    client,
                    uuidParent,
                    newAttribute,
                    attr_query,
                    userUuid
                );
            }
            return returnAttributes;
        } catch (err) {
            throw new Error(
                `Error creating the attributes for the parent ${uuidParent}: ${err}`
            );
        }
    }

    /**
     * @description - This function delete attributes instances for a given parent by uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} parentUuid - The uuid of the parent to delete the attributes instance for.
     * @param {UUID} userUuid - The uuid of the user that wants to delete the attribute instance.
     * @returns {Promise<UUID[] | undefined>} - The array of uuid of all the objects deleted, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error deleting the attribute instance.
     * @memberof Instance_attribute_connection
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
            const attributeInstances = await this.getAllByParentUuid(
                client,
                parentUuid,
                userUuid
            );
            if (attributeInstances instanceof BaseError) return attributeInstances;

            return await Instance_objects_connection.deleteCollectionObject(
                client,
                attributeInstances,
                userUuid
            );
        } catch (err) {
            throw new Error(
                `Error deleting the attributes for the parent ${parentUuid}: ${err}`
            );
        }
    }

    /**
     * @description - This function delete attributes instances by uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} uuidToDelete - The uuid of the attribute to delete.
     * @param {UUID} userUuid - The uuid of the user that wants to delete the attribute instance.
     * @returns {Promise<UUID[] | undefined>} - The array of uuid of all the objects deleted, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error deleting the attribute instance.
     * @memberof Instance_attribute_connection
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
            return await Instance_objects_connection.deleteByUuid(
                client,
                uuidToDelete,
                userUuid
            );
        } catch (err) {
            throw new Error(`Error deleting the attribute ${uuidToDelete}: ${err}`);
        }
    }

    /**
     * @description - This function create attributes instances for a parent by it's UUID.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} subItemUUID - The uuid of the attribute to create.
     * @param {AttributeInstance[] | AttributeInstance} newAttribute - The attribute instance or an array of attributes to create.
     * @param {string} query - The query to use to create the attribute instance for different parent.
     * @param {UUID} userUuid - The uuid of the user that wants to create the attribute instance.
     * @returns {Promise<UUID[] | undefined>} - The array of uuid of all the objects deleted, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error creating the attribute instance.
     * @memberof Instance_attribute_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    private async createAttributeForX(
        client: PoolClient,
        subItemUUID: UUID,
        newAttribute: AttributeInstance[] | AttributeInstance,
        query: string,
        userUuid?: UUID
    ): Promise<AttributeInstance[] | undefined | BaseError> {
        try {
            const returnAttributeInstances = new Array<AttributeInstance>();
            let currentAttrInst;

            if (!Array.isArray(newAttribute)) newAttribute = [newAttribute];

            for (const attrToAdd of newAttribute) {
                currentAttrInst = await this.create(client, attrToAdd, userUuid);
                if (currentAttrInst instanceof AttributeInstance) {
                    await client.query(query, [
                        subItemUUID,
                        currentAttrInst.get_uuid(),
                    ]);
                } else {
                    await client.query(query, [subItemUUID, attrToAdd.get_uuid()]);
                    currentAttrInst = await this.getByUuid(
                        client,
                        attrToAdd.get_uuid(),
                        userUuid
                    );
                }
                if (currentAttrInst instanceof AttributeInstance) returnAttributeInstances.push(currentAttrInst);
            }

            return returnAttributeInstances;
        } catch (err) {
            throw new Error(
                `Error creating attributes for the parent ${subItemUUID}: ${err}`
            );
        }
    }
}

export default new Instance_attributesConnection();
