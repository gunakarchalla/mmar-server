import {RequestHandler} from "express";
import {RoleInstance, UUID} from "../../../../../mmar-global-data-structure";
import {PoolClient} from "pg";
import {with_client} from "../../database_connection";
import {applyDeletionRules, applyRules} from "./Instance_roles.rules";

/**
 * This function is used to verify the content of the role body, this is called before the creation of the role
 * @param req
 * @param res
 * @param next
 */
export const verif_role_instance_body: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const roleInstanceToTest = RoleInstance.fromJS(req.body) as RoleInstance;
    await verif_inner_role_instance_body(roleInstanceToTest);
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * This function is a helper class to because
 * @param roleToTest
 */
export async function verif_inner_role_instance_body (
  roleToTest: RoleInstance | RoleInstance[],
  client?: PoolClient
) {
  // The rule engine nests, so the connection is threaded down rather than a new
  // one taken at every level: see with_client.
  return await with_client(client, async (c) => {
    if (roleToTest instanceof RoleInstance) {
      await applyRules(c, roleToTest);
    } else {
      for (const element of roleToTest) {
        await applyRules(c, element);
      }
    }
  });
}

/**
 * This function is used to verify the rule before the deletion of the role
 * @param req
 * @param res
 * @param next
 */
export const verif_role_instance_deletion: RequestHandler = async (
  req,
  res,
  next
) => {
  await verif_inner_role_instance_deletion(req.params.uuid);
  next();
};

/**
 * This function is a helper function to verify the rule before the deletion of the role
 * @param roleInstanceUuidToDelete
 */
export async function verif_inner_role_instance_deletion(
  roleInstanceUuidToDelete: UUID,
  client?: PoolClient
) {
  return await with_client(client, async (c) => {
    await applyDeletionRules(c, roleInstanceUuidToDelete);
  });
}
