import {PoolClient} from "pg";
import {queries} from "../..";
import {CRUD} from "../common/crud.interface";
import Metamodel_metaobject_connection from "./Metamodel_metaobjects.connection";
import Metamodel_common_functions from "./Metamodel_common_functions.connection";
import Metamodel_attributes_connection from "./Metamodel_attributes.connection";
import {Port, UUID} from "../../../mmar-global-data-structure";
import {
    BaseError,
    HTTP403NORIGHT,
    HTTP409CONFLICT,
} from "../services/middleware/error_handling/standard_errors.middleware";

/**
 * @description - This is the class that handles the CRUD operations for the Meta ports.
 * @class Metamodel_portsConnection
 * @implements {CRUD}
 * @export - This class is exported so that it can be used by other classes.
 */
class Metamodel_portsConnection implements CRUD {
  async getAll(
    client: PoolClient,
    userUuid?: UUID,
  ): Promise<Port[] | BaseError> {
    try {
      const ports_query = "SELECT uuid_metaobject as uuid FROM port";
      const ports = new Array<Port>();
      const res_ports = await client.query(ports_query);
      for (const port of res_ports.rows) {
        const newPort = await this.getByUuid(client, port.uuid, userUuid);
        if (newPort instanceof Port) {
          ports.push(newPort);
        }
      }
      return ports;
    } catch (error) {
      throw new Error(`Error getting all the ports: ${error}`);
    }
  }

  /**
   * @description - This function gets the port by uuid.
   * @param {PoolClient} client - The client to the database.
   * @param {UUID} portUuid - The uuid of the port to get.
   * @param userUuid
   * @returns {Promise<Port | undefined>} - The port if it exists, undefined otherwise.
   * @throws {Error} - This function throws an error if there is an error getting the port.
   * @memberof Metamodel_ports_connection
   * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
   * @export - This function is exported so that it can be used by other classes.
   * @method
   */
  async getByUuid(
    client: PoolClient,
    portUuid: UUID,
    userUuid?: UUID,
  ): Promise<Port | undefined | BaseError> {
    try {
      const ports_query = queries.getQuery_get("port_uuid_query");
      let newPort;

      if (userUuid) {
        const read_check = queries.getQuery_get("read_check");
        const res = await client.query(read_check, [portUuid, userUuid]);
        if (res.rowCount == 0) {
          return new HTTP403NORIGHT(
            `The user ${userUuid} has no right to read the port ${portUuid}`,
          );
        }
      }
      const res_port = await client.query(ports_query, [portUuid]);

      if (res_port.rowCount == 1) {
        newPort = Port.fromJS(res_port.rows[0]) as Port;

        const attributes =
          await Metamodel_attributes_connection.getAllByParentUuid(
            client,
            newPort.uuid,
            userUuid,
          );
        if (Array.isArray(attributes)) newPort.set_attribute(attributes);
      }
      return newPort;
    } catch (err) {
      throw new Error(`Error getting the port ${portUuid}: ${err}`);
    }
  }

  /**
   * @description - This function get all the port of a parent by its uuid.
   * @param {PoolClient} client - The client to the database.
   * @param {UUID} uuidParent - The uuid of the parent of the port to get.
   * @returns {Promise<Port[]>} - The array of ports if it exists.
   * @throws {Error} - This function throws an error if there is an error getting the port.
   * @memberof Metamodel_ports_connection
   * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
   * @export - This function is exported so that it can be used by other files.
   * @method
   */
  async getAllByParentUuid(
    client: PoolClient,
    uuidParent: UUID,
    userUuid?: UUID,
  ): Promise<Port[] | BaseError> {
    try {
      let port_query: string;
      const returnPorts = new Array<Port>();

      const uuid_type =
        await Metamodel_common_functions.getMetaTypeWithMetaUuid(
          client,
          uuidParent,
        );
      if (uuid_type !== undefined) {
        switch (uuid_type) {
          case "scene_type":
            port_query = queries.getQuery_get("scene_ports_query");
            break;

          case "class":
            port_query = queries.getQuery_get("class_ports_query");
            break;

          case "relationclass":
            port_query = queries.getQuery_get("class_ports_query");
            break;
          default:
            throw new Error(
              `Error the uuid ${uuidParent} cannot be a parent for a port`,
            );
        }
        const res_ports = await client.query(port_query, [uuidParent]);
        for (const cl of res_ports.rows) {
          const newPort = await this.getByUuid(
            client,
            cl.uuid_metaobject,
            userUuid,
          );
          if (newPort instanceof Port) returnPorts.push(newPort);
        }
      }
      return returnPorts;
    } catch (err) {
      throw new Error(
        `Error getting the ports for the parent ${uuidParent}: ${err}`,
      );
    }
  }

