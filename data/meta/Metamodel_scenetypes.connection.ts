import {PoolClient} from "pg";
import {queries} from "../..";
import {SceneType, UUID} from "../../../mmar-global-data-structure";
import {CRUD} from "../common/crud.interface";
import Metamodel_metaobject_connection from "./Metamodel_metaobjects.connection";
import Metamodel_classes_connection from "./Metamodel_classes.connection";
import Metamodel_relationclasses_connection from "./Metamodel_relationclasses.connection";
import Metamodel_attributes_connection from "./Metamodel_attributes.connection";
import Metamodel_ports_connection from "./Metamodel_ports.connection";
import Metamodel_common_functions from "./Metamodel_common_functions.connection";
import {BaseError, HTTP403NORIGHT,} from "../services/middleware/error_handling/standard_errors.middleware";

/**
 * @description - This is the class that handles the CRUD operations for the scene types.
 * @export - The class is exported so that it can be used by other files.
 * @class Metamodel_scenetypesConnection
 * @extends {CRUD}
 */
class Metamodel_scenetypesConnection implements CRUD {
  /**
   * @description - This function gets a scene type by its uuid.
   * @param {PoolClient} client - The client to the database.
   * @param {UUID} sceneTypeUuid - The uuid of the scene type to get.
   * @param {UUID} userUuid? - The uuid of the user that wants to get the scene type.
   * @returns {Promise<SceneType | undefined>} - The scene type if it exists, undefined otherwise.
   * @throws {Error} - This function throws an error if there is an error getting the scene type.
   * @memberof Metamodel_scenetypes_connection
   * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
   * @export  - This function is exported so that it can be used by other files.
   * @method
   */
  async getByUuid(
    client: PoolClient,
    sceneTypeUuid: UUID,
    userUuid?: UUID,
  ): Promise<SceneType | undefined | BaseError> {
    const scene_type_query = queries.getQuery_get("scene_type_query");

    try {
      let newScene;

      if (userUuid) {
        const read_check = queries.getQuery_get("read_check");
        const res = await client.query(read_check, [sceneTypeUuid, userUuid]);
        if (res.rowCount == 0) {
          return new HTTP403NORIGHT(
            `The user ${userUuid} has no right to read the scene type ${sceneTypeUuid}`,
          );
        }
      }
      const res_scene_types = await client.query(scene_type_query, [
        sceneTypeUuid,
      ]);

      if (res_scene_types.rowCount == 1) {
        const newSceneTypeUuid = res_scene_types.rows[0];
        newScene = SceneType.fromJS(newSceneTypeUuid) as SceneType;
        const classes = await Metamodel_classes_connection.getAllByParentUuid(
          client,
          newScene.get_uuid(),
          userUuid,
        );
        if (Array.isArray(classes)) newScene.set_class(classes);

        const relationClasses =
          await Metamodel_relationclasses_connection.getAllByParentUuid(
            client,
            newScene.get_uuid(),
            userUuid,
          );
        if (Array.isArray(relationClasses))
          newScene.set_relationclass(relationClasses);

        const attributes =
          await Metamodel_attributes_connection.getAllByParentUuid(
            client,
            newScene.get_uuid(),
            userUuid,
          );
        if (Array.isArray(attributes)) newScene.set_attribute(attributes);

        const ports = await Metamodel_ports_connection.getAllByParentUuid(
          client,
          newScene.get_uuid(),
          userUuid,
        );
        if (Array.isArray(ports)) newScene.set_port(ports);
      }
      return newScene;
    } catch (err) {
      throw new Error(`Error getting the scene type ${sceneTypeUuid}: ${err}`);
    }
  }

