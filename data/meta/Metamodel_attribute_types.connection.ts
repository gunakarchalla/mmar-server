import {CRUD} from "../common/crud.interface";
import {PoolClient, QueryResult} from "pg";
import {Attribute, AttributeType, Role, UUID,} from "../../../mmar-global-data-structure";
import {queries} from "../../index";
import Metamodel_metaobject_connection from "./Metamodel_metaobjects.connection";
import Metamodel_roles_connection from "./Metamodel_roles.connection";
import Metamodel_rolesConnection from "./Metamodel_roles.connection";
import Metamodel_common_functions from "./Metamodel_common_functions.connection";
import Metamodel_attributes_connection from "./Metamodel_attributes.connection";
import {ColumnStructure} from "../../../mmar-global-data-structure/models/meta/Metamodel_columns.structure";
import {BaseError, HTTP403NORIGHT,} from "../services/middleware/error_handling/standard_errors.middleware";

/**
 * @description - This is the class that handles the CRUD operations for the Meta Attribute type.
 * @class Metamodel_attribute_typesConnection
 * @implements {CRUD}
 * @export - This class is exported so that it can be used by other classes.
 */
class Metamodel_attribute_typesConnection implements CRUD {
  async getAll(
    client: PoolClient,
    userUuid?: UUID,
  ): Promise<AttributeType[] | BaseError> {
    try {
      const attributeType_query =
        "SELECT uuid_metaobject as uuid FROM attribute_type;";
      const returnAttributeType = new Array<AttributeType>();
      const res_classes = await client.query(attributeType_query);

      for (const cl of res_classes.rows) {
        const newAttrType = await this.getByUuid(client, cl.uuid, userUuid);
        if (newAttrType instanceof AttributeType)
          returnAttributeType.push(newAttrType);
      }
      return returnAttributeType;
    } catch (error) {
      throw new Error(`Error getting all the attribute types: ${error}`);
    }
  }

  /**
   * @description - This function gets the attribute type by uuid.
   * @param {PoolClient} client - The client to the database.
   * @param {UUID} attributeTypeUuid - The uuid of the attribute type to get.
   * @param {UUID} userUuid - The uuid of the user that want to get the attribute type.
   * @returns {Promise<AttributeType | undefined>} - The attribute type if it exists, undefined otherwise.
   * @throws {Error} - This function throws an error if there is an error getting the attribute type.
   * @memberof Metamodel_attribute_types_connection
   * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
   * @export  - This function is exported so that it can be used by other files.
   * @method
   */
  async getByUuid(
    client: PoolClient,
    attributeTypeUuid: UUID,
    userUuid?: UUID,
  ): Promise<AttributeType | undefined | BaseError> {
    try {
      let newAttributeType;
      const attributeType_query = queries.getQuery_get(
        "attribute_type_uuid_query",
      );
      const table_attribute_query = queries.getQuery_get(
        "get_sequence_attr_by_attrType_uuid",
      );

      if (userUuid) {
        const read_check = queries.getQuery_get("read_check");
        const res = await client.query(read_check, [
          attributeTypeUuid,
          userUuid,
        ]);
        if (res.rowCount == 0) {
          return new HTTP403NORIGHT(
            `The user ${userUuid} has no right to read the attribute type ${attributeTypeUuid}`,
          );
        }
      }
      const res_attributeType = await client.query(attributeType_query, [
        attributeTypeUuid,
      ]);

      if (res_attributeType.rowCount == 1) {
        newAttributeType = AttributeType.fromJS(
          res_attributeType.rows[0],
        ) as AttributeType;

        const role = await Metamodel_roles_connection.getByAttributeTypeUuid(
          client,
          attributeTypeUuid,
          userUuid,
        );
        if (role instanceof Role) newAttributeType.set_role(role);

        // part to get the attributes table of the attribute type
        const res_attr_table: QueryResult<{
          sequence: number;
          uuid_attribute: string;
        }> = await client.query(table_attribute_query, [attributeTypeUuid]);
        if (res_attr_table.rowCount && res_attr_table.rowCount > 0) {
          const columns = new Array<ColumnStructure>();
          for (const attr of res_attr_table.rows) {
            const full_attr = await Metamodel_attributes_connection.getByUuid(
              client,
              attr.uuid_attribute,
            );
            if (full_attr instanceof Attribute) {
              columns.push(new ColumnStructure(full_attr, attr.sequence));
            }
          }
          newAttributeType.set_has_table_attribute(columns);
        }
      }
      return newAttributeType;
    } catch (err) {
      throw new Error(
        `Error getting the attribute type ${attributeTypeUuid}: ${err}`,
      );
    }
  }

