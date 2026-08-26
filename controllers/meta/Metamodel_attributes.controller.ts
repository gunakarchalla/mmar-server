import {RequestHandler} from "express";
import {plainToInstance} from "class-transformer";
import {Attribute} from "../../../mmar-global-data-structure";
import {
    BaseError,
    HTTP500Error,
} from "../../data/services/middleware/error_handling/standard_errors.middleware";
import Metamodel_attributes_connection from "../../data/meta/Metamodel_attributes.connection";
import { requireUser } from "../../data/services/middleware/auth.middleware";
import { withTransaction } from "../../data/services/transaction";

/**
 * @classdesc - This class is used to handle all the requests for the meta attributes.
 * @export - The class is exported so that it can be used by other files.
 * @class - Metamodel_attributes_controller
 */
class Metamodel_attributesController {
  get_all_attributes: RequestHandler = withTransaction(async (client, req) => {
  const sc = await Metamodel_attributes_connection.getAll(
    client,
    requireUser(req).uuid,
  );
  if (Array.isArray(sc)) {
    return sc;
  } else if (sc instanceof BaseError) {
    throw sc;
  } else {
    throw new HTTP500Error(`Failed to retrieve meta attributes`);
  }
  });

  /**
   * @description - Get a specific meta attribute by its UUID.
   * @param {UUID} req.params.uuid - The uuid of the meta attribute.
   * @param res
   * @param next
   * @yield {status: 200, body: {Attribute}} - The meta attribute.
   * @throws {HTTP404Error} - If the meta attribute is not found.
   * @throws {HTTP500Error} - If the acquisition of the meta attribute fails.
   * @memberof Metamodel_attributes_controller
   * @method
   */
  get_attribute_by_uuid: RequestHandler = withTransaction(async (client, req) => {
  const sc = await Metamodel_attributes_connection.getByUuid(
    client,
    req.params.uuid,
    requireUser(req).uuid,
  );
  if (sc instanceof Attribute) {
    return sc;
  } else if (sc instanceof BaseError) {
    throw sc;
  } else {
    throw new HTTP500Error(
      `Failed to retrieve meta attribute ${req.params.uuid}`,
    );
  }
  });

  /**
   * @description - Get all the meta attributes for a specific scene type by its UUID.
   * @param {UUID} req.params.uuid - The uuid of the scene type.
   * @param res
   * @param next
   * @yield {status: 200, body: {Attribute[]}} - The meta attributes.
   * @throws {HTTP500Error} - If the acquisition of the meta attributes fails.
   * @throws {HTTP404Error} - If the scene type is not found.
   * @memberof Metamodel_attributes_controller
   * @method
   */
  get_attributes_for_scene: RequestHandler = withTransaction(async (client, req) => {
  const sc = await Metamodel_attributes_connection.getAllByParentUuid(
    client,
    req.params.uuid,
    requireUser(req).uuid,
  );
  if (Array.isArray(sc)) {
    return sc;
  } else if (sc instanceof BaseError) {
    throw sc;
  } else {
    throw new HTTP500Error(`Failed to retrieve meta attributes`);
  }
  });

  /**
   * @description - Get all the meta attributes for a specific meta class by its UUID.
   * @param {UUID} req.params.uuid - The uuid of the meta class.
   * @param res
   * @param next
   * @yield {status: 200, body: {Attribute[]}} - The meta attributes.
   * @throws {HTTP500Error} - If the acquisition of the meta attributes fails.
   * @throws {HTTP404Error} - If the meta class is not found.
   * @memberof Metamodel_attributes_controller
   * @method
   */
  get_attributes_for_class: RequestHandler = withTransaction(async (client, req) => {
  const sc = await Metamodel_attributes_connection.getAllByParentUuid(
    client,
    req.params.uuid,
    requireUser(req).uuid,
  );
  if (Array.isArray(sc)) {
    return sc;
  } else if (sc instanceof BaseError) {
    throw sc;
  } else {
    throw new HTTP500Error(`Failed to retrieve meta attributes`);
  }
  });