  /**
   * @description - This function create a new port.
   * @param {PoolClient} client - The client to the database.
   * @param {Port} newPort - The port to create.
   * @param userUuid
   * @returns {Promise<Port | undefined>} - The port created, undefined otherwise.
   * @throws {Error} - This function throws an error if there is an error creating the port.
   * @memberof Metamodel_ports_connection
   * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
   * @export - This function is exported so that it can be used by other files.
   * @method
   */
  async create(
    client: PoolClient,
    newPort: Port,
    userUuid?: UUID,
  ): Promise<Port | undefined | BaseError> {
    try {
      const query_create_port = queries.getQuery_post("create_port");

      const created_metaObject = await Metamodel_metaobject_connection.create(
        client,
        newPort,
        userUuid,
        "port",
      );

      if (created_metaObject instanceof BaseError) {
        if (created_metaObject.httpCode === 403) {
          return new HTTP403NORIGHT(
            `The user ${userUuid} has no right to create the port`,
          );
        }
        if (created_metaObject.httpCode === 409) {
          return new HTTP409CONFLICT(
            `The port ${newPort.get_name()} already exists`,
          );
        }
        return created_metaObject;
      }
      if (!created_metaObject) return undefined;

      await client.query(query_create_port, [
        created_metaObject.get_uuid(),
        newPort.get_class(),
        newPort.get_sceneType(),
      ]);
      await this.update(client, created_metaObject.get_uuid(), newPort);

      return await this.getByUuid(
        client,
        created_metaObject.get_uuid(),
        userUuid,
      );
    } catch (err) {
      throw new Error(`Error creating the port: ${err}`);
    }
  }

  /**
   * @description - This function update a port.
   * @param {PoolClient} client - The client to the database.
   * @param {Port} newPort - The port to update.
   * @param {UUID} portUuidToUpdate - The uuid of the port to update.
   * @param userUuid
   * @returns {Promise<Port | undefined>} - The port updated, undefined otherwise.
   * @throws {Error} - This function throws an error if there is an error updating the port.
   * @memberof Metamodel_ports_connection
   * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
   * @export - This function is exported so that it can be used by other files.
   * @method
   */
  async update(
    client: PoolClient,
    portUuidToUpdate: UUID,
    newPort: Port,
    userUuid?: UUID,
  ): Promise<Port | undefined | BaseError> {
    try {
      const query_update_port = queries.getQuery_post("update_port");
      const updated_metaobj = await Metamodel_metaobject_connection.update(
        client,
        portUuidToUpdate,
        newPort,
        userUuid,
      );

      if (updated_metaobj instanceof BaseError) {
        if (updated_metaobj.httpCode === 403) {
          return new HTTP403NORIGHT(
            `The user ${userUuid} has no right to update the port ${portUuidToUpdate}`,
          );
        }
        return updated_metaobj;
      }
      if (!updated_metaobj) return undefined;

      await client.query(query_update_port, [
        newPort.get_class(),
        newPort.get_sceneType(),
        portUuidToUpdate,
      ]);

      const current_port = Port.fromJS(
        await this.getByUuid(client, portUuidToUpdate),
      ) as Port;

      const attributesDifference = current_port.get_attributes_difference(
        newPort.get_attribute(),
      );
      await Metamodel_attributes_connection.postForParentUuid(
        client,
        portUuidToUpdate,
        attributesDifference.added,
      );
      await Metamodel_attributes_connection.updateForParentUuid(
        client,
        portUuidToUpdate,
        attributesDifference.modified,
      );

      return await this.getByUuid(client, portUuidToUpdate, userUuid);
    } catch (err) {
      throw new Error(`Error updating the port ${portUuidToUpdate}: ${err}`);
    }
  }

  async hardUpdate(
    client: PoolClient,
    portUuidToUpdate: UUID,
    newPort: Port,
    userUuid?: UUID,
  ): Promise<Port | undefined | BaseError> {
    try {
      const query_disconnect_port_attribute =
        "DELETE FROM port_has_attributes WHERE uuid_attribute = ANY($1) AND uuid_port = $2";

      const updated_metaobj = await this.update(
        client,
        portUuidToUpdate,
        newPort,
        userUuid,
      );

      if (updated_metaobj instanceof BaseError) {
        if (updated_metaobj.httpCode === 403) {
          return new HTTP403NORIGHT(
            `The user ${userUuid} has no right to hard update the port ${portUuidToUpdate}`,
          );
        }
        return updated_metaobj;
      }
      if (!updated_metaobj) return undefined;

      const current_port = Port.fromJS(
        await this.getByUuid(client, portUuidToUpdate),
      ) as Port;

      const attributesRemoved = current_port.get_attributes_difference(
        newPort.get_attribute(),
      ).removed;

      await client.query(query_disconnect_port_attribute, [
        attributesRemoved.map((a) => a.get_uuid()),
        portUuidToUpdate,
      ]);

      return await this.getByUuid(client, portUuidToUpdate, userUuid);
    } catch (err) {
      throw new Error(
        `Error hard updating the port ${portUuidToUpdate}: ${err}`,
      );
    }
  }

