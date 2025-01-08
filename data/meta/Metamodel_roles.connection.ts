import {PoolClient, QueryResult} from "pg";
import {queries} from "../..";
import {ClassReference, Role, UUID,} from "../../../mmar-global-data-structure";
import Metamodel_metaobject_connection from "./Metamodel_metaobjects.connection";

import {CRUD} from "../common/crud.interface";
import Metamodel_references_connection from "./Metamodel_references.connection";
import Metamodel_common_functions from "./Metamodel_common_functions.connection";
import Metamodel_common_functionsController from "./Metamodel_common_functions.connection";
import {
  API404Error,
  BaseError,
  HTTP403NORIGHT,
} from "../services/middleware/error_handling/standard_errors.middleware";

/**
 * @description - This is the class that handles the CRUD operations for the Meta roles.
 * @class Metamodel_rolesConnection
 * @implements {CRUD}
 * @export - This class is exported so that it can be used by other classes.
 */
class Metamodel_rolesConnection implements CRUD {
  /**
   * @description - This function gets the role by uuid.
   * @param {PoolClient} client - The client to the database.
   * @param {UUID} roleUuid - The uuid of the role to get.
   * @param {UUID} userUuid - The uuid of the user that is requesting the role.
   * @returns {Promise<Role | undefined>} - The role with the uuid.
   * @throws {Error} - This function throws an error if there is an error getting the role.
   * @memberof Metamodel_roles_connection
   * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
   * @export - This function is exported so that it can be used by other classes.
   * @method
   */
  async getByUuid(
    client: PoolClient,
    roleUuid: UUID,
    userUuid?: UUID,
  ): Promise<Role | undefined | BaseError> {
    try {
      const role_query = queries.getQuery_get("role_uuid_query");
      let newRole;
      if (userUuid) {
        const read_check = queries.getQuery_get("read_check");
        const res = await client.query(read_check, [roleUuid, userUuid]);
        if (res.rowCount == 0) {
          return new HTTP403NORIGHT(
            `The user ${userUuid} has no right to read the role ${roleUuid}`,
          );
        }
      }
      const res_role = await client.query(role_query, [roleUuid]);

      if (res_role.rowCount == 1) {
        newRole = Role.fromJS(res_role.rows[0]) as Role;

        const classesRef =
          await Metamodel_references_connection.getClassReferences(
            client,
            newRole.uuid,
            userUuid,
          );
        if (Array.isArray(classesRef)) newRole.set_class_reference(classesRef);

        const relationClassRef =
          await Metamodel_references_connection.getRelationclassReferences(
            client,
            newRole.uuid,
            userUuid,
          );
        if (Array.isArray(relationClassRef))
          newRole.set_relationclass_reference(relationClassRef);

        const portRef = await Metamodel_references_connection.getPortReferences(
          client,
          newRole.uuid,
          userUuid,
        );
        if (Array.isArray(portRef)) newRole.set_port_reference(portRef);

        const sceneRef =
          await Metamodel_references_connection.getSceneTypeReferences(
            client,
            newRole.uuid,
            userUuid,
          );
        if (Array.isArray(sceneRef)) newRole.set_scenetype_reference(sceneRef);

        const attributeRef =
          await Metamodel_references_connection.getAttributeReferences(
            client,
            newRole.uuid,
            userUuid,
          );
        if (Array.isArray(attributeRef))
          newRole.set_attribute_reference(attributeRef);
      }

      return newRole;
    } catch (err) {
      throw new Error(`Error getting the role ${roleUuid}: ${err}`);
    }
  }

  /**
   * @description - This function get all the role.
   * @param {PoolClient} client - The client to the database.
   * @param {UUID} userUuid - The uuid of the user that is requesting the role.
   * @returns {Promise<Role[]>} - The array of role if it exists.
   * @throws {Error} - This function throws an error if there is an error getting the role.
   * @memberof Metamodel_roles_connection
   * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
   * @export - This function is exported so that it can be used by other files.
   * @method
   */
  async getAll(
    client: PoolClient,
    userUuid?: UUID,
  ): Promise<Role[] | BaseError> {
    try {
      const role_query = "select uuid_metaobject from role";
      const returnRoles = new Array<Role>();
      const res_roles = await client.query(role_query);

      for (const cl of res_roles.rows) {
        const newRole = await this.getByUuid(
          client,
          cl.uuid_metaobject,
          userUuid,
        );
        if (newRole instanceof Role) {
          returnRoles.push(newRole);
        }
      }
      return returnRoles;
    } catch (err) {
      throw new Error(`Error getting roles: ${err}`);
    }
  }

