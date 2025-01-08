import {PoolClient} from "pg";
import {queries} from "../..";
import {SceneInstance, UUID} from "../../../mmar-global-data-structure";
import {CRUD} from "../common/crud.interface";
import Instance_role_connection from "./Instance_roles.connection";
import Instance_relationclass_connection from "./Instance_relationclasses.connection";
import Instance_port_connection from "./Instance_ports.connection";
import Instance_attribute_connection from "./Instance_attributes.connection";
import Instance_class_connection from "./Instance_classes.connection";
import Instance_objects_connection from "./Instance_objects.connection";
import {BaseError, HTTP403NORIGHT} from "../services/middleware/error_handling/standard_errors.middleware";

/**
 * @description - This is the class that handles the CRUD operations for the Scene Instances.
 * @export - The class is exported so that it can be used by other files.
 * @class Instance_scenesConnection
 * @implements {CRUD}
 */
class Instance_scenesConnection implements CRUD {
    /**
     * @description - This function gets the scene instance by the uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} sceneUuid - The uuid of the scene to get.
     * @param {UUID} userUuid - The uuid of the user that wants to get the scene.
     * @returns {Promise<SceneInstance | undefined>} - The scene instance if it exists, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error getting the scene.
     * @memberof Instance_scene_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async getByUuid(
        client: PoolClient,
        sceneUuid: UUID,
        userUuid?: UUID
    ): Promise<SceneInstance | undefined | BaseError> {
        const scene_query = queries.getQuery_get("instance_scene_query");
        let returnSceneInstance;
        try {
            if (userUuid) {
                const read_check = queries.getQuery_get("read_check");
                const res = await client.query(read_check, [sceneUuid, userUuid]);
                if (res.rowCount == 0) {
                    return new HTTP403NORIGHT(`The user ${userUuid} has no right to read the scene instance ${sceneUuid}`);
                }
            }

            const res_scene = await client.query(scene_query, [sceneUuid]);

            if (res_scene.rowCount == 1) {
                returnSceneInstance = SceneInstance.fromJS(
                    res_scene.rows[0]
                ) as SceneInstance;

                const ports = await Instance_port_connection.getAllByParentUuid(
                    client,
                    returnSceneInstance.get_uuid(),
                    userUuid
                );
                if (Array.isArray(ports)) returnSceneInstance.set_port_instances(ports);

                const attributes = await Instance_attribute_connection.getAllByParentUuid(
                    client,
                    returnSceneInstance.get_uuid(),
                    userUuid
                );
                if (Array.isArray(attributes)) returnSceneInstance.set_attribute_instances(attributes);

                const classes = await Instance_class_connection.getAllByParentUuid(
                    client,
                    returnSceneInstance.get_uuid(),
                    userUuid
                );
                if (Array.isArray(classes)) returnSceneInstance.set_class_instances(classes);

                const roles = await Instance_role_connection.getAllByParentUuid(
                    client,
                    returnSceneInstance.get_uuid(),
                    userUuid
                );
                if (Array.isArray(roles)) returnSceneInstance.set_role_instances(roles);

                const relationClasses = await Instance_relationclass_connection.getAllByParentUuid(
                    client,
                    returnSceneInstance.get_uuid(),
                    userUuid
                );
                if (Array.isArray(relationClasses)) returnSceneInstance.set_relationclass_instances(relationClasses);
            }
            return returnSceneInstance;
        } catch (err) {
            throw new Error(`Error getting the scene ${sceneUuid}: ${err}`);
        }
    }

    /**
     * @description - This function get all the scene instances of a parent instance by its uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} uuidParent - The uuid of the parent instance of the scene instance to get.
     * @param {UUID} userUuid - The uuid of the user that wants to get the scene instances.
     * @returns {Promise<SceneInstance[]>} - The array of scene instances if it exists, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error getting the scene.
     * @memberof Instance_scene_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async getAllByParentUuid(
        client: PoolClient,
        uuidParent: UUID,
        userUuid?: UUID
    ): Promise<SceneInstance[] | BaseError> {
        const scene_types_query = queries.getQuery_get(
            "instance_scene_from_sceneType"
        );
        const returnSceneInstance: SceneInstance[] = [];
        let newSceneInstance;
        try {
            const res_scene_instance = await client.query(scene_types_query, [
                uuidParent,
            ]);
            for (const st of res_scene_instance.rows) {
                newSceneInstance = await this.getByUuid(
                    client,
                    st.uuid_instance_object,
                    userUuid
                );
                if (newSceneInstance instanceof SceneInstance) {
                    returnSceneInstance.push(newSceneInstance);
                }
            }

            return returnSceneInstance;
        } catch (err) {
            throw new Error(
                `Error getting the scenes for the parent ${uuidParent}: ${err}`
            );
        }
    }

    /**
     * @description - This function create a new scene instance.
     * @param {PoolClient} client - The client to the database.
     * @param {SceneInstance} newScene - The scene instance to create.
     * @param {UUID} userUuid - The uuid of the user that wants to create the scene instance.
     * @returns {Promise<SceneInstance | undefined>} - The scene instance created, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error creating the scene.
     * @memberof Instance_scene_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async create(
        client: PoolClient,
        newScene: SceneInstance,
        userUuid?: UUID
    ): Promise<SceneInstance | undefined | BaseError> {
        try {
            const query_create_sceneInstance = queries.getQuery_post(
                "create_scene_instance"
            );

            const created_instanceObject = await Instance_objects_connection.create(
                client,
                newScene,
                userUuid
            );

            if (created_instanceObject instanceof BaseError) {
                if (created_instanceObject.httpCode === 403) {
                    return new HTTP403NORIGHT(`The user ${userUuid} has no right to create the scene instance`);
                }
                return created_instanceObject;
            }
            if (!created_instanceObject) return undefined;

            await client.query(query_create_sceneInstance, [
                created_instanceObject.get_uuid(),
                newScene.get_scene_type_uuid(),
            ]);

            // Batch insert operations for related instances

            await Instance_attribute_connection.postByParentUuid(
                client,
                created_instanceObject.get_uuid(),
                newScene.get_attribute_instances(),
                userUuid
            ),
                await Instance_port_connection.postPortsInstance(
                    client,
                    newScene.get_port_instances()
                ),
                await Instance_class_connection.postClassInstances(
                    client,
                    newScene.get_class_instances(),
                    created_instanceObject.get_uuid()
                ),
                await Instance_relationclass_connection.postRelationClassInstance(
                    client,
                    newScene.get_relationclass_instances(),
                    created_instanceObject.get_uuid()
                ),
                await Instance_role_connection.postRolesInstance(
                    client,
                    newScene.get_role_instances()
                );

            await this.update(
                client,
                created_instanceObject.get_uuid(),
                newScene
            );

            return await this.getByUuid(client, created_instanceObject.get_uuid());
        } catch (err) {
            throw new Error(`Error creating the scene: ${err}`);
        }
    }

    /**
     * @description - This function update a scene instance.
     * @param {PoolClient} client - The client to the database.
     * @param {SceneInstance} newSceneInstance - The scene instance to update.
     * @param {UUID} sceneInstanceUuidToUpdate - The uuid of the scene instance to update.
     * @param {UUID} userUuid - The uuid of the user that wants to update the scene instance.
     * @returns {Promise<SceneInstance | undefined>} - The scene instance updated, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error updating the scene.
     * @memberof Instance_scene_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async update(
        client: PoolClient,
        sceneInstanceUuidToUpdate: UUID,
        newSceneInstance: SceneInstance,
        userUuid?: UUID
    ): Promise<SceneInstance | undefined | BaseError> {
        try {
            const updated_obj = await Instance_objects_connection.update(
                client,
                sceneInstanceUuidToUpdate,
                newSceneInstance,
                userUuid
            );

            if (updated_obj instanceof BaseError) {
                if (updated_obj.httpCode === 403) {
                    return new HTTP403NORIGHT(`The user ${userUuid} has no right to update the scene instance ${sceneInstanceUuidToUpdate}`);
                }
                return updated_obj;
            }
            if (!updated_obj) return undefined;


            const current_sceneinstance = SceneInstance.fromJS(
                await this.getByUuid(client, sceneInstanceUuidToUpdate)
            ) as SceneInstance;


            const attributeDifference = current_sceneinstance.get_attribute_instance_difference(newSceneInstance.get_attribute_instances());
            const classDifference = current_sceneinstance.get_class_instance_difference(newSceneInstance.get_class_instances());
            const relationClassDifference = current_sceneinstance.get_relationclass_instance_difference(newSceneInstance.get_relationclass_instances());
            const portDifference = current_sceneinstance.get_port_instance_difference(newSceneInstance.get_port_instances());
            const roleDifference = current_sceneinstance.get_role_instance_difference(newSceneInstance.get_role_instances());

            await Instance_attribute_connection.postByParentUuid(
                client,
                sceneInstanceUuidToUpdate,
                attributeDifference.added
            );


            for (const attrToUpdate of attributeDifference.modified) {
                await Instance_attribute_connection.update(
                    client,
                    attrToUpdate.get_uuid(),
                    attrToUpdate,
                    userUuid
                );
            }

            for (const classToCreate of classDifference.added) {
                await Instance_class_connection.postClassInstances(
                    client,
                    classToCreate,
                    sceneInstanceUuidToUpdate,
                    //userUuid
                );
            }

            for (const classToUpdate of classDifference.modified) {
                await Instance_class_connection.update(
                    client,
                    classToUpdate.get_uuid(),
                    classToUpdate,
                    userUuid
                );
            }

            for (const relClassToCreate of relationClassDifference.added) {
                await Instance_relationclass_connection.postRelationClassInstance(
                    client,
                    relClassToCreate,
                    sceneInstanceUuidToUpdate,
                    userUuid
                );
            }

            for (const relClassToUpdate of relationClassDifference.modified) {
                await Instance_relationclass_connection.update(
                    client,
                    relClassToUpdate.get_uuid(),
                    relClassToUpdate,
                    userUuid
                );
            }

            for (const portToCreate of portDifference.added) {
                await Instance_port_connection.postPortsInstance(
                    client,
                    portToCreate,
                    userUuid
                );
            }

            for (const portToUpdate of portDifference.modified) {
                await Instance_port_connection.update(
                    client,
                    portToUpdate.get_uuid(),
                    portToUpdate,
                    userUuid
                );
            }

            for (const roleToCreate of roleDifference.added) {
                await Instance_role_connection.postRolesInstance(
                    client,
                    roleToCreate,
                    userUuid
                );
            }

            for (const roleToUpdate of roleDifference.modified) {
                await Instance_role_connection.update(
                    client,
                    roleToUpdate.get_uuid(),
                    roleToUpdate,
                    userUuid
                );
            }


            return await this.getByUuid(client, sceneInstanceUuidToUpdate, userUuid);
        } catch (err) {
            throw new Error(
                `Error updating the scene ${sceneInstanceUuidToUpdate}: ${err}`
            );
        }
    }


    async hardUpdate(
        client: PoolClient,
        sceneInstanceUuidToUpdate: UUID,
        newSceneInstance: SceneInstance,
        userUuid?: UUID
    ) {
        try {
            const updated_obj = await this.update(client, sceneInstanceUuidToUpdate, newSceneInstance, userUuid);

            if (updated_obj instanceof BaseError) {
                if (updated_obj.httpCode === 403) {
                    return new HTTP403NORIGHT(`The user ${userUuid} has no right to hard update the scene instance  ${sceneInstanceUuidToUpdate}`);
                }
                return updated_obj;
            }
            if (!updated_obj) return undefined;

            const current_sceneinstance = SceneInstance.fromJS(
                await this.getByUuid(client, sceneInstanceUuidToUpdate)
            ) as SceneInstance;

            const attributeDifference = current_sceneinstance.get_attribute_instance_difference(newSceneInstance.get_attribute_instances());
            const classDifference = current_sceneinstance.get_class_instance_difference(newSceneInstance.get_class_instances());
            const relationClassDifference = current_sceneinstance.get_relationclass_instance_difference(newSceneInstance.get_relationclass_instances());
            const portDifference = current_sceneinstance.get_port_instance_difference(newSceneInstance.get_port_instances());
            const roleDifference = current_sceneinstance.get_role_instance_difference(newSceneInstance.get_role_instances());

            for (const attrToCreate of attributeDifference.removed) {
                await Instance_attribute_connection.deleteByUuid(
                    client,
                    attrToCreate.get_uuid(),
                    userUuid
                );
            }

            for (const classToCreate of classDifference.removed) {
                await Instance_class_connection.deleteByUuid(
                    client,
                    classToCreate.get_uuid(),
                    userUuid
                );
            }

            for (const relClassToCreate of relationClassDifference.removed) {
                await Instance_relationclass_connection.deleteByUuid(
                    client,
                    relClassToCreate.get_uuid(),
                    userUuid
                );

            }

            for (const portToCreate of portDifference.removed) {
                await Instance_port_connection.deleteByUuid(
                    client,
                    portToCreate.get_uuid(),
                    userUuid
                );
            }

            for (const roleToCreate of roleDifference.removed) {
                await Instance_role_connection.deleteByUuid(
                    client,
                    roleToCreate.get_uuid(),
                    userUuid
                );
            }

            return await this.getByUuid(client, sceneInstanceUuidToUpdate, userUuid);
        } catch (err) {
            throw new Error(
                `Error updating the scene ${sceneInstanceUuidToUpdate}: ${err}`
            );
        }
    }

    /**
     * @description - This function delete scene instances by the parent's uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} parentUuid - The uuid of the parent.
     * @param {UUID} userUuid - The uuid of the user that wants to delete the scene instances.
     * @returns {Promise<UUID[] | undefined>} - The array of uuid of all the objects deleted, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error deleting the scene instance.
     * @memberof Instance_scene_connection
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
            const sceneInstances = await this.getAllByParentUuid(client, parentUuid, userUuid);
            if (sceneInstances instanceof BaseError) return sceneInstances;
            
            return await Instance_objects_connection.deleteCollectionObject(
                client,
                sceneInstances,
                userUuid
            );
        } catch (err) {
            throw new Error(
                `Error deleting all the instances objects for the parent ${parentUuid}: ${err}`
            );
        }
    }

    /**
     * @description - This function delete scene instances by uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} uuidToDelete - The uuid of the parent.
     * @param {UUID} userUuid - The uuid of the user.
     * @returns {Promise<UUID[] | undefined>} - The array of uuid of all the objects deleted, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error deleting the scene instance.
     * @memberof Instance_scene_connection
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
            throw new Error(`Error deleting scene instance ${uuidToDelete}: ${err}`);
        }
    }
}

export default new Instance_scenesConnection();
