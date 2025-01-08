import {RequestHandler} from "express";
import {ClassInstance} from "../../../../../mmar-global-data-structure";
import {database_connection} from "../../../../index";
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
  classToTest: ClassInstance | ClassInstance[]
) {
  const client = await database_connection.getPool().connect();

  try {
    if (classToTest instanceof ClassInstance) {
      await applyRules(client, classToTest);
    } else {
      for (const classInstanceToTestInner of classToTest) {
        await applyRules(client, classInstanceToTestInner);
      }
    }
    // eslint-disable-next-line no-useless-catch
  } catch (err) {
    throw err;
  } finally {
    client.release();
  }
}