  /**
   * @description - This function get all the role of a parent by its uuid.
   * @param {PoolClient} client - The client to the database.
   * @param {UUID} uuidParent - The uuid of the parent instance of the role to get.
   * @param {UUID} userUuid - The uuid of the user that is requesting the role.
   * @returns {Promise<Role[]>} - The array of role if it exists.
   * @throws {Error} - This function throws an error if there is an error getting the role.
   * @memberof Metamodel_roles_connection
   * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
   * @export - This function is exported so that it can be used by other files.
   * @method
   */
  async getAllByParentUuid(
    client: PoolClient,
    uuidParent: UUID,
    userUuid?: UUID,
  ): Promise<Role[] | BaseError> {
    try {
      let role_query: string;
      const returnRoles = new Array<Role>();
      const uuid_type =
        await Metamodel_common_functions.getMetaTypeWithMetaUuid(
          client,
          uuidParent,
        );
      if (uuid_type !== undefined) {
        switch (uuid_type) {
          // this needs to be updated to include the full possibilities
          case "class":
            role_query = queries.getQuery_get("class_roles_query");
            break;
          case "attribute_type":
            role_query = queries.getQuery_get("attribute_type_role_query");
            break;

          default:
            throw new Error(
              `Error the uuid ${uuidParent} cannot be a parent for a role`,
            );
        }
        const res_roles = await client.query(role_query, [uuidParent]);
        for (const cl of res_roles.rows) {
          const newRole = await this.getByUuid(client, cl.uuid, userUuid);
          if (newRole instanceof Role) {
            returnRoles.push(newRole);
          }
        }
      }
      return returnRoles;
    } catch (err) {
      throw new Error(
        `Error getting roles for the parent ${uuidParent}: ${err}`,
      );
    }
  }

  async getByAttributeTypeUuid(
    client: PoolClient,
    uuidParent: UUID,
    userUuid?: UUID,
  ): Promise<Role | undefined | BaseError> {
    const roles = await this.getAllByParentUuid(client, uuidParent, userUuid);
    if (Array.isArray(roles) && roles.length === 1) return roles[0];
  }

  /**
   * @description - This function get all the role for a relationclass by passing the role from and the role to.
   * @param {PoolClient} client - The client to the database.
   * @param {UUID} roleFrom - The uuid of the role from
   * @param {UUID} roleTo - The uuid of the role to
   * @param {UUID} userUuid - The uuid of the user that is requesting the role.
   * @returns {Promise<Role[]>} - The array of role if it exists.
   * @throws {Error} - This function throws an error if there is an error getting the role.
   * @memberof Metamodel_roles_connection
   * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
   * @export - This function is exported so that it can be used by other files.
   * @method
   */
  async getAllByRelationclass(
    client: PoolClient,
    roleFrom: UUID,
    roleTo: UUID,
    userUuid?: UUID,
  ): Promise<Role[] | BaseError> {
    try {
      const returnRoles = new Array<Role>();
      const res_roles = await client.query(
        queries.getQuery_get("relationclass_roles_query"),
        [roleFrom, roleTo],
      );
      for (const cl of res_roles.rows) {
        const newRole = await this.getByUuid(client, cl.uuid, userUuid);
        if (newRole instanceof Role) {
          returnRoles.push(newRole);
        }
      }
      return returnRoles;
    } catch (err) {
      throw new Error(`Error getting roles: ${err}`);
    }
  }

