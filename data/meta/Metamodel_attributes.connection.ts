import {Attribute, AttributeType, UUID,} from "../../../mmar-global-data-structure";
import {PoolClient} from "pg";
import {queries} from "../..";
import Metamodel_metaobject_connection from "./Metamodel_metaobjects.connection";
import {CRUD} from "../common/crud.interface";
import Metamodel_attribute_types_connection from "./Metamodel_attribute_types.connection";
import Metamodel_common_functions from "./Metamodel_common_functions.connection";
import {BaseError, HTTP403NORIGHT,} from "../services/middleware/error_handling/standard_errors.middleware";

/**
 * @description - This is the class that handles the CRUD operations for the Meta Attribute.
 * @export - The class is exported so that it can be used by other files.
 * @class Metamodel_attributesConnection
 * @implements {CRUD}
 */
class Metamodel_attributesConnection implements CRUD {
  async getAll(
    client: PoolClient,
    userUuid?: UUID,
  ): Promise<Attribute[] | BaseError> {
    try {
      const attribute_query = "SELECT uuid_metaobject as uuid FROM attribute";
      const returnAttributes = new Array<Attribute>();
      const res_attributes = await client.query(attribute_query);
      for (const attr of res_attributes.rows) {
        const newAttr = await this.getByUuid(client, attr.uuid, userUuid);
        if (newAttr instanceof Attribute) returnAttributes.push(newAttr);
      }
      return returnAttributes;
    } catch (error) {
      throw new Error(`Error getting all attributes: ${error}`);
    }
  }

  /**
   * @description - This function gets the attribute by uuid.
   * @param {PoolClient} client - The client to the database.
   * @param {UUID} attributeUuid - The uuid of the attribute to get.
   * @returns {Promise<Attribute | undefined>} - The attribute if it exists, undefined otherwise.
   * @throws {Error} - This function throws an error if there is an error getting the attribute.
   * @memberof Metamodel_attributes_connection
   * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
   * @export  - This function is exported so that it can be used by other files.
   * @method
   */
  async getByUuid(
    client: PoolClient,
    attributeUuid: UUID,
    userUuid?: UUID,
  ): Promise<Attribute | undefined | BaseError> {
    try {
      const attribute_query = queries.getQuery_get("attribute_uuid_query");

      let newAttribute;

      if (userUuid) {
        const read_check = queries.getQuery_get("read_check");
        const res = await client.query(read_check, [attributeUuid, userUuid]);
        if (res.rowCount == 0) {
          return new HTTP403NORIGHT(
            `The user ${userUuid} has no right to read the attribute ${attributeUuid}`,
          );
        }
      }

      const res_attribute = await client.query(attribute_query, [
        attributeUuid,
      ]);

      if (res_attribute.rowCount == 1) {
        newAttribute = Attribute.fromJS(res_attribute.rows[0]) as Attribute;
        const res_attrType =
          await Metamodel_attribute_types_connection.getAllByParentUuid(
            client,
            attributeUuid,
          );
        if (Array.isArray(res_attrType) && res_attrType.length > 0) {
          newAttribute.set_attribute_type(
            AttributeType.fromJS(res_attrType[0]) as AttributeType,
          );
        }
      }
      return newAttribute;
    } catch (err) {
      throw new Error(`Error getting the attribute ${attributeUuid}: ${err}`);
    }
  }