  /**
   * @description - This function get all the attribute type of a parent instance by its uuid.
   * @param {PoolClient} client - The client to the database.
   * @param {UUID} uuidParent - The uuid of the parent instance of the attribute type to get.
   * @param {UUID} userUuid - The uuid of the user that want to get the attribute type.
   * @returns {Promise<AttributeType[]>} - The array of attribute type if it exists, undefined otherwise.
   * @throws {Error} - This function throws an error if there is an error getting the attribute type.
   * @memberof Metamodel_attribute_types_connection
   * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
   * @export - This function is exported so that it can be used by other files.
   * @method
   */
  async getAllByParentUuid(
    client: PoolClient,
    uuidParent: UUID,
    userUuid?: UUID,
  ): Promise<AttributeType[] | BaseError> {
    try {
      let attrType_query: string;
      const returnAttrType = new Array<AttributeType>();
      const uuid_type =
        await Metamodel_common_functions.getMetaTypeWithMetaUuid(
          client,
          uuidParent,
        );
      if (uuid_type !== undefined) {
        switch (uuid_type) {
          case "attribute":
            attrType_query = queries.getQuery_get("attribute_type_query");
            break;
          default:
            throw new Error(
              `Error the uuid ${uuidParent} cannot be a parent for an attribute`,
            );
        }
        const res_classes = await client.query(attrType_query, [uuidParent]);
        for (let cl of res_classes.rows) {
          cl = AttributeType.fromJS(cl) as AttributeType;
          const newAttrType = await this.getByUuid(
            client,
            cl.get_uuid(),
            userUuid,
          );
          if (newAttrType instanceof AttributeType)
            returnAttrType.push(newAttrType);
        }
      }
      return returnAttrType;
    } catch (err) {
      throw new Error(
        `Error getting the attribute type for the parent ${uuidParent}: ${err}`,
      );
    }
  }

  /**
   * @description - This function create a new attribute type.
   * @param {PoolClient} client - The client to the database.
   * @param {AttributeType} newAttributeType - The attribute type to create.
   * @param {UUID} userUuid - The uuid of the user that want to create the attribute type.
   * @returns {Promise<AttributeType | undefined>} - The attribute type created, undefined otherwise.
   * @throws {Error} - This function throws an error if there is an error creating the attribute type.
   * @memberof Metamodel_attribute_types_connection
   * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
   * @export - This function is exported so that it can be used by other files.
   * @method
   */
  async create(
    client: PoolClient,
    newAttributeType: AttributeType,
    userUuid?: UUID,
  ): Promise<AttributeType | undefined | BaseError> {
    try {
      const query_create_attributeType = queries.getQuery_post(
        "create_attributeType",
      );

      const created_metaObject = await Metamodel_metaobject_connection.create(
        client,
        newAttributeType,
        userUuid,
        "attribute_type",
      );

      if (created_metaObject instanceof BaseError) {
        if (created_metaObject.httpCode === 403) {
          return new HTTP403NORIGHT(
            `The user ${userUuid} has no right to create the attribute type`,
          );
        }
        return created_metaObject;
      }
      if (!created_metaObject) return undefined;

      await client.query(query_create_attributeType, [
        created_metaObject.get_uuid(),
      ]);
      await this.update(
        client,
        created_metaObject.get_uuid(),
        newAttributeType,
      );
      return await this.getByUuid(client, created_metaObject.get_uuid());
    } catch (err) {
      throw new Error(`Error creating the attribute type: ${err}`);
    }
  }

  /**
   * @description - This function create attribute type for the attribute by the uuid.
   * @param {PoolClient} client - The client to the database.
   * @param {UUID} attrUUID - The uuid of the attribute.
   * @param {Attribute} newAttributeType - The attribute type or an array of attribute types to create.
   * @param {UUID} userUuid - The uuid of the user that want to create the attribute type.
   * @returns {Promise<AttributeType | undefined>} - The attribute type created, undefined otherwise.
   * @throws {Error} - This function throws an error if there is an error creating the attribute type.
   * @memberof Metamodel_attribute_types_connection
   * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
   * @export - This function is exported so that it can be used by other files.
   * @method
   */
  async postAttributeTypeForAttribute(
    client: PoolClient,
    attrUUID: UUID,
    newAttributeType: AttributeType,
    userUuid?: UUID,
  ): Promise<AttributeType | undefined | BaseError> {
    try {
      const query_connect_attribute_attributeType = queries.getQuery_post(
        "connect_attribute_attributeType",
      ); // $1 class uuid, $2 attribute uuid
      let attrTypeToReturn;
      attrTypeToReturn = await this.create(client, newAttributeType, userUuid);
      if (attrTypeToReturn instanceof BaseError) {
        if (attrTypeToReturn.httpCode === 403) {
          return new HTTP403NORIGHT(
            `The user ${userUuid} has no right to create the attribute type`,
          );
        }
        return attrTypeToReturn;
      }
      //if (!attrTypeToReturn) return undefined;

      if (attrTypeToReturn instanceof AttributeType) {
        // attribute type was created
        await client.query(query_connect_attribute_attributeType, [
          attrTypeToReturn.get_uuid(),
          attrUUID,
        ]);
      } else {
        // attribute type already exists
        await client.query(query_connect_attribute_attributeType, [
          newAttributeType.get_uuid(),
          attrUUID,
        ]);
        attrTypeToReturn = await this.getByUuid(
          client,
          newAttributeType.get_uuid(),
        );
      }
      return attrTypeToReturn;
    } catch (err) {
      throw new Error(
        `Error creating the attribute type for the attribute ${attrUUID}: ${err}`,
      );
    }
  }

