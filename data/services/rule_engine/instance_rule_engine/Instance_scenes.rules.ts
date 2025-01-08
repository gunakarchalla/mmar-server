/**
 * @module instance/scene
 */
import {SceneInstance} from "../../../../../mmar-global-data-structure";
import {metaObjectExists} from "./Instance_commons.rules";
import {PoolClient} from "pg";
import {verif_inner_class_instance_body} from "./Instance_classes.verificator";
import {verif_inner_relationclass_instance_body} from "./Instance_relationClasses.verificator";
import {verif_inner_role_instance_body} from "./Instance_roles.verificator";
import {verif_inner_attribute_instance_body} from "./Instance_attributes.verificator";
import {verif_inner_port_instance_body} from "./Instance_ports.verificator";

/**
 * # Rule applied to this object:
 * all the rule are applied sequentially
 * 1. [[metaObjectExists]] : Check the existence of the meta-object
 * 2. [[instance/class | Class rules]] : Check if the classes match the related rules
 * 2. [[instance/relationClass | RelationClass rules]] : Check if the relationClasses match the related rules
 * 2. [[instance/role | Role rules]] : Check if the role match the related rules
 * 2. [[instance/attribute | Attribute rules]] : Check if the attributes match the related rules
 * 2. [[instance/port | Port rules]] : Check if the port match the related rules
 *
 */
export async function applyRules(
  client: PoolClient,
  sceneToTest: SceneInstance
) {
  //new rules comes here
  await metaObjectExists(client, sceneToTest);
  await verif_inner_class_instance_body(sceneToTest.class_instances);
  await verif_inner_relationclass_instance_body(
    sceneToTest.relationclasses_instances
  );
  await verif_inner_role_instance_body(sceneToTest.role_instances);
  await verif_inner_attribute_instance_body(sceneToTest.attribute_instances);
  await verif_inner_port_instance_body(sceneToTest.port_instances);
}