  /**
   * @description - This function get all the attribute of a parent instance by its uuid.
   * @param {PoolClient} client - The client to the database.
   * @param {UUID} uuidParent - The uuid of the parent instance of the attribute to get.
   * @returns {Promise<Attribute[]>} - The array of attribute if it exists, undefined otherwise.
   * @throws {Error} - This function throws an error if there is an error getting the attribute.
   * @memberof Metamodel_attributes_connection
   * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
   * @export - This function is exported so that it can be used by other files.
   * @method
   */
  async getAllByParentUuid(
    client: PoolClient,
    uuidParent: UUID,
    userUuid?: UUID,
  ): Promise<Attribute[] | BaseError> {
    try {
      let attribute_query: string;
      let seq_query: string;
      const returnAttribute = new Array<Attribute>();
      const uuid_type =
        await Metamodel_common_functions.getMetaTypeWithMetaUuid(
          client,
          uuidParent,
        );
      if (uuid_type !== undefined) {
        switch (uuid_type) {
          case "scene_type":
            attribute_query = queries.getQuery_get(
              "scene_type_attributes_query",
            );
            seq_query =
              "SELECT * FROM scene_has_attributes WHERE uuid_scene_type = $1 AND uuid_attribute = $2";
            break;

          case "class":
            attribute_query = queries.getQuery_get("class_attributes_query");
            seq_query =
              "SELECT * FROM class_has_attributes WHERE uuid_class = $1 AND uuid_attribute = $2";
            break;

          case "port":
            attribute_query = queries.getQuery_get("port_attributes_query");
            seq_query =
              "SELECT * FROM port_has_attributes WHERE uuid_port = $1 AND uuid_attribute = $2";
            break;

          case "relationclass":
            attribute_query = queries.getQuery_get("class_attributes_query");
            seq_query =
              "SELECT * FROM class_has_attributes WHERE uuid_class = $1 AND uuid_attribute = $2";
            break;

          default:
            throw new Error(
              `Error the uuid ${uuidParent} cannot be a parent for a attribute`,
            );
        }
        const res_attributes = await client.query(attribute_query, [
          uuidParent,
        ]);
        for (const attr of res_attributes.rows) {
          const newAttr = await this.getByUuid(client, attr.uuid, userUuid);
          const res_seq_ui = await client.query(seq_query, [
            uuidParent,
            attr.uuid,
          ]);
          if (newAttr instanceof Attribute) {
            if (res_seq_ui.rowCount == 1) {
              newAttr.set_sequence(res_seq_ui.rows[0].sequence);
              newAttr.set_ui_component(res_seq_ui.rows[0].ui_component);
            }
            returnAttribute.push(newAttr);
          }
        }
      }
      return returnAttribute;
    } catch (err) {
      throw new Error(`Error getting attribute for ${uuidParent}: ${err}`);
    }
  }

  /**
   * @description - This function create a new attribute.
   * @param {PoolClient} client - The client to the database.
   * @param {Attribute} newAttribute - The attribute to create.
   * @param userUuid
   * @returns {Promise<Attribute | undefined>} - The attribute created, undefined otherwise.
   * @throws {Error} - This function throws an error if there is an error creating the attribute.
   * @memberof Metamodel_attributes_connection
   * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
   * @export - This function is exported so that it can be used by other files.
   * @method
   */
  async create(
    client: PoolClient,
    newAttribute: Attribute,
    userUuid?: UUID,
  ): Promise<Attribute | undefined | BaseError> {
    const query_create_attribute = queries.getQuery_post("create_attribute"); // $1 = metaobject uuid, $2 is_multivalued, $3 attr_type
    try {
      const created_metaObject = await Metamodel_metaobject_connection.create(
        client,
        newAttribute,
        userUuid,
        "attribute",
      );

      if (created_metaObject instanceof BaseError) {
        if (created_metaObject.httpCode === 403) {
          return new HTTP403NORIGHT(
            `The user ${userUuid} has no right to create the attribute`,
          );
        }
        return created_metaObject;
      }
      if (!created_metaObject) return undefined;

      let attrType = await Metamodel_attribute_types_connection.getByUuid(
        client,
        newAttribute.get_attribute_type()?.get_uuid(),
      );

      if (
        !(attrType instanceof AttributeType || attrType instanceof BaseError)
      ) {
        attrType =
          await Metamodel_attribute_types_connection.postAttributeTypeForAttribute(
            client,
            created_metaObject.get_uuid(),
            newAttribute.get_attribute_type(),
          );
      }

      if (attrType instanceof AttributeType) {
        newAttribute.set_attribute_type(attrType);
        await client.query(query_create_attribute, [
          created_metaObject.get_uuid(),
          newAttribute.get_multi_valued(),
          attrType.uuid,
        ]);
      }

      // Create the attribute type related to the attribute

      await this.update(client, created_metaObject.get_uuid(), newAttribute);
      return await this.getByUuid(client, created_metaObject.get_uuid());
    } catch (err) {
      throw new Error(`Error creating the attribute: ${err}`);
    }
  }

