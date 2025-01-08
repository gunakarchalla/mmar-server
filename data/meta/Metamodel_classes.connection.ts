import {Class, UUID} from "../../../mmar-global-data-structure";
import {PoolClient} from "pg";
import {queries} from "../..";
import Metamodel_metaobject_connection from "./Metamodel_metaobjects.connection";
import {CRUD} from "../common/crud.interface";
import Metamodel_attributes_connection from "./Metamodel_attributes.connection";
import Metamodel_ports_connection from "./Metamodel_ports.connection";
import Metamodel_common_functions from "./Metamodel_common_functions.connection";
import {BaseError, HTTP403NORIGHT,} from "../services/middleware/error_handling/standard_errors.middleware";

/**
 * @description - This is the class that handles the CRUD operations for the Meta classes.
 * @class Metamodel_classesConnection
 * @implements {CRUD}
 * @export - This class is exported so that it can be used by other classes.
 */
class Metamodel_classesConnection implements CRUD {
  async getAll(
    client: PoolClient,
    userUuid?: UUID,
  ): Promise<Class[] | BaseError> {
    try {
      const classes_query =
        "SELECT m.uuid FROM metaobject m, class c WHERE m.uuid=c.uuid_metaobject AND m.uuid NOT IN (SELECT uuid_class FROM relationclass)";

      const returnClasses = new Array<Class>();

      const res_classes = await client.query(classes_query);
      for (const cl of res_classes.rows) {
        const newClass = await this.getByUuid(client, cl.uuid, userUuid);
        if (newClass instanceof Class) returnClasses.push(newClass);
      }
      return returnClasses;
    } catch (err) {
      throw new Error(`Error getting all the classes: ${err}`);
    }
  }

  /**
   * @description - This function gets the class by uuid.
   * @param {PoolClient} client - The client to the database.
   * @param {UUID} classUuid - The uuid of the class to get.
   * @param {UUID} userUuid - The uuid of the user that is requesting the class.
   * @returns {Promise<Class | undefined>} - The class if it exists, undefined otherwise.
   * @throws {Error} - This function throws an error if there is an error getting the class.
   * @memberof Metamodel_classes_connection
   * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
   * @export - This function is exported so that it can be used by other classes.
   * @method
   */
  async getByUuid(
    client: PoolClient,
    classUuid: UUID,
    userUuid?: UUID,
  ): Promise<Class | undefined | BaseError> {
    try {
      const classes_query = queries.getQuery_get("class_uuid_query");
      let newClass;

      if (userUuid) {
        const read_check = queries.getQuery_get("read_check");
        const res = await client.query(read_check, [classUuid, userUuid]);
        if (res.rowCount == 0) {
          return new HTTP403NORIGHT(
            `The user ${userUuid} has no right to read the class ${classUuid}`,
          );
        }
      }
      const res_class = await client.query(classes_query, [classUuid]);

      if (res_class.rowCount == 1) {
        newClass = Class.fromJS(res_class.rows[0]) as Class;

        const attributes =
          await Metamodel_attributes_connection.getAllByParentUuid(
            client,
            newClass.get_uuid(),
            userUuid,
          );
        if (Array.isArray(attributes)) newClass.set_attribute(attributes);

        const ports = await Metamodel_ports_connection.getAllByParentUuid(
          client,
          newClass.get_uuid(),
          userUuid,
        );
        if (Array.isArray(ports)) newClass.set_port(ports);
      }
      return newClass;
    } catch (err) {
      throw new Error(`Error getting the class ${classUuid}: ${err}`);
    }
  }