  /**
   * @description - This function gets all scene types.
   * @param {PoolClient} client - The client to the database.
   * @param {UUID} userUuid - The uuid of the user that wants to get the scene types.
   * @returns {Promise<SceneType[]>} - The scene type array if it exists, undefined otherwise.
   * @throws {Error} - This function throws an error if there is an error getting the scene type.
   * @memberof Metamodel_scenetypes_connection
   * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
   * @export  - This function is exported so that it can be used by other files.
   * @method
   */
  async getAll(
    client: PoolClient,
    userUuid?: UUID,
  ): Promise<SceneType[] | BaseError> {
    try {
      const scene_types_query = queries.getQuery_get("scene_types_query");
      const returnSceneTypes = new Array<SceneType>();
      const res_scene_types = await client.query(scene_types_query);

      for (const st of res_scene_types.rows) {
        const newSceneType = await this.getByUuid(client, st.uuid, userUuid);
        if (newSceneType instanceof SceneType)
          returnSceneTypes.push(newSceneType);
      }
      return returnSceneTypes;
    } catch (err) {
      throw new Error(`Error getting all the scene types: ${err}`);
    }
  }

  /**
   * @todo - This function is not implemented yet.
   * @description - This function gets all scene types for the parent.
   * @param {PoolClient} client - The client to the database.
   * @param {SceneType} uuidParent - The uuid of the parent.
   * @returns {Promise<SceneType[]>} - The scene type array if it exists, undefined otherwise.
   * @throws {Error} - This function throws an error if there is an error getting the scene type.
   * @memberof Metamodel_scenetypes_connection
   * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
   * @export  - This function is exported so that it can be used by other files.
   * @method
   */
  async getAllByParentUuid(): Promise<SceneType[] | BaseError> {
    throw new Error("Method not implemented because it is not possible");
  }

  /**
   * @description - This function create a new scene type.
   * @param {PoolClient} client - The client to the database.
   * @param {SceneType} newSceneType - The scene type to create.
   * @param {UUID} userUuid - The uuid of the user that wants to create the scene type.
   * @returns {Promise<SceneType | undefined>} - The scene type created, undefined otherwise.
   * @throws {Error} - This function throws an error if there is an error creating the scene type.
   * @memberof Metamodel_scenetypes_connection
   * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
   * @export - This function is exported so that it can be used by other files.
   * @method
   */
  async create(
    client: PoolClient,
    newSceneType: SceneType,
    userUuid?: UUID,
  ): Promise<SceneType | undefined | BaseError> {
    try {
      const query_create_scenetype = queries.getQuery_post("create_sceneType");
      const created_metaObject = await Metamodel_metaobject_connection.create(
        client,
        newSceneType,
        userUuid,
        "scene_type",
      );

      if (created_metaObject instanceof BaseError) {
        if (created_metaObject.httpCode === 403) {
          return new HTTP403NORIGHT(
            `The user ${userUuid} has no right to create the scene type`,
          );
        }
        return created_metaObject;
      }
      if (!created_metaObject) return undefined;

      await client.query(query_create_scenetype, [
        created_metaObject.get_uuid(),
      ]);

      await this.update(client, created_metaObject.get_uuid(), newSceneType);

      return await this.getByUuid(client, created_metaObject.get_uuid());
    } catch (err) {
      throw new Error(`Error creating the scene type: ${err}`);
    }
  }

