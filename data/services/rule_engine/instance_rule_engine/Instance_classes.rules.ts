/**
 * @module instance/class
 */
import {ClassInstance} from "../../../../../mmar-global-data-structure";
import {metaObjectExists} from "./Instance_commons.rules";
import {PoolClient} from "pg";
import {verif_inner_attribute_instance_body} from "./Instance_attributes.verificator";

/**
 * # Rule applied to this object:
 * all the rule are applied sequentially
 * 1. [[metaObjectExists]] : Check the existence of the meta-object
 * 2. [[instance/attribute | Attribute rules]] : Check if the attributes match the related rules
 *
 */
export async function applyRules(
  client: PoolClient,
  classToTest: ClassInstance
) {
  //new rules comes here
  await metaObjectExists(client, classToTest);
  await verif_inner_attribute_instance_body(classToTest.attribute_instance);
}