  /**
   * @description - This function Connect a column to an attribute type table.
   * @param {PoolClient} client - The client to the database.
   * @param {UUID} attrTypeUuid - The uuid of the attribute type (table).
   * @param {ColumnStructure[] | ColumnStructure} newColumn - The column or an array of columns to connect.
   * @param {UUID} userUuid - The uuid of the user that want to connect the column.
   * @returns {Promise<void>} - This function returns a promise that is resolved when the connection is done.
   * @throws {Error} - This function throws an error if there is an error connecting the attributes to the attribute type.
   * @memberof Metamodel_attribute_types_connection
   * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
   * @export - This function is exported so that it can be used by other files.
   * @method
   */
  async connectColumnToAttributeType(
    client: PoolClient,
    attrTypeUuid: UUID,
    newColumn: ColumnStructure | ColumnStructure[],
    userUuid?: UUID,
  ): Promise<void | BaseError> {
    try {
      // create the attributes columns if the attribute is a table
      const query_connect_attrType_attr = queries.getQuery_post(
        "connect_attributeType_attribute",
      );

      if (!Array.isArray(newColumn)) newColumn = [newColumn];

      for (const attr of newColumn) {
        if (
          await Metamodel_common_functions.doesMetaObjectAlreadyExists(
            client,
            attr.get_attribute().get_uuid(),
          )
        ) {
          // if the attribute already exists, we connect it to the attribute type

          await client.query(
            "INSERT INTO public.has_table_attribute (sequence, uuid_attribute_type, uuid_attribute) VALUES ($1, $2, $3);",
            [
              attr.get_sequence(),
              attrTypeUuid,
              attr.get_attribute().get_uuid(),
            ],
          );
        } else {
          // if the attribute does not exist, we create it and connect it to the attribute type
          const newAttrTable = await Metamodel_attributes_connection.create(
            client,
            attr.get_attribute(),
            userUuid,
          );
          if (newAttrTable instanceof Attribute) {
            await client.query(query_connect_attrType_attr, [
              attr.get_sequence(),
              attrTypeUuid,
              newAttrTable.get_uuid(),
            ]);
          }
        }
      }
    } catch (err) {
      throw new Error(
        `Error connecting the attribute table type ${attrTypeUuid} to the attributes ${newColumn}: ${err}`,
      );
    }
  }