  /**
   * @description - This function create a port for the scene type by the uuid of the scene type.
   * @param {PoolClient} client - The client to the database.
   * @param {UUID} uuidSceneType - The uuid of the scene type.
   * @param {Port[] | Port} newPort - The port or an array of attributes to create.
   * @returns {Promise<Port[] | undefined>} - The array of port created, undefined otherwise.
   * @throws {Error} - This function throws an error if there is an error creating the port.
   * @memberof Metamodel_ports_connection
   * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
   * @export - This function is exported so that it can be used by other files.
   * @method
   */
  async postPortsForSceneType(
    client: PoolClient,
    uuidSceneType: UUID,
    newPort: Port[] | Port,
    userUuid?: UUID,
  ): Promise<Port[] | undefined | BaseError> {
    try {
      const returnPorts = new Array<Port>();
      let currentPort;

      if (newPort instanceof Port) newPort = [newPort];

      // If the newPort is an array of ports
      for (const portToAdd of newPort) {
        portToAdd.uuid_scene_type = uuidSceneType;
        currentPort = await this.create(client, portToAdd, userUuid);
        if (currentPort instanceof Port) returnPorts.push(currentPort);
        if (currentPort instanceof BaseError && currentPort.httpCode === 409) {
          await this.update(client, portToAdd.uuid, portToAdd, userUuid);
        }
      }

      return returnPorts;
    } catch (err) {
      throw new Error(
        `Error creating the port for the parent scenetype ${uuidSceneType}: ${err}`,
      );
    }
  }

  async postPortsForClass(
    client: PoolClient,
    uuidClass: UUID,
    newPort: Port[] | Port,
    userUuid?: UUID,
  ): Promise<Port[] | undefined | BaseError> {
    try {
      const returnPorts = new Array<Port>();
      let currentPort;

      if (newPort instanceof Port) newPort = [newPort];

      for (const portToAdd of newPort) {
        portToAdd.uuid_class = uuidClass;
        currentPort = await this.create(client, portToAdd, userUuid);
        if (currentPort instanceof Port) returnPorts.push(currentPort);
        if (currentPort instanceof BaseError && currentPort.httpCode === 409) {
          await this.update(client, portToAdd.uuid, portToAdd, userUuid);
        }
      }
      return returnPorts;
    } catch (err) {
      throw new Error(
        `Error creating the port for the parent class ${uuidClass}: ${err}`,
      );
    }
  }

  /**
   * @description - This function delete port for a given scene type by uuid.
   * @param {PoolClient} client - The client to the database.
   * @param {UUID} sceneTypeUUID - The uuid of the scene type to delete the port for.
   * @returns {Promise<UUID[] | undefined>} - The array of uuid of all the objects deleted, undefined otherwise.
   * @throws {Error} - This function throws an error if there is an error deleting the port.
   * @memberof Metamodel_ports_connection
   * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
   * @export
   * @method
   */
  async deletePortsForScene(
    client: PoolClient,
    sceneTypeUUID: UUID,
    userUuid?: UUID,
  ): Promise<UUID[] | undefined | BaseError> {
    try {
      const delete_ports_for_scene_query = queries.getQuery_delete(
        "delete_port_for_scene",
      );
      return await Metamodel_common_functions.deleteAllItems(
        client,
        delete_ports_for_scene_query,
        sceneTypeUUID,
        userUuid,
      );
    } catch (err) {
      throw new Error(
        `Error deleting the ports for the scene type ${sceneTypeUUID}: ${err}`,
      );
    }
  }

  /**
   * @description - This function delete port by uuid.
   * @param {PoolClient} client - The client to the database.
   * @param {UUID} uuidToDelete - The uuid of the port to delete.
   * @returns {Promise<UUID[] | undefined>} - The array of uuid of all the objects deleted, undefined otherwise.
   * @throws {Error} - This function throws an error if there is an error deleting the port.
   * @memberof Metamodel_ports_connection
   * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
   * @export - This function is exported so that it can be used by other files.
   * @method
   */
  async deleteByUuid(
    client: PoolClient,
    uuidToDelete: UUID,
    userUuid?: UUID,
  ): Promise<UUID[] | undefined | BaseError> {
    return await Metamodel_metaobject_connection.deleteByUuid(
      client,
      uuidToDelete,
      userUuid,
    );
  }
}

export default new Metamodel_portsConnection();
