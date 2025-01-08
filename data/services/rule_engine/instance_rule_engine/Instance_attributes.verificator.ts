import {RequestHandler} from "express";
import {AttributeInstance} from "../../../../../mmar-global-data-structure";
import {database_connection} from "../../../../index";
import {applyRules} from "./Instance_attributes.rules";

export const verif_attribute_instance_body: RequestHandler = async (
  req,
  res,
  next
) => {
  const attributeToTest = AttributeInstance.fromJS(
    req.body
  ) as AttributeInstance;
  try {
    await verif_inner_attribute_instance_body(attributeToTest);
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * This is the function to check all the rules of the attribute or on the array of attribute
 *
 * @param attributeToTest
 */
export async function verif_inner_attribute_instance_body(
  attributeToTest: AttributeInstance | AttributeInstance[]
) {
  const client = await database_connection.getPool().connect();

  try {
    if (attributeToTest instanceof AttributeInstance) {
      await applyRules(client, attributeToTest);
    } else {
      for (const attributeToTestIntern of attributeToTest) {
        await applyRules(client, attributeToTestIntern);
      }
    }

    // eslint-disable-next-line no-useless-catch
  } catch (err) {
    throw err;
  } finally {
    client.release();
  }
}
