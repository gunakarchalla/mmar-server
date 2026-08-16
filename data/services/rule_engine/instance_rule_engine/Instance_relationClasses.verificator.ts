import {RequestHandler} from "express";
import {RelationclassInstance} from "../../../../../mmar-global-data-structure";
import {PoolClient} from "pg";
import {with_client} from "../../database_connection";
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
  relationClassToTest: RelationclassInstance | RelationclassInstance[],
  client?: PoolClient
) {
  // The rule engine nests, so the connection is threaded down rather than a new
  // one taken at every level: see with_client.
  return await with_client(client, async (c) => {
    if (relationClassToTest instanceof RelationclassInstance) {
      await applyRules(c, relationClassToTest);
    } else {
      for (const element of relationClassToTest) {
        await applyRules(c, element);
      }
    }
  });
}