  /**
   * @description - This function hard update a scene type
   * @param {PoolClient} client - The client to the database.
   * @param {SceneType} newSceneType - The scene type to update.
   * @param {UUID} sceneTypeUuidToUpdate - The uuid of the scene type to update.
   * @param {UUID} userUuid - The uuid of the user that wants to update the scene type.
   * @returns {Promise<SceneType | undefined | BaseError>} - The scene type updated, undefined otherwise.
   * @throws {Error} - This function throws an error if there is an error updating the scene type.
   * @memberof Metamodel_scenetypes_connection
   * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
   * @export - This function is exported so that it can be used by other files.
   * @method
   */
  async hardupdate(
    client: PoolClient,
    sceneTypeUuidToUpdate: UUID,
    newSceneType: SceneType,
    userUuid?: UUID,
  ): Promise<SceneType | undefined | BaseError> {
    try {
      const disconnect_attributes_query =
        "DELETE FROM scene_has_attributes WHERE uuid_attribute = ANY($1) AND uuid_scene_type = $2";
      const disconnect_classes_query =
        "DELETE FROM contains_classes WHERE uuid_class = ANY($1) AND uuid_scene_type = $2";

      const updated_metaobj = await this.update(
        client,
        sceneTypeUuidToUpdate,
        newSceneType,
        userUuid,
      );

      if (updated_metaobj instanceof BaseError) {
        if (updated_metaobj.httpCode === 403) {
          return new HTTP403NORIGHT(
            `The user ${userUuid} has no right to hard update the scene type ${sceneTypeUuidToUpdate}`,
          );
        }
        return updated_metaobj;
      }
      if (!updated_metaobj) return undefined;

      //used to compare the inner elements to check if a class must be added or deleted
      const current_scenetype = SceneType.fromJS(
        await this.getByUuid(client, sceneTypeUuidToUpdate),
      ) as SceneType;

      const attributesDifference = current_scenetype.get_attributes_difference(
        newSceneType.get_attribute(),
      );

      await client.query(disconnect_attributes_query, [
        attributesDifference.removed.map((el) => el.get_uuid()),
        sceneTypeUuidToUpdate,
      ]);

      const classesDifference = current_scenetype.get_classes_difference(
        newSceneType.get_class(),
      );

      for (const cl of classesDifference.modified) {
        await Metamodel_classes_connection.hardUpdate(
          client,
          cl.get_uuid(),
          cl,
          userUuid,
        );
      }

      await client.query(disconnect_classes_query, [
        classesDifference.removed.map((el) => el.get_uuid()),
        sceneTypeUuidToUpdate,
      ]);

      const relationClassesDifference =
        current_scenetype.get_relationclasses_difference(
          newSceneType.get_relationclass(),
        );

      for (const rc of relationClassesDifference.modified) {
        await Metamodel_relationclasses_connection.hardUpdate(
          client,
          rc.get_uuid(),
          rc,
          userUuid,
        );
      }
      await client.query(disconnect_classes_query, [
        relationClassesDifference.removed.map((el) => el.get_uuid()),
        sceneTypeUuidToUpdate
      ]);

      const portsDifference = current_scenetype.get_ports_difference(
        newSceneType.get_port(),
      );

      for (const p of portsDifference.modified) {
        p.uuid_scene_type = sceneTypeUuidToUpdate;
        await Metamodel_ports_connection.hardUpdate(
          client,
          p.get_uuid(),
          p,
          userUuid,
        );
      }

      for (const port of portsDifference.removed) {
        port.uuid_scene_type = null;
        await Metamodel_ports_connection.hardUpdate(
          client,
          port.get_uuid(),
          port,
        );
      }

      return await this.getByUuid(client, sceneTypeUuidToUpdate, userUuid);
    } catch (err) {
      throw new Error(
        `Error hard updating the scene type ${sceneTypeUuidToUpdate}: ${err}`,
      );
    }
  }