  /**
   * @description - This function get all the class of a parent instance by its uuid.
   * @param {PoolClient} client - The client to the database.
   * @param {UUID} uuidParent - The uuid of the parent instance of the class to get.
   * @param {UUID} userUuid - The uuid of the user that is requesting the class.
   * @returns {Promise<Class[]>} - The array of class if it exists, undefined otherwise.
   * @throws {Error} - This function throws an error if there is an error getting the class.
   * @memberof Metamodel_classes_connection
   * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
   * @export - This function is exported so that it can be used by other files.
   * @method
   */
  async getAllByParentUuid(
    client: PoolClient,
    uuidParent: UUID,
    userUuid?: UUID,
  ): Promise<Class[] | BaseError> {
    try {
      let class_query: string;
      const returnClasses = new Array<Class>();
      const uuid_type =
        await Metamodel_common_functions.getMetaTypeWithMetaUuid(
          client,
          uuidParent,
        );
      if (uuid_type !== undefined) {
        switch (uuid_type) {
          case "scene_type":
            class_query = queries.getQuery_get("classes_scene_query");
            break;
          default:
            throw new Error(
              `Error the uuid ${uuidParent} cannot be a parent for a class`,
            );
        }
        const res_classes = await client.query(class_query, [uuidParent]);
        for (const cl of res_classes.rows) {
          const newClass = await this.getByUuid(client, cl.uuid, userUuid);
          if (newClass instanceof Class) returnClasses.push(newClass);
        }
      }
      return returnClasses;
    } catch (err) {
      throw new Error(`Error getting classes for parent ${uuidParent}: ${err}`);
    }
  }

  /**
   * @description - This function get the bendpoints uuid of a relationclass by its uuid.
   * @param {PoolClient} client - The client to the database.
   * @param {UUID} relclassUuid - The uuid of the relationclass to get the bendpoints.
   * @returns {Promise<UUID | undefined>} - The bendpoints uuid if it exists, undefined otherwise.
   * @throws {Error} - This function throws an error if there is an error getting the bendpoints.
   * @memberof Metamodel_classes_connection
   * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
   * @export - This function is exported so that it can be used by other files.
   * @method
   * @todo - Include the userUuid in the function.
   */
  async getBendpointsForRelationClass(
    client: PoolClient,
    relclassUuid: UUID,
    userUuid?: UUID,
  ): Promise<UUID | undefined | BaseError> {
    try {
      const classes_query = queries.getQuery_get("bendpoints_relClass_query");
      let returnBendpoints;

      const res_bendpoints = await client.query(classes_query, [relclassUuid]);
      if (res_bendpoints.rowCount == 1) {
        const cl = res_bendpoints.rows[0];
        returnBendpoints = cl.uuid_class_bendpoint as UUID;
      }
      return returnBendpoints;
    } catch (err) {
      throw new Error(
        `Error getting the bendpoint for the relationclass ${relclassUuid}: ${err}`,
      );
    }
  }

  /**
   * @description - This function create a new class.
   * @param {PoolClient} client - The client to the database.
   * @param {Class} newClass - The class to create.
   * @param {UUID} userUuid - The uuid of the user that is creating the class.
   * @returns {Promise<Class | undefined>} - The class created, undefined otherwise.
   * @throws {Error} - This function throws an error if there is an error creating the class.
   * @memberof Metamodel_classes_connection
   * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
   * @export - This function is exported so that it can be used by other files.
   * @method
   */
  async create(
    client: PoolClient,
    newClass: Class,
    userUuid?: UUID,
  ): Promise<Class | undefined | BaseError> {
    try {
      const query_create_class = queries.getQuery_post("create_class"); //uuid, is abstract, is reusable
      const created_metaObject = await Metamodel_metaobject_connection.create(
        client,
        newClass,
        userUuid,
        "class",
      );
      if (created_metaObject instanceof BaseError) {
        if (created_metaObject.httpCode === 403) {
          return new HTTP403NORIGHT(
            `The user ${userUuid} has no right to create the class`,
          );
        }
        return created_metaObject;
      }
      if (!created_metaObject) return undefined;

      await client.query(query_create_class, [
        created_metaObject.get_uuid(),
        newClass.get_is_abstract(),
        newClass.get_is_reusable(),
      ]);

      /*
                              await Metamodel_attributes_connection.postForParentUuid(
                                  client,
                                  created_metaObject.get_uuid(),
                                  newClass.get_attribute()
                              );

                               */

      await this.update(client, created_metaObject.get_uuid(), newClass);
      return await this.getByUuid(
        client,
        created_metaObject.get_uuid(),
        userUuid,
      );
    } catch (err) {
      throw new Error(`Error creating the class: ${err}`);
    }
  }

