import {RequestHandler} from "express";
import {AttributeInstance} from "../../../../../mmar-global-data-structure";
import {PoolClient} from "pg";
import {with_client} from "../../database_connection";
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
  attributeToTest: AttributeInstance | AttributeInstance[],
  client?: PoolClient
) {
  // The rule engine nests, so the connection is threaded down rather than a new
  // one taken at every level: see with_client.
  return await with_client(client, async (c) => {
    if (attributeToTest instanceof AttributeInstance) {
      await applyRules(c, attributeToTest);
    } else {
      for (const element of attributeToTest) {
        await applyRules(c, element);
      }
    }
  });
}