  /**
   * @description - Create a new meta attribute by its UUID.
   * @param {UUID} req.params.uuid - The uuid of the meta attribute.
   * @param {Attribute | Attribute[]} req.body - The meta attribute(s) to create.
   * @param res
   * @param next
   * @yield {status: 200, body: {Attribute}} - The meta attribute created.
   * @throws {HTTP500Error} - If the creation of the meta attribute fails.
   * @throws {HTTP404Error} - If the meta attribute is not found.
   * @memberof Metamodel_attributes_controller
   * @method
   */
  post_attribute_by_uuid: RequestHandler = withTransaction(async (client, req) => {
  const newAttribute = Attribute.fromJS(req.body) as Attribute;
  newAttribute.set_uuid(req.params.uuid);
  const sc = await Metamodel_attributes_connection.create(
    client,
    newAttribute,
    requireUser(req).uuid,
  );
  if (sc instanceof Attribute) {
    return sc;
  } else if (sc instanceof BaseError) {
    throw sc;
  } else {
    throw new HTTP500Error(
      `Failed to post the meta attribute ${req.params.uuid}.`,
    );
  }
  }, { status: 201 });

  /**
   * @description - Create a new meta attribute for a specific scene type by its UUID.
   * @param {UUID} req.params.uuid - The uuid of the scene type.
   * @param {Attribute | Attribute[]} req.body - The meta attribute(s) to create.
   * @param res
   * @param next
   * @yield {status: 201, body: {Attribute[]}} - The meta attributes created.
   * @throws {HTTP500Error} - If the creation of the meta attribute fails.
   * @memberOf Metamodel_attributesController
   * @method
   */
  post_attribute_for_scene: RequestHandler = withTransaction(async (client, req) => {
  const newAttribute = plainToInstance(Attribute, req.body);
  const sc = await Metamodel_attributes_connection.postForParentUuid(
    client,
    req.params.uuid,
    newAttribute,
    requireUser(req).uuid,
  );
  if (Array.isArray(sc)) {
    return sc;
  } else if (sc instanceof BaseError) {
    throw sc;
  } else {
    throw new HTTP500Error(
      `Cannot post the meta attribute for the scene type ${req.params.uuid}.`,
    );
  }
  }, { status: 201 });

  /**
   * @description - Create a new meta attribute for a specific meta class by its UUID.
   * @param {UUID} req.params.uuid - The uuid of the meta class.
   * @param {Attribute | Attribute[]} req.body - The meta attribute(s) to create.
   * @param res
   * @param next
   * @yield {status: 201, body: {Attribute[]}} - The meta attributes created.
   * @throws {HTTP500Error} - If the creation of the meta attribute fails.
   * @memberOf Metamodel_attributesController
   * @method
   */
  post_attribute_for_class: RequestHandler = withTransaction(async (client, req) => {
  const newAttribute = plainToInstance(Attribute, req.body);
  const sc = await Metamodel_attributes_connection.postForParentUuid(
    client,
    req.params.uuid,
    newAttribute,
    requireUser(req).uuid,
  );
  if (Array.isArray(sc)) {
    return sc;
  } else if (sc instanceof BaseError) {
    throw sc;
  } else {
    throw new HTTP500Error(
      `Cannot post the meta attribute for the meta class ${req.params.uuid}.`,
    );
  }
  }, { status: 201 });

  /**
   * @description - Modify a meta attribute by its UUID.
   * @param {UUID} req.params.uuid - The uuid of the meta attribute.
   * @param {Attribute} req.body - The meta attribute to modify.
   * @param res
   * @param next
   * @yield {status: 200, body: {Attribute}} - The meta attribute modified.
   * @throws {HTTP500Error} - If the modification of the meta attribute fails.
   * @memberof Metamodel_attributes_controller
   * @method
   *
   */
  patch_attribute_by_uuid: RequestHandler = withTransaction(async (client, req) => {
  const newAttribute = Attribute.fromJS(req.body) as Attribute;
  const sc = await Metamodel_attributes_connection.update(
    client,
    req.params.uuid,
    newAttribute,
    requireUser(req).uuid,
  );
  if (sc instanceof Attribute) {
    return sc;
  } else if (sc instanceof BaseError) {
    throw sc;
  } else {
    throw new HTTP500Error(
      `Cannot patch the meta attribute ${req.params.uuid}.`,
    );
  }
  });

