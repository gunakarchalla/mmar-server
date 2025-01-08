/**
 * @module instance/relationClass
 */
import {metaObjectExists} from "./Instance_commons.rules";
import {RelationclassInstance} from "../../../../../mmar-global-data-structure";
import {PoolClient} from "pg";
import {verif_inner_attribute_instance_body} from "./Instance_attributes.verificator";
import {verif_inner_class_instance_body} from "./Instance_classes.verificator";

/**
 * # Rule applied to this object:
 * all the rule are applied sequentially
 * 1. [[metaObjectExists]] : Check the existence of the meta-object
 * 2. [[instance/attribute | Attribute rules]] : Check if the attributes match the related rules
 *
 */
export async function applyRules(
  client: PoolClient,
  relationClassToTest: RelationclassInstance
) {
  //new rules comes here

  await metaObjectExists(client, relationClassToTest);
  await verif_inner_attribute_instance_body(
    relationClassToTest.attribute_instance
  );
  await verif_inner_class_instance_body(relationClassToTest);
}
