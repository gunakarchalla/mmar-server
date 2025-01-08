import {RequestHandler} from "express";
import {RelationclassInstance} from "../../../../../mmar-global-data-structure";
import {database_connection} from "../../../../index";
import {applyRules} from "./Instance_relationclasses.rules";

export const verif_relationclass_instances_body: RequestHandler = async (
  req,
  res,
  next
) => {
  const relationClassInstanceToTest = RelationclassInstance.fromJS(
    req.body
  ) as RelationclassInstance;
  try {
    await verif_inner_relationclass_instance_body(relationClassInstanceToTest);
    next();
  } catch (err) {
    next(err);
  }
};

export async function verif_inner_relationclass_instance_body(
  relationClassToTest: RelationclassInstance | RelationclassInstance[]
) {
  const client = await database_connection.getPool().connect();

  try {
    if (relationClassToTest instanceof RelationclassInstance) {
      await applyRules(client, relationClassToTest);
    } else {
      for (const relationClassToTestElement of relationClassToTest) {
        await applyRules(client, relationClassToTestElement);
      }
    }
    // eslint-disable-next-line no-useless-catch
  } catch (err) {
    throw err;
  } finally {
    client.release();
  }
}
