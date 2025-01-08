/**
 * In this file there are all the rule that are applied to the role instance
 * @module instance/role
 */
import {metaObjectExists} from "./Instance_commons.rules";
import {RelationclassInstance, RoleInstance, UUID,} from "../../../../../mmar-global-data-structure";
import {PoolClient} from "pg";
import Instance_role_connection from "../../../instance/Instance_roles.connection";
import {HTTP403Constrain} from "../../middleware/error_handling/standard_errors.middleware";
import Instance_relationclass_connection from "../../../instance/Instance_relationclasses.connection";
import instance_relationclass_connection from "../../../instance/Instance_relationclasses.connection";

/**
 * # Rule applied to this object:
 * ## Rule applied for the insertion into the database
 * all the rule are applied sequentially
 * 1. [[metaObjectExists]] : Check the existence of the meta-object
 *
 */
export async function applyRules(client: PoolClient, roleToTest: RoleInstance) {
  //new rules comes here
  await metaObjectExists(client, roleToTest);
}

/**
 * # Rule applied to this object:
 * ## Rule applied for the deletion in the database
 * all the rule are applied sequentially
 * 1. [[deleteRelationclassIfRoleFromTo]] : Check if the role is connected to a parent
 * @param client
 * @param roleToTest
 */
export async function applyDeletionRules(
  client: PoolClient,
  roleUuidToTest: UUID
) {
  await roleExists(client, roleUuidToTest);
  await deleteRelationclassIfRoleFromTo(client, roleUuidToTest);
}

/**
 * This rule test is the role exists in the database
 * @param client
 * @param roleToTest
 */
async function roleExists(
  client: PoolClient,
  roleToTest: UUID
): Promise<boolean> {
  const role = await Instance_role_connection.getByUuid(client, roleToTest);
  if (role === undefined) {
    throw new HTTP403Constrain(
      `The rule error was fired for the role ${roleToTest}: The role does not exist or the uuid is not a role`
    );
  } else {
    return true;
  }
}

async function deleteRelationclassIfRoleFromTo(
  client: PoolClient,
  roleUuidToTest: UUID
): Promise<boolean> {
  const relationclassrelated =
    await Instance_relationclass_connection.getRelationclassIfRoleFromOrTo(
      client,
      roleUuidToTest
    );
  if (relationclassrelated instanceof RelationclassInstance) {
    // delete the relation class if the role is the from or to role
    await instance_relationclass_connection.deleteByUuid(
      client,
      relationclassrelated.uuid
    );
    return true;
  } else {
    return false;
  }
}