  /**
   * @description - Modify a meta attribute by its UUID.
   * @param {UUID} req.params.uuid - The uuid of the meta attribute.
   * @param {Attribute} req.body - The meta attribute to modify.
   * @param res
   * @param next
   * @yield {status: 200, body: {Attribute}} - The meta attribute modified.
   * @throws {HTTP500Error} - If the modification of the meta attribute fails.
   * @memberof Metamodel_attributes_controller
   * @method
   *
   */
  patch_attribute_by_parent_uuid: RequestHandler = withTransaction(async (client, req) => {
  const newAttribute = plainToInstance(Attribute, req.body);
  const sc = await Metamodel_attributes_connection.updateForParentUuid(
    client,
    req.params.uuid,
    newAttribute,
    requireUser(req).uuid,
  );
  if (Array.isArray(sc)) {
    return sc;
  } else if (sc instanceof BaseError) {
    throw sc;
  } else {
    throw new HTTP500Error(
      `Cannot patch the meta attribute for the scene type ${req.params.uuid}.`,
    );
  }
  });

  /**
   * @description - Delete a meta attribute by its UUID.
   * @param {UUID} req.params.uuid - The uuid of the meta attribute.
   * @param res
   * @param next
   * @yield {status: 200, body: {UUID[]}} - The uuids of all deleted objects.
   * @throws {HTTP500Error} - If the deletion of the meta attribute fails.
   * @memberof Metamodel_attributes_controller
   * @method
   */
  delete_attributes_by_uuid: RequestHandler = withTransaction(async (client, req) => {
  const sc = await Metamodel_attributes_connection.deleteByUuid(
    client,
    req.params.uuid,
    requireUser(req).uuid,
  );
  if (Array.isArray(sc)) {
    //The result does not contains any uuid, i.e. the metaobject is not linked to any instance
    return sc;
  } else if (sc instanceof BaseError) {
    throw sc;
  } else {
    throw new HTTP500Error(
      `Cannot delete the meta attribute ${req.params.uuid}.`,
    );
  }
  });

  /**
   * @description - Delete all meta attributes for a specific scene type by its UUID.
   * @param {UUID} req.params.uuid - The uuid of the scene type.
   * @param res
   * @param next
   * @yield {status: 200, body: {UUID[]}} - The uuids of all deleted objects.
   * @throws {HTTP500Error} - If the deletion of the meta attributes fails.
   * @memberof Metamodel_attributes_controller
   * @method
   */
  delete_attributes_for_scene: RequestHandler = withTransaction(async (client, req) => {
  const sc = await Metamodel_attributes_connection.deleteAllByParentUuid(
    client,
    req.params.uuid,
    requireUser(req).uuid,
  );
  if (Array.isArray(sc)) {
    //The result does not contains any uuid, i.e. the metaobject is not linked to any instance
    return sc;
  } else if (sc instanceof BaseError) {
    throw sc;
  } else {
    throw new HTTP500Error(
      `Cannot delete the meta attribute for the scene type ${req.params.uuid}.`,
    );
  }
  });

  /**
   * @description - Delete all meta attributes for a specific meta class by its UUID.
   * @param {UUID} req.params.uuid - The uuid of the meta class.
   * @param res
   * @param next
   * @yield {status: 200, body: {UUID[]}} - The uuids of all deleted objects.
   * @throws {HTTP500Error} - If the deletion of the meta attributes fails.
   * @memberof Metamodel_attributes_controller
   * @method
   */
  delete_attributes_for_class: RequestHandler = withTransaction(async (client, req) => {
  const sc = await Metamodel_attributes_connection.deleteAllByParentUuid(
    client,
    req.params.uuid,
    requireUser(req).uuid,
  );
  if (Array.isArray(sc)) {
    //The result does not contains any uuid, i.e. the metaobject is not linked to any instance
    return sc;
  } else if (sc instanceof BaseError) {
    throw sc;
  } else {
    throw new HTTP500Error(
      `Cannot delete the meta attribute for the meta class ${req.params.uuid}.`,
    );
  }
  });
}

export default new Metamodel_attributesController();