  async hardUpdate(
    client: PoolClient,
    roleUuidToUpdate: UUID,
    newRole: Role,
    userUuid?: UUID,
  ): Promise<Role | undefined | BaseError> {
    try {
      const queries: Record<string, string> = {
        class:
          "DELETE FROM role_class_reference WHERE uuid_role = $1 AND uuid_class = $2",
        relationClass:
          "DELETE FROM role_relationclass_reference WHERE uuid_role = $1 AND uuid_relationclass = $2",
        port: "DELETE FROM role_port_reference WHERE uuid_role = $1 AND uuid_port = $2",
        scene:
          "DELETE FROM role_scene_reference WHERE uuid_role = $1 AND uuid_scene_type = $2",
        attribute:
          "DELETE FROM role_attribute_reference WHERE uuid_role = $1 AND uuid_attribute = $2",
      };

      const updated_metaobj = await this.update(
        client,
        roleUuidToUpdate,
        newRole,
        userUuid,
      );
      if (updated_metaobj instanceof BaseError) {
        if (updated_metaobj.httpCode === 403) {
          return new HTTP403NORIGHT(
            `The user ${userUuid} has no right to hard update the role ${roleUuidToUpdate}`,
          );
        }
        return updated_metaobj;
      }
      if (!updated_metaobj) return undefined;

      const currentRole = Role.fromJS(
        await this.getByUuid(client, roleUuidToUpdate),
      ) as Role;

      const referencesToDelete: Record<string, { uuid: string }[]> = {
        class: currentRole.get_class_reference_difference(
          newRole.get_class_reference(),
        ).removed,
        relationClass: currentRole.get_relationclass_reference_difference(
          newRole.get_relationclass_reference(),
        ).removed,
        port: currentRole.get_port_reference_difference(
          newRole.get_port_reference(),
        ).removed,
        scene: currentRole.get_scenetype_reference_difference(
          newRole.get_scenetype_reference(),
        ).removed,
        attribute: currentRole.get_attribute_reference_difference(
          newRole.attribute_references,
        ).removed,
      };

      for (const type of Object.keys(referencesToDelete)) {
        for (const ref of referencesToDelete[type]) {
          await client.query(queries[type], [roleUuidToUpdate, ref.uuid]);
        }
      }

      return await this.getByUuid(client, roleUuidToUpdate, userUuid);
    } catch (err) {
      throw new Error(`Error updating the role ${roleUuidToUpdate}: ${err}`);
    }
  }

