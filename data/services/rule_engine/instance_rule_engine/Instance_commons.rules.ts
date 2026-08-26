/**
 * @module instance/common
 */
import {
    AttributeInstance,
    ClassInstance,
    ObjectInstance,
    PortInstance,
    RelationclassInstance,
    RoleInstance,
    SceneInstance
} from "../../../../../mmar-global-data-structure";
import {HTTP403Constrain, HTTP500Error} from "../../middleware/error_handling/standard_errors.middleware";
import {PoolClient} from "pg";
import {meta_object_exists} from "./Metamodel_probe";

/**
 * This rule check the existence of the related meta object in the database
 *
 * Each branch used to call the matching Metamodel_*_connection.getByUuid and
 * compare the result to undefined, which loads an entire subtree to answer a
 * yes/no question and asks it again for every object in the body. meta_object_exists
 * runs the same WHERE clause as one row, once per distinct uuid per request.
 * The branches, their order - RelationclassInstance extends ClassInstance and so
 * has to come first - and the messages are otherwise unchanged.
 *
 * @category Rules
 * @param client
 * @param objectToTest The object instance that have to have the existing meta object.
 */
export async function metaObjectExists(
  client: PoolClient,
  objectToTest: ObjectInstance
): Promise<boolean> {
  if (objectToTest instanceof AttributeInstance) {
    if (
      await meta_object_exists(client, "attribute", objectToTest.uuid_attribute)
    ) {
      return true;
    } else {
      throw new HTTP403Constrain(
        `The rule error was fired for the attribute ${objectToTest.uuid}: The meta attribute ${objectToTest.uuid_attribute} does not exist`
      );
    }
  } else if (objectToTest instanceof SceneInstance) {
    if (
      await meta_object_exists(client, "scene_type", objectToTest.uuid_scene_type)
    ) {
      return true;
    } else {
      throw new HTTP403Constrain(
        `The rule error was fired for the scene instance ${objectToTest.uuid}: The scene type ${objectToTest.uuid_scene_type} does not exist`
      );
    }
  } else if (objectToTest instanceof RelationclassInstance) {
    if (
      await meta_object_exists(client, "relationclass", objectToTest.uuid_relationclass)
    ) {
      return true;
    } else {
      throw new HTTP403Constrain(
        `The rule error was fired for the relationclass ${objectToTest.uuid}: The meta relationclass ${objectToTest.uuid_relationclass} does not exist`
      );
    }
  } else if (objectToTest instanceof ClassInstance) {
    if (await meta_object_exists(client, "class", objectToTest.uuid_class)) {
      return true;
    } else {
      throw new HTTP403Constrain(
        `The rule error was fired for the class ${objectToTest.uuid}: The meta class ${objectToTest.uuid_class} does not exist`
      );
    }
  } else if (objectToTest instanceof PortInstance) {
    if (await meta_object_exists(client, "port", objectToTest.uuid_port)) {
      return true;
    } else {
      throw new HTTP403Constrain(
        `The rule error was fired for the port ${objectToTest.uuid}: The meta port ${objectToTest.uuid_port} does not exist`
      );
    }
  } else if (objectToTest instanceof RoleInstance) {
    if (await meta_object_exists(client, "role", objectToTest.uuid_role)) {
      return true;
    } else {
      throw new HTTP403Constrain(
        `The rule error was fired for the role ${objectToTest.uuid}: The meta role ${objectToTest.uuid_role} does not exist`
      );
    }
  } else {
    throw new HTTP500Error();
  }
}