  /**
   * @description - This function update a class.
   * @param {PoolClient} client - The client to the database.
   * @param {Class} newClass - The class to update.
   * @param {UUID} classUuidToUpdate - The uuid of the class to update.
   * @param {UUID} userUuid
   * @returns {Promise<Class | undefined>} - The class updated, undefined otherwise.
   * @throws {Error} - This function throws an error if there is an error updating the class.
   * @memberof Metamodel_classes_connection
   * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
   * @export - This function is exported so that it can be used by other files.
   * @method
   */
  async update(
    client: PoolClient,
    classUuidToUpdate: UUID,
    newClass: Class,
    userUuid?: UUID,
  ): Promise<Class | undefined | BaseError> {
    try {
      const query_update_class = queries.getQuery_post("update_class"); //is_abstact, is_reusable, class_uuid

      const updated_metaobj = await Metamodel_metaobject_connection.update(
        client,
        classUuidToUpdate,
        newClass,
        userUuid,
      );

      if (updated_metaobj instanceof BaseError) {
        if (updated_metaobj.httpCode === 403) {
          return new HTTP403NORIGHT(
            `The user ${userUuid} has no right to update the class ${classUuidToUpdate}`,
          );
        }
        return updated_metaobj;
      }
      if (!updated_metaobj) return undefined;

      await client.query(query_update_class, [
        newClass.get_is_abstract(),
        newClass.get_is_reusable(),
        classUuidToUpdate,
      ]);

      const current_class = Class.fromJS(
        await this.getByUuid(client, classUuidToUpdate),
      ) as Class;

      const attributesDifference = current_class.get_attributes_difference(
        newClass.get_attribute(),
      );

      await Metamodel_attributes_connection.postForParentUuid(
        client,
        classUuidToUpdate,
        attributesDifference.added,
        userUuid,
      );

      await Metamodel_attributes_connection.updateForParentUuid(
        client,
        classUuidToUpdate,
        attributesDifference.modified,
        userUuid,
      );

      const portsDifference = current_class.get_ports_difference(
        newClass.get_port(),
      );
      await Metamodel_ports_connection.postPortsForClass(
        client,
        classUuidToUpdate,
        portsDifference.added,
        userUuid,
      );

      for (const port of portsDifference.modified) {
        await Metamodel_ports_connection.update(
          client,
          port.get_uuid(),
          port,
          userUuid,
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
    newClass: Class,
    userUuid?: UUID,
  ): Promise<Class | undefined | BaseError> {
    try {
      const query_disconnect_class_attribute =
        "DELETE FROM class_has_attributes WHERE uuid_attribute = ANY($1) AND uuid_class = $2";

      const updated_metaobj = await this.update(
        client,
        classUuidToUpdate,
        newClass,
        userUuid,
      );

      if (updated_metaobj instanceof BaseError) {
        if (updated_metaobj.httpCode === 403) {
          return new HTTP403NORIGHT(
            `The user ${userUuid} has no right to hard update the class ${classUuidToUpdate}`,
          );
        }
        return updated_metaobj;
      }
      if (!updated_metaobj) return undefined;

      const current_class = Class.fromJS(
        await this.getByUuid(client, classUuidToUpdate),
      ) as Class;

      const attributesRemoved = current_class.get_attributes_difference(
        newClass.get_attribute(),
      ).removed;

      const portsRemoved = current_class.get_ports_difference(
        newClass.get_port(),
      ).removed;

      await client.query(query_disconnect_class_attribute, [
        attributesRemoved.map((a) => a.get_uuid()),
        classUuidToUpdate,
      ]);

      for (const port of portsRemoved) {
        port.uuid_class = null;
        await Metamodel_ports_connection.update(client, port.get_uuid(), port);
      }

      return await this.getByUuid(client, classUuidToUpdate, userUuid);
    } catch (err) {
      throw new Error(
        `Error hard updating the class ${classUuidToUpdate}: ${err}`,
      );
    }
  }

  /**
   * @description - This function create a class for the scene type by the uuid of the scene type.
   * @param {PoolClient} client - The client to the database.
   * @param {UUID} sceneTypeUUID - The uuid of the scene type.
   * @param {Class[] | Class} newClasses - The class or an array of attributes to create.
   * @param {UUID} userUuid - The uuid of the user that is creating the class.
   * @returns {Promise<Class[] | undefined>} - The array of class created, undefined otherwise.
   * @throws {Error} - This function throws an error if there is an error creating the class.
   * @memberof Metamodel_classes_connection
   * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
   * @export - This function is exported so that it can be used by other files.
   * @method
   */
  async postClassesForSceneType(
    client: PoolClient,
    sceneTypeUUID: UUID,
    newClasses: Class[] | Class,
    userUuid?: UUID,
  ): Promise<Class[] | undefined | BaseError> {
    try {
      const query_connect_class_scenetype = queries.getQuery_post(
        "connect_class_scenetype",
      );
      const returnClass = new Array<Class>();

      // If newClasses is not an array, make it an array.
      const classes = Array.isArray(newClasses) ? newClasses : [newClasses];

      for (const classToAdd of classes) {
        const currentClass = await this.create(client, classToAdd, userUuid);
        if (currentClass instanceof Class) {
          await client.query(query_connect_class_scenetype, [
            currentClass.get_uuid(),
            sceneTypeUUID,
          ]);
          returnClass.push(currentClass);
        } else {
          const existingClass = await this.getByUuid(
            client,
            classToAdd.get_uuid(),
          );
          if (existingClass instanceof Class) {
            await client.query(query_connect_class_scenetype, [
              existingClass.get_uuid(),
              sceneTypeUUID,
            ]);
            returnClass.push(existingClass);
          }
        }
      }
      return returnClass;
    } catch (err) {
      throw new Error(
        `Error creating the class for the scene type ${sceneTypeUUID}: ${err}`,
      );
    }
  }

  /**
   * @description - This function delete class for a given parent by uuid.
   * @param {PoolClient} client - The client to the database.
   * @param {UUID} sceneTypeUUID - The uuid of the parent to delete the class for.
   * @param {UUID} userUuid - The uuid of the user that is deleting the class.
   * @returns {Promise<UUID[] | undefined>} - The array of uuid of all the objects deleted, undefined otherwise.
   * @throws {Error} - This function throws an error if there is an error deleting the class.
   * @memberof Metamodel_classes_connection
   * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
   * @export
   * @method
   */
  async deleteAllByParentUuid(
    client: PoolClient,
    sceneTypeUUID: UUID,
    userUuid?: UUID,
  ): Promise<UUID[] | undefined | BaseError> {
    try {
      const delete_classes_for_scene_query = queries.getQuery_delete(
        "delete_classes_for_scene",
      );

      return await Metamodel_common_functions.deleteAllItems(
        client,
        delete_classes_for_scene_query,
        sceneTypeUUID,
        userUuid,
      );
    } catch (err) {
      throw new Error(
        `Error deleting the class(es) for the scenetype ${sceneTypeUUID}: ${err}`,
      );
    }
  }

  /**
   * @description - This function delete class by uuid.
   * @param {PoolClient} client - The client to the database.
   * @param {UUID} uuidToDelete - The uuid of the class to delete.
   * @param {UUID} userUuid - The uuid of the user that is deleting the class.
   * @returns {Promise<UUID[] | undefined>} - The array of uuid of all the objects deleted, undefined otherwise.
   * @throws {Error} - This function throws an error if there is an error deleting the class.
   * @memberof Metamodel_classes_connection
   * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
   * @export - This function is exported so that it can be used by other files.
   * @method
   */
  async deleteByUuid(
    client: PoolClient,
    uuidToDelete: UUID,
    userUuid?: UUID,
  ): Promise<UUID[] | undefined | BaseError> {
    try {
      return await Metamodel_metaobject_connection.deleteByUuid(
        client,
        uuidToDelete,
        userUuid,
      );
    } catch (err) {
      throw new Error(`Error deleting the class ${uuidToDelete}: ${err}`);
    }
  }
}

export default new Metamodel_classesConnection();