  /**
   * @description - This function update a role.
   * @param {PoolClient} client - The client to the database.
   * @param {Role} newRole - The role to update.
   * @param {UUID} roleUuidToUpdate - The uuid of the role to update.
   * @param {UUID} userUuid - The uuid of the user that is requesting the role.
   * @returns {Promise<Role | undefined>} - The role updated, undefined otherwise.
   * @throws {Error} - This function throws an error if there is an error updating the role.
   * @memberof Metamodel_roles_connection
   * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
   * @export - This function is exported so that it can be used by other files.
   * @method
   */
  async update(
    client: PoolClient,
    roleUuidToUpdate: UUID,
    newRole: Role,
    userUuid?: UUID,
  ): Promise<Role | undefined | BaseError> {
    try {
      const updateQueries = {
        class_reference:
          "insert into role_class_reference (min, max,uuid_role,uuid_class) values ($1,$2,$3,$4) ON CONFLICT (uuid_class, uuid_role) DO UPDATE set min = EXCLUDED.min, max = EXCLUDED.max",
        scenetype_reference:
          "insert into role_scene_reference (min, max,uuid_role,uuid_scene_type) values ($1,$2,$3,$4) ON CONFLICT (uuid_scene_type, uuid_role) DO UPDATE set min = EXCLUDED.min, max = EXCLUDED.max",
        port_reference:
          "insert into role_port_reference (min, max,uuid_role,uuid_port) values ($1,$2,$3,$4) ON CONFLICT (uuid_port, uuid_role) DO UPDATE set min = EXCLUDED.min, max = EXCLUDED.max",
        relationclass_reference:
          "insert into role_relationclass_reference (min, max,uuid_role,uuid_relationclass) values ($1,$2,$3,$4) ON CONFLICT (uuid_relationclass, uuid_role) DO UPDATE set min = EXCLUDED.min, max = EXCLUDED.max",
        attribute_reference:
          "insert into role_attribute_reference (min, max,uuid_role,uuid_attribute) values ($1,$2,$3,$4) ON CONFLICT (uuid_attribute, uuid_role) DO UPDATE set min = EXCLUDED.min, max = EXCLUDED.max",
      };
      const updated_metaobj = await Metamodel_metaobject_connection.update(
        client,
        roleUuidToUpdate,
        newRole,
        userUuid,
      );
      if (updated_metaobj instanceof BaseError) {
        if (updated_metaobj.httpCode === 403) {
          return new HTTP403NORIGHT(
            `The user ${userUuid} has no right to update the role ${roleUuidToUpdate}`,
          );
        }
        return updated_metaobj;
      }
      if (!updated_metaobj) return undefined;

      // Helper function to handle class references
      const handleReferenceUpdate = async (
        reference: ClassReference,
        query: string,
      ) => {
        await client.query(query, [
          reference.min,
          reference.max,
          roleUuidToUpdate,
          reference.uuid,
        ]);
      };

      // Update references in parallel
      const updateTasks = [];

      for (const reference of newRole.get_class_reference()) {
        if (
          await Metamodel_common_functionsController.doesMetaObjectAlreadyExists(
            client,
            reference.uuid,
          )
        ) {
          updateTasks.push(
            handleReferenceUpdate(reference, updateQueries.class_reference),
          );
        } else {
          return new API404Error(
            `Error: the class ${reference.uuid} does not exist`,
          );
        }
      }

      for (const reference of newRole.get_scenetype_reference()) {
        updateTasks.push(
          handleReferenceUpdate(reference, updateQueries.scenetype_reference),
        );
      }
      for (const reference of newRole.get_port_reference()) {
        updateTasks.push(
          handleReferenceUpdate(reference, updateQueries.port_reference),
        );
      }
      for (const reference of newRole.get_relationclass_reference()) {
        updateTasks.push(
          handleReferenceUpdate(
            reference,
            updateQueries.relationclass_reference,
          ),
        );
      }
      for (const reference of newRole.attribute_references) {
        updateTasks.push(
          handleReferenceUpdate(reference, updateQueries.attribute_reference),
        );
      }

      await Promise.all(updateTasks);

      return await this.getByUuid(client, roleUuidToUpdate, userUuid);
    } catch (err) {
      throw new Error(`Error updating the role ${roleUuidToUpdate}: ${err}`);
    }
  }

