import {RequestHandler} from "express";
import {ClassInstance} from "../../../../../mmar-global-data-structure";
import {PoolClient} from "pg";
import {with_client} from "../../database_connection";
import {applyRules} from "./Instance_classes.rules";

export const verif_class_instance_body: RequestHandler = async (
  req,
  res,
  next
) => {
  const classToTest = ClassInstance.fromJS(req.body) as ClassInstance;
  try {
    await verif_inner_class_instance_body(classToTest);
    next();
  } catch (err) {
    next(err);
  }
};

export async function verif_inner_class_instance_body(
  classToTest: ClassInstance | ClassInstance[],
  client?: PoolClient
) {
  // The rule engine nests, so the connection is threaded down rather than a new
  // one taken at every level: see with_client.
  return await with_client(client, async (c) => {
    if (classToTest instanceof ClassInstance) {
      await applyRules(c, classToTest);
    } else {
      for (const element of classToTest) {
        await applyRules(c, element);
      }
    }
  });
}