  /**
   * @description - This function update an attribute.
   * @param {PoolClient} client - The client to the database.
   * @param {Attribute} newAttribute - The attribute to update.
   * @param {UUID} attrUuidToUpdate - The uuid of the attribute to update.
   * @param {UUID} userUuid - The uuid of the user who want to update the attribute.
   * @returns {Promise<Attribute | undefined>} - The attribute updated, undefined otherwise.
   * @throws {Error} - This function throws an error if there is an error updating the attribute.
   * @memberof Metamodel_attributes_connection
   * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
   * @export - This function is exported so that it can be used by other files.
   * @method
   */
  async update(
    
    client: PoolClient,
    attrUuidToUpdate: UUID,
    newAttribute: Attribute,
    userUuid?: UUID,
  ): Promise<Attribute | undefined | BaseError> {
    try {
      const query_update_attribute =
        "UPDATE attribute set multi_valued= coalesce($1, multi_valued), default_value=coalesce($2, default_value), facets=coalesce($3, facets), min=coalesce($4, min), max=coalesce($5, max), attribute_type_uuid = coalesce($6, attribute_type_uuid) where uuid_metaobject = $7 ";

      const updated_metaobj = await Metamodel_metaobject_connection.update(
        client,
        attrUuidToUpdate,
        newAttribute,
        userUuid,
      );

      if (updated_metaobj instanceof BaseError) {
        if (updated_metaobj.httpCode === 403) {
          return new HTTP403NORIGHT(
            `The user ${userUuid} has no right to update the attribute ${attrUuidToUpdate}`,
          );
        }
        return updated_metaobj;
      }
      if (!updated_metaobj) return undefined;

      await client.query(query_update_attribute, [
        newAttribute.multi_valued,
        newAttribute.default_value,
        newAttribute.facets,
        newAttribute.min,
        newAttribute.max,
        newAttribute.attribute_type?.uuid,
        attrUuidToUpdate,
      ]);

      if (newAttribute.get_attribute_type()) {
        await Metamodel_attribute_types_connection.update(
          client,
          newAttribute.get_attribute_type().get_uuid(),
          newAttribute.get_attribute_type(),
        );
      }

      return await this.getByUuid(client, attrUuidToUpdate, userUuid);
    } catch (err) {
      throw new Error(
        `Error updating the attribute ${attrUuidToUpdate}: ${err}`,
      );
    }
  }