  /**
   * @description - This function create a new role.
   * @param {PoolClient} client - The client to the database.
   * @param {Role} newRole - The role to create.
   * @param {UUID} userUuid - The uuid of the user that is requesting the role.
   * @returns {Promise<Role | undefined>} - The role created, undefined otherwise.
   * @throws {Error} - This function throws an error if there is an error creating the role.
   * @memberof Metamodel_roles_connection
   * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
   * @export - This function is exported so that it can be used by other files.
   * @method
   */
  async create(
    client: PoolClient,
    newRole: Role,
    userUuid?: UUID,
  ): Promise<Role | undefined | BaseError> {
    try {
      const insertQueries = {
        role: "insert into role (uuid_metaobject) values ($1)",
        class_reference:
          "insert into role_class_reference (min, max,uuid_role,uuid_class) values ($1,$2,$3,$4) ON CONFLICT (uuid_class, uuid_role) DO UPDATE set min = EXCLUDED.min, max = EXCLUDED.max",
        scenetype_reference:
          "insert into role_scene_reference (min, max,uuid_role,uuid_scene_type) values ($1,$2,$3,$4) ON CONFLICT (uuid_scene_type, uuid_role) DO UPDATE set min = EXCLUDED.min, max = EXCLUDED.max",
        port_reference:
          "insert into role_port_reference (min, max,uuid_role,uuid_port) values ($1,$2,$3,$4) ON CONFLICT (uuid_port, uuid_role) DO UPDATE set min = EXCLUDED.min, max = EXCLUDED.max",
        relationclass_reference:
          "insert into role_relationclass_reference (min, max,uuid_role,uuid_relationclass) values ($1,$2,$3,$4) ON CONFLICT (uuid_relationclass, uuid_role) DO UPDATE set min = EXCLUDED.min, max = EXCLUDED.max",
        attribute_reference:
          "insert into role_attribute_reference (min, max,uuid_role,uuid_attribute) values ($1,$2,$3,$4) ON CONFLICT (uuid_attribute, uuid_role) DO UPDATE set min = EXCLUDED.min, max = EXCLUDED.max",
      };

      const created_metaObject = await Metamodel_metaobject_connection.create(
        client,
        newRole,
        userUuid,
        "role",
      );

      if (created_metaObject instanceof BaseError) {
        if (created_metaObject.httpCode === 403) {
          return new HTTP403NORIGHT(
            `The user ${userUuid} has no right to create the role`,
          );
        }
        return created_metaObject;
      }
      if (!created_metaObject) return undefined;

      await client.query(insertQueries.role, [created_metaObject.get_uuid()]);

      const createTasks: Promise<QueryResult>[] = [];

      const handleReferenceCreation = async (
        references: ClassReference[],
        query: string,
      ) => {
        for (const reference of references) {
          if (
            await Metamodel_common_functionsController.doesMetaObjectAlreadyExists(
              client,
              reference.uuid,
            )
          ) {
            createTasks.push(
              client.query(query, [
                reference.min,
                reference.max,
                created_metaObject.uuid,
                reference.uuid,
              ]),
            );
          } else {
            return new API404Error(
              `Error: the class ${reference.uuid} does not exist`,
            );
          }
        }
      };

      await handleReferenceCreation(
        newRole.get_class_reference(),
        insertQueries.class_reference,
      );
      await handleReferenceCreation(
        newRole.get_scenetype_reference(),
        insertQueries.scenetype_reference,
      );
      await handleReferenceCreation(
        newRole.get_port_reference(),
        insertQueries.port_reference,
      );
      await handleReferenceCreation(
        newRole.get_relationclass_reference(),
        insertQueries.relationclass_reference,
      );
      await handleReferenceCreation(
        newRole.attribute_references,
        insertQueries.attribute_reference,
      );

      await Promise.all(createTasks);

      await this.update(client, created_metaObject.get_uuid(), newRole);
      return await this.getByUuid(
        client,
        created_metaObject.get_uuid(),
        userUuid,
      );
    } catch (err) {
      throw new Error(`Error creating the role: ${err}`);
    }
  }

  /**
   * @description - This function create a role or an array of role.
   * @param {PoolClient} client - The client to the database.
   * @param {Role[] | Role} newRole - The role or an array of attributes to create.
   * @param {UUID} userUuid - The uuid of the user that is requesting the role.
   * @returns {Promise<Role[] | undefined>} - The array of role created, undefined otherwise.
   * @throws {Error} - This function throws an error if there is an error creating the role.
   * @memberof Metamodel_roles_connection
   * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
   * @export - This function is exported so that it can be used by other files.
   * @method
   */
  async postRoles(
    client: PoolClient,
    newRole: Role[] | Role,
    userUuid?: UUID,
  ): Promise<Role[] | undefined | BaseError> {
    try {
      if (!Array.isArray(newRole)) newRole = [newRole];

      const returnRoles = new Array<Role>();

      for (const role of newRole) {
        const createdRole = await this.create(client, role, userUuid);
        if (createdRole instanceof Role) returnRoles.push(createdRole);
      }
      return returnRoles;
    } catch (err) {
      throw new Error(`Error creating the roles: ${err}`);
    }
  }

  /**
   * @description - This function delete role by uuid.
   * @param {PoolClient} client - The client to the database.
   * @param {UUID} uuidToDelete - The uuid of the role to delete.
   * @param {UUID} userUuid - The uuid of the user that is requesting the role.
   * @returns {Promise<UUID[] | undefined>} - The array of uuid of all the objects deleted, undefined otherwise.
   * @throws {Error} - This function throws an error if there is an error deleting the role.
   * @memberof Metamodel_roles_connection
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

export default new Metamodel_rolesConnection();