  /**
   * @description - This function update an attribute type.
   * @param {PoolClient} client - The client to the database.
   * @param {AttributeType} newAttributeType - The attribute type to update.
   * @param {UUID} attrTypeUuidToUpdate - The uuid of the attribute type to update.
   * @param {UUID} userUuid - The uuid of the user that want to update the attribute type.
   * @returns {Promise<AttributeType | undefined>} - The attribute type updated, undefined otherwise.
   * @throws {Error} - This function throws an error if there is an error updating the attribute type.
   * @memberof Metamodel_attribute_types_connection
   * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
   * @export - This function is exported so that it can be used by other files.
   * @method
   */
  async update(
    client: PoolClient,
    attrTypeUuidToUpdate: UUID,
    newAttributeType: AttributeType,
    userUuid?: UUID,
    fromHardUpdate?: boolean,
  ): Promise<AttributeType | undefined | BaseError> {
    try {
      const query_update_attributeType = queries.getQuery_post(
        "update_attributeType",
      );

      const updated_metaobj = await Metamodel_metaobject_connection.update(
        client,
        attrTypeUuidToUpdate,
        newAttributeType,
        userUuid,
      );

      if (updated_metaobj instanceof BaseError) {
        if (updated_metaobj.httpCode === 403) {
          return new HTTP403NORIGHT(
            `The user ${userUuid} has no right to update the attribute type ${attrTypeUuidToUpdate}`,
          );
        }
        return updated_metaobj;
      }
      if (!updated_metaobj) return undefined;

      const current_attrType = AttributeType.fromJS(
        await this.getByUuid(client, attrTypeUuidToUpdate),
      ) as AttributeType;
      const query_update_column = queries.getQuery_post(
        "update_has_table_attribute",
      );

      await client.query(query_update_attributeType, [
        newAttributeType.get_pre_defined(),
        newAttributeType.get_regex_value(),
        attrTypeUuidToUpdate,
      ]);

      if (newAttributeType.get_role()) {
        if (current_attrType.get_role()) {
          if (fromHardUpdate) {
            await Metamodel_rolesConnection.hardUpdate(
              client,
              newAttributeType.get_role().get_uuid(),
              newAttributeType.get_role(),
              userUuid,
            );
          } else {
            await Metamodel_rolesConnection.update(
              client,
              newAttributeType.get_role().get_uuid(),
              newAttributeType.get_role(),
              userUuid,
            );
          }
        } else {
          await Metamodel_rolesConnection.create(
            client,
            newAttributeType.get_role(),
            userUuid,
          );
        }
        const updateQuery =
          "UPDATE role SET uuid_attribute_type=coalesce($1,uuid_attribute_type) WHERE uuid_metaobject = $2";
        await client.query(updateQuery, [
          attrTypeUuidToUpdate,
          newAttributeType.get_role().get_uuid(),
        ]);
      }

      const columnsDifference =
        current_attrType.get_has_table_attribute_difference(
          newAttributeType.get_has_table_attribute(),
        );

      await this.connectColumnToAttributeType(
        client,
        current_attrType.get_uuid(),
        columnsDifference.added,
      );

      for (const column of columnsDifference.modified) {
        await client.query(query_update_column, [
          column.get_attribute().get_uuid(),
          current_attrType.get_uuid(),
          column.get_sequence(),
        ]);
      }

      return await this.getByUuid(client, attrTypeUuidToUpdate, userUuid);
    } catch (err) {
      throw new Error(
        `Error updating the attribute type ${attrTypeUuidToUpdate}: ${err}`,
      );
    }
  }

  async hardUpdate(
    client: PoolClient,
    attrTypeUuidToUpdate: UUID,
    newAttributeType: AttributeType,
    userUuid?: UUID,
  ): Promise<AttributeType | undefined | BaseError> {
    try {
      const updated_metaobj = await this.update(
        client,
        attrTypeUuidToUpdate,
        newAttributeType,
        userUuid,
        true,
      );

      if (updated_metaobj instanceof BaseError) {
        if (updated_metaobj.httpCode === 403) {
          return new HTTP403NORIGHT(
            `The user ${userUuid} has no right to hard update the attribute type ${attrTypeUuidToUpdate}`,
          );
        }
        return updated_metaobj;
      }
      if (!updated_metaobj) return undefined;

      const current_attrType = AttributeType.fromJS(
        await this.getByUuid(client, attrTypeUuidToUpdate),
      ) as AttributeType;

      if (!newAttributeType.get_role() && current_attrType.get_role()) {
        // the role has been removed
        await Metamodel_rolesConnection.deleteByUuid(
          client,
          current_attrType.get_role().get_uuid(),
          userUuid,
        );
      }

      const columnsRemoved =
        current_attrType.get_has_table_attribute_difference(
          newAttributeType.get_has_table_attribute(),
        ).removed;
      for (const column of columnsRemoved) {
        await client.query(
          "DELETE FROM has_table_attribute where uuid_attribute = $1 and uuid_attribute_type =$2",
          [column.get_attribute().get_uuid(), newAttributeType.get_uuid()],
        );
      }

      return await this.getByUuid(client, attrTypeUuidToUpdate, userUuid);
    } catch (err) {
      throw new Error(
        `Error updating the attribute type ${attrTypeUuidToUpdate}: ${err}`,
      );
    }
  }

  /**
   * @description - This function delete attribute type by uuid.
   * @param {PoolClient} client - The client to the database.
   * @param {UUID} uuidToDelete - The uuid of the attribute type to delete.
   * @param {UUID} userUuid - The uuid of the user that want to delete the attribute type.
   * @returns {Promise<UUID[] | undefined>} - The array of uuid of all the objects deleted, undefined otherwise.
   * @throws {Error} - This function throws an error if there is an error deleting the attribute type.
   * @memberof Metamodel_attribute_types_connection
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

export default new Metamodel_attribute_typesConnection();
