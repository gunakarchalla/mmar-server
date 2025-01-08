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
import Metamodel_attributes_connection from "../../../meta/Metamodel_attributes.connection";
import Metamodel_scenetypes_connection from "../../../meta/Metamodel_scenetypes.connection";
import Metamodel_classes_connection from "../../../meta/Metamodel_classes.connection";
import Metamodel_relationclasses_connection from "../../../meta/Metamodel_relationclasses.connection";
import Metamodel_ports_connection from "../../../meta/Metamodel_ports.connection";
import Metamodel_roles_connection from "../../../meta/Metamodel_roles.connection";

/**
 * This rule check the existence of the related meta object in the database
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
      (await Metamodel_attributes_connection.getByUuid(
        client,
        objectToTest.uuid_attribute
      )) != undefined
    ) {
      return true;
    } else {
      throw new HTTP403Constrain(
        `The rule error was fired for the attribute ${objectToTest.uuid}: The meta attribute ${objectToTest.uuid_attribute} does not exist`
      );
    }
  } else if (objectToTest instanceof SceneInstance) {
    if (
      (await Metamodel_scenetypes_connection.getByUuid(
        client,
        objectToTest.uuid_scene_type
      )) != undefined
    ) {
      return true;
    } else {
      throw new HTTP403Constrain(
        `The rule error was fired for the scene instance ${objectToTest.uuid}: The scene type ${objectToTest.uuid_scene_type} does not exist`
      );
    }
  } else if (objectToTest instanceof RelationclassInstance) {
    if (
      (await Metamodel_relationclasses_connection.getByUuid(
        client,
        objectToTest.uuid_relationclass
      )) != undefined
    ) {
      return true;
    } else {
      throw new HTTP403Constrain(
        `The rule error was fired for the relationclass ${objectToTest.uuid}: The meta relationclass ${objectToTest.uuid_relationclass} does not exist`
      );
    }
  } else if (objectToTest instanceof ClassInstance) {
    if (
      (await Metamodel_classes_connection.getByUuid(
        client,
        objectToTest.uuid_class
      )) != undefined
    ) {
      return true;
    } else {
      throw new HTTP403Constrain(
        `The rule error was fired for the class ${objectToTest.uuid}: The meta class ${objectToTest.uuid_class} does not exist`
      );
    }
  } else if (objectToTest instanceof PortInstance) {
    if (
      (await Metamodel_ports_connection.getByUuid(
        client,
        objectToTest.uuid_port
      )) != undefined
    ) {
      return true;
    } else {
      throw new HTTP403Constrain(
        `The rule error was fired for the port ${objectToTest.uuid}: The meta port ${objectToTest.uuid_port} does not exist`
      );
    }
  } else if (objectToTest instanceof RoleInstance) {
    if (
      (await Metamodel_roles_connection.getByUuid(
        client,
        objectToTest.uuid_role
      )) != undefined
    ) {
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