  /**
   * @description - This function update attributes for a given parent by uuid.
   * @param {PoolClient} client - The client to the database.
   * @param {UUID} uuidParent - The uuid of the parent to update the attributes for.
   * @param {Attribute[] | Attribute} newAttribute - The attribute or an array of attributes to update.
   * @param {UUID} userUuid - The uuid of the user who want to update the attributes.
   * @returns {Promise<Attribute[] | undefined>} - The array of attribute updated, undefined otherwise.
   * @throws {Error} - This function throws an error if there is an error updating the attribute.
   * @memberof Metamodel_attributes_connection
   * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
   * @method
   */
  async updateForParentUuid(
    client: PoolClient,
    uuidParent: UUID,
    newAttribute: Attribute[] | Attribute,
    userUuid?: UUID,
  ): Promise<Attribute[] | undefined | BaseError> {
    try {
      const uuid_type =
        await Metamodel_common_functions.getMetaTypeWithMetaUuid(
          client,
          uuidParent,
        );
      let attribute_update_seq_query;

      if (uuid_type === undefined) {
        throw new Error(
          `Error the uuid ${uuidParent} cannot be a parent for an attribute`,
        );
      }

      if (!Array.isArray(newAttribute)) newAttribute = [newAttribute];

      const updatedAttributes: Attribute[] = [];

      switch (uuid_type) {
        case "scene_type":
          attribute_update_seq_query =
            "update scene_has_attributes set sequence = coalesce ($1, sequence), ui_component=coalesce ($2, ui_component) where uuid_scene_type =$3 and uuid_attribute = $4 ";
          break;

        case "class":
          attribute_update_seq_query =
            "update class_has_attributes set sequence = coalesce ($1, sequence), ui_component=coalesce ($2, ui_component) where uuid_class =$3 and uuid_attribute = $4 ";
          break;

        case "relationclass":
          attribute_update_seq_query =
            "update class_has_attributes set sequence = coalesce ($1, sequence), ui_component=coalesce ($2, ui_component) where uuid_class =$3 and uuid_attribute = $4 ";
          break;

        case "port":
          attribute_update_seq_query =
            "update port_has_attributes set sequence = coalesce ($1, sequence), ui_component=coalesce ($2, ui_component) where uuid_port =$3 and uuid_attribute = $4 ";
          break;

        default:
          throw new Error(
            `Error the uuid ${uuidParent} cannot be a parent for a attribute`,
          );
      }

      for (const attr of newAttribute) {
        if (attr.uuid !== undefined) {
          const updatedAttr = await this.update(
            client,
            attr.uuid,
            attr,
            userUuid,
          );
          if (updatedAttr instanceof Attribute) {
            await client.query(attribute_update_seq_query, [
              attr.sequence,
              attr.ui_component,
              uuidParent,
              attr.uuid,
            ]);
            updatedAttr.set_sequence(attr.sequence);
            updatedAttr.set_ui_component(attr.ui_component);
            updatedAttributes.push(updatedAttr);
          }
        }
      }

      return updatedAttributes;
    } catch (err) {
      throw new Error(`Error updating attributes for ${uuidParent}: ${err}`);
    }
  }

  /**
   * @description - This function create attributes for the parent by the uuid of the parent.
   * @param {PoolClient} client - The client to the database.
   * @param {UUID} uuidParent - The uuid of the parent.
   * @param {Attribute[] | Attribute} newAttribute - The attribute or an array of attributes to create.
   * @param {UUID} userUuid - The uuid of the user who want to create the attributes.
   * @returns {Promise<Attribute[] | undefined>} - The array of attribute created, undefined otherwise.
   * @throws {Error} - This function throws an error if there is an error creating the attribute.
   * @memberof Metamodel_attributes_connection
   * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
   * @export - This function is exported so that it can be used by other files.
   * @method
   */
  async postForParentUuid(
    client: PoolClient,
    uuidParent: UUID,
    newAttribute: Attribute[] | Attribute,
    userUuid?: UUID,
  ): Promise<Attribute[] | undefined | BaseError> {
    try {
      let attribute_query: string;

      const uuid_type =
        await Metamodel_common_functions.getMetaTypeWithMetaUuid(
          client,
          uuidParent,
        );
      if (uuid_type !== undefined) {
        switch (uuid_type) {
          case "scene_type":
            attribute_query = queries.getQuery_post(
              "connect_attribute_sceneType",
            );
            break;

          case "class":
            attribute_query =
              "INSERT INTO class_has_attributes (uuid_class , uuid_attribute) values ($1,$2) ON CONFLICT (uuid_class, uuid_attribute) DO nothing ";
            break;

          case "relationclass":
            attribute_query =
              "INSERT INTO class_has_attributes (uuid_class , uuid_attribute) values ($1,$2) ON CONFLICT (uuid_class, uuid_attribute) DO nothing ";
            break;

          case "port":
            attribute_query =
              "insert into port_has_attributes (uuid_port,uuid_attribute) values ($1,$2) ";
            break;

          default:
            throw new Error(
              `Error the uuid ${uuidParent} cannot be a parent for a attribute`,
            );
        }

        return await this.postAttributeForX(
          client,
          uuidParent,
          newAttribute,
          attribute_query,
          userUuid,
        );
      }
      return undefined;
    } catch (err) {
      throw new Error(`Error creating attribute for ${uuidParent}: ${err}`);
    }
  }