  /**
   * @description - This function update a scene type
   * @param {PoolClient} client - The client to the database.
   * @param {SceneType} newSceneType - The scene type to update.
   * @param {UUID} sceneTypeUuidToUpdate - The uuid of the scene type to update.
   * @param {UUID} userUuid - The uuid of the user that wants to update the scene type.
   * @returns {Promise<SceneType | undefined>} - The scene type updated, undefined otherwise.
   * @throws {Error} - This function throws an error if there is an error updating the scene type.
   * @memberof Metamodel_scenetypes_connection
   * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
   * @export - This function is exported so that it can be used by other files.
   * @method
   */
  async update(
    client: PoolClient,
    sceneTypeUuidToUpdate: UUID,
    newSceneType: SceneType,
    userUuid?: UUID,
  ): Promise<SceneType | undefined | BaseError> {
    try {
      const updated_metaobj = await Metamodel_metaobject_connection.update(
        client,
        sceneTypeUuidToUpdate,
        newSceneType,
        userUuid,
      );

      if (updated_metaobj instanceof BaseError) {
        if (updated_metaobj.httpCode === 403) {
          return new HTTP403NORIGHT(
            `The user ${userUuid} has no right to update the scene type ${sceneTypeUuidToUpdate}`,
          );
        }
        return updated_metaobj;
      }
      if (!updated_metaobj) return undefined;

      //used to compare the inner elements to check if a class must be added or deleted
      const current_scenetype = SceneType.fromJS(
        await this.getByUuid(client, sceneTypeUuidToUpdate),
      ) as SceneType;

      const attributesDifference = current_scenetype.get_attributes_difference(
        newSceneType.get_attribute(),
      );

      await Metamodel_attributes_connection.postForParentUuid(
        client,
        sceneTypeUuidToUpdate,
        attributesDifference.added,
        userUuid,
      );

      await Metamodel_attributes_connection.updateForParentUuid(
        client,
        sceneTypeUuidToUpdate,
        attributesDifference.modified,
        userUuid,
      );

      const classesDifference = current_scenetype.get_classes_difference(
        newSceneType.get_class(),
      );

      await Metamodel_classes_connection.postClassesForSceneType(
        client,
        sceneTypeUuidToUpdate,
        classesDifference.added,
        userUuid,
      );

      for (const cl of classesDifference.modified) {
        await Metamodel_classes_connection.update(
          client,
          cl.get_uuid(),
          cl,
          userUuid,
        );
      }

      const relationClassesDifference =
        current_scenetype.get_relationclasses_difference(
          newSceneType.get_relationclass(),
        );

      await Metamodel_relationclasses_connection.postRelationClassesForSceneType(
        client,
        sceneTypeUuidToUpdate,
        relationClassesDifference.added,
        userUuid,
      );

      for (const rc of relationClassesDifference.modified) {
        await Metamodel_relationclasses_connection.update(
          client,
          rc.get_uuid(),
          rc,
          userUuid,
        );
      }

      const portsDifference = current_scenetype.get_ports_difference(
        newSceneType.get_port(),
      );

      await Metamodel_ports_connection.postPortsForSceneType(
        client,
        sceneTypeUuidToUpdate,
        portsDifference.added,
        userUuid,
      );

      for (const p of portsDifference.modified) {
        p.uuid_scene_type = sceneTypeUuidToUpdate;
        await Metamodel_ports_connection.update(
          client,
          p.get_uuid(),
          p,
          userUuid,
        );
      }

      return await this.getByUuid(client, sceneTypeUuidToUpdate, userUuid);
    } catch (err) {
      throw new Error(
        `Error updating the scene type ${sceneTypeUuidToUpdate}: ${err}`,
      );
    }
  }

  /**
   * @description - This function delete all scene type.
   * @param {PoolClient} client - The client to the database.
   * @param {UUID} userUuid - The uuid of the user that wants to delete the scene type.
   * @returns {Promise<UUID[] | undefined>} - The array of uuid of all the objects deleted, undefined otherwise.
   * @throws {Error} - This function throws an error if there is an error deleting the scene type.
   * @memberof Metamodel_scenetypes_connection
   * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
   * @export - This function is exported so that it can be used by other files.
   * @method
   */
  async deleteAll(
    client: PoolClient,
    userUuid?: UUID,
  ): Promise<UUID[] | undefined | BaseError> {
    try {
      const delete_scene_types_query =
        queries.getQuery_delete("delete_sceneTypes");
      const get_rel_meta = queries.getQuery_get(
        "related_scene_instance_of_meta_query",
      );
      return await Metamodel_common_functions.deleteAllItems(
        client,
        delete_scene_types_query,
        get_rel_meta,
        userUuid,
      );
    } catch (err) {
      throw new Error(`Error deleting all the scene types: ${err}`);
    }
  }

  /**
   * @description - This function delete scene type by uuid.
   * @param {PoolClient} client - The client to the database.
   * @param {UUID} uuidToDelete - The uuid of the scene type to delete.
   * @param {UUID} userUuid - The uuid of the user that wants to delete the scene type.
   * @returns {Promise<UUID[] | undefined>} - The array of uuid of all the objects deleted, undefined otherwise.
   * @throws {Error} - This function throws an error if there is an error deleting the scene type.
   * @memberof Metamodel_scenetypes_connection
   * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
   * @export - This function is exported so that it can be used by other files.
   * @method
   */
  async deleteByUuid(
    client: PoolClient,
    uuidToDelete: UUID,
    userUuid?: UUID | undefined,
  ): Promise<UUID[] | undefined | BaseError> {
    return await Metamodel_metaobject_connection.deleteByUuid(
      client,
      uuidToDelete,
      userUuid,
    );
  }
}

export default new Metamodel_scenetypesConnection();
