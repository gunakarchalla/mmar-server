import {RequestHandler} from "express";
import {RoleInstance, UUID} from "../../../../../mmar-global-data-structure";
import {database_connection} from "../../../../index";
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
  roleToTest: RoleInstance | RoleInstance[]
) {
  const client = await database_connection.getPool().connect();

  try {
    if (roleToTest instanceof RoleInstance) {
      await applyRules(client, roleToTest);
    } else {
      for (const roleInstanceToTestIntern of roleToTest) {
        await applyRules(client, roleInstanceToTestIntern);
      }
    }
    // eslint-disable-next-line no-useless-catch
  } catch (err) {
    throw err;
  } finally {
    client.release();
  }
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
  roleInstanceUuidToDelete: UUID
) {
  const client = await database_connection.getPool().connect();
  try {
    await applyDeletionRules(client, roleInstanceUuidToDelete);

    // eslint-disable-next-line no-useless-catch
  } catch (err) {
    throw err;
  } finally {
    client.release();
  }
}