  /**
   * @description - This function delete attributes for a given parent by uuid.
   * @param {PoolClient} client - The client to the database.
   * @param {UUID} uuidParent - The uuid of the parent to delete the attributes for.
   * @param {UUID} userUuid - The uuid of the user who want to delete the attributes.
   * @returns {Promise<UUID[] | undefined>} - The array of uuid of all the objects deleted, undefined otherwise.
   * @throws {Error} - This function throws an error if there is an error deleting the attribute.
   * @memberof Metamodel_attributes_connection
   * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
   * @export
   * @method
   */
  async deleteAllByParentUuid(
    client: PoolClient,
    uuidParent: UUID,
    userUuid?: UUID,
  ): Promise<UUID[] | undefined | BaseError> {
    try {
      let attribute_query: string;

      const uuid_type =
        await Metamodel_common_functions.getMetaTypeWithMetaUuid(
          client,
          uuidParent,
        );
      if (uuid_type !== undefined) {
        switch (uuid_type) {
          case "scene_type":
            attribute_query = queries.getQuery_delete(
              "delete_attributes_for_scene",
            );
            break;

          case "class":
            attribute_query = queries.getQuery_delete(
              "delete_attributes_for_class",
            );
            break;

          case "relationclass":
            attribute_query = queries.getQuery_delete(
              "delete_attributes_for_class",
            );
            break;
          default:
            throw new Error(
              `Error the uuid ${uuidParent} cannot be a parent for a attribute`,
            );
            break;
        }

        return await Metamodel_common_functions.deleteAllItems(
          client,
          attribute_query,
          uuidParent,
          userUuid,
        );
      }
    } catch (err) {
      throw new Error(
        `Error deleting the attributes for the parent ${uuidParent}: ${err}`,
      );
    }
  }

  /**
   * @description - This function delete attribute by uuid.
   * @param {PoolClient} client - The client to the database.
   * @param {UUID} uuidToDelete - The uuid of the attribute to delete.
   * @param {UUID} userUuid - The uuid of the user who want to delete the attribute.
   * @returns {Promise<UUID[] | undefined>} - The array of uuid of all the objects deleted, undefined otherwise.
   * @throws {Error} - This function throws an error if there is an error deleting the attribute.
   * @memberof Metamodel_attributes_connection
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

  /**
   * @description - This function create attributes for a parent by it's UUID.
   * @param {PoolClient} client - The client to the database.
   * @param {UUID} objectUuid - The uuid of the attribute to create.
   * @param {Attribute[] | Attribute} newAttribute - The attribute or an array of attributes to create.
   * @param {string} query_connect - The query to use to create the attribute for different parent.
   * @param {UUID} userUuid - The uuid of the user who want to create the attributes.
   * @returns {Promise<UUID[] | undefined>} - The array of uuid of all the objects deleted, undefined otherwise.
   * @throws {Error} - This function throws an error if there is an error creating the attribute.
   * @memberof Metamodel_attributes_connection
   * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
   * @export - This function is exported so that it can be used by other files.
   * @method
   */
  private async postAttributeForX(
    client: PoolClient,
    objectUuid: UUID,
    newAttribute: Attribute[] | Attribute,
    query_connect: string,
    userUuid?: UUID,
  ): Promise<Attribute[] | undefined | BaseError> {
    try {
      const returnAttributes = new Array<Attribute>();
      let currentAttr;

      if (!Array.isArray(newAttribute)) newAttribute = [newAttribute];

      // If the newAttribute is an array
      for (const attrToAdd of newAttribute) {
        if (
          await Metamodel_common_functions.doesMetaObjectAlreadyExists(
            client,
            attrToAdd.uuid,
          )
        ) {
          currentAttr = await this.getByUuid(client, attrToAdd.uuid, userUuid);
        } else {
          currentAttr = await this.create(client, attrToAdd, userUuid);
        }
        if (currentAttr instanceof Attribute) {
          await client.query(query_connect, [objectUuid, currentAttr.uuid]);
          returnAttributes.push(currentAttr);
        }
      }

      await this.updateForParentUuid(
        client,
        objectUuid,
        newAttribute,
        userUuid,
      );
      return returnAttributes;
    } catch (err) {
      throw new Error(
        `Error creating the attributes for the parent ${objectUuid}: ${err}`,
      );
    }
  }
}

export default new Metamodel_attributesConnection();
