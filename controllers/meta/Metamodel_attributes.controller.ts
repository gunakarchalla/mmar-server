import {RequestHandler} from "express";
import {database_connection} from "../..";
import {plainToInstance} from "class-transformer";
import {Attribute} from "../../../mmar-global-data-structure";
import {
    API404Error,
    BaseError,
    HTTP500Error,
} from "../../data/services/middleware/error_handling/standard_errors.middleware";
import {filter_object} from "../../data/services/middleware/object_filter";
import Metamodel_attributes_connection from "../../data/meta/Metamodel_attributes.connection";

/**
 * @classdesc - This class is used to handle all the requests for the meta attributes.
 * @export - The class is exported so that it can be used by other files.
 * @class - Metamodel_attributes_controller
 */
class Metamodel_attributesController {
  get_all_attributes: RequestHandler = async (req, res, next) => {
    const client = await database_connection.getPool().connect();

    try {
      await client.query("BEGIN");
      const sc = await Metamodel_attributes_connection.getAll(
        client,
        req.body.tokendata.uuid,
      );
      if (Array.isArray(sc)) {
        res.status(200).json(filter_object(sc, req.query.filter));
      } else if (sc instanceof BaseError) {
        throw sc;
      } else {
        throw new HTTP500Error(`Failed to retrieve meta attributes`);
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      next(err);
    } finally {
      (await client).release();
    }
  };

  /**
   * @description - Get a specific meta attribute by its UUID.
   * @param {UUID} req.params.uuid - The uuid of the meta attribute.
   * @param res
   * @param next
   * @yield {status: 200, body: {Attribute}} - The meta attribute.
   * @throws {API404Error} - If the meta attribute is not found.
   * @throws {HTTP500Error} - If the acquisition of the meta attribute fails.
   * @memberof Metamodel_attributes_controller
   * @method
   */
  get_attribute_by_uuid: RequestHandler = async (req, res, next) => {
    const client = await database_connection.getPool().connect();

    try {
      await client.query("BEGIN");
      const sc = await Metamodel_attributes_connection.getByUuid(
        client,
        req.params.uuid,
        req.body.tokendata.uuid,
      );
      if (sc instanceof Attribute) {
        res.status(200).json(filter_object(sc, req.query.filter));
      } else if (sc instanceof BaseError) {
        throw sc;
      } else {
        throw new HTTP500Error(
          `Failed to retrieve meta attribute ${req.params.uuid}`,
        );
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      next(err);
    } finally {
      (await client).release();
    }
  };

  /**
   * @description - Get all the meta attributes for a specific scene type by its UUID.
   * @param {UUID} req.params.uuid - The uuid of the scene type.
   * @param res
   * @param next
   * @yield {status: 200, body: {Attribute[]}} - The meta attributes.
   * @throws {HTTP500Error} - If the acquisition of the meta attributes fails.
   * @throws {API404Error} - If the scene type is not found.
   * @memberof Metamodel_attributes_controller
   * @method
   */
  get_attributes_for_scene: RequestHandler = async (req, res, next) => {
    const client = await database_connection.getPool().connect();

    try {
      await client.query("BEGIN");
      const sc = await Metamodel_attributes_connection.getAllByParentUuid(
        client,
        req.params.uuid,
        req.body.tokendata.uuid,
      );
      if (Array.isArray(sc)) {
        res.status(200).json(filter_object(sc, req.query.filter));
      } else if (sc instanceof BaseError) {
        throw sc;
      } else {
        throw new HTTP500Error(`Failed to retrieve meta attributes`);
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      next(err);
    } finally {
      (await client).release();
    }
  };

  /**
   * @description - Get all the meta attributes for a specific meta class by its UUID.
   * @param {UUID} req.params.uuid - The uuid of the meta class.
   * @param res
   * @param next
   * @yield {status: 200, body: {Attribute[]}} - The meta attributes.
   * @throws {HTTP500Error} - If the acquisition of the meta attributes fails.
   * @throws {API404Error} - If the meta class is not found.
   * @memberof Metamodel_attributes_controller
   * @method
   */
  get_attributes_for_class: RequestHandler = async (req, res, next) => {
    const client = await database_connection.getPool().connect();

    try {
      await client.query("BEGIN");
      const sc = await Metamodel_attributes_connection.getAllByParentUuid(
        client,
        req.params.uuid,
        req.body.tokendata.uuid,
      );
      if (Array.isArray(sc)) {
        res.status(200).json(filter_object(sc, req.query.filter));
      } else if (sc instanceof BaseError) {
        throw sc;
      } else {
        throw new HTTP500Error(`Failed to retrieve meta attributes`);
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      next(err);
    } finally {
      (await client).release();
    }
  };

  /**
   * @description - Create a new meta attribute by its UUID.
   * @param {UUID} req.params.uuid - The uuid of the meta attribute.
   * @param {Attribute | Attribute[]} req.body - The meta attribute(s) to create.
   * @param res
   * @param next
   * @yield {status: 200, body: {Attribute}} - The meta attribute created.
   * @throws {HTTP500Error} - If the creation of the meta attribute fails.
   * @throws {API404Error} - If the meta attribute is not found.
   * @memberof Metamodel_attributes_controller
   * @method
   */
  post_attribute_by_uuid: RequestHandler = async (req, res, next) => {
    const client = await database_connection.getPool().connect();

    try {
      await client.query("BEGIN");

      const newAttribute = Attribute.fromJS(req.body) as Attribute;
      newAttribute.set_uuid(req.params.uuid);
      const sc = await Metamodel_attributes_connection.create(
        client,
        newAttribute,
        req.body.tokendata.uuid,
      );
      if (sc instanceof Attribute) {
        res.status(201).json(filter_object(sc, req.query.filter));
      } else if (sc instanceof BaseError) {
        throw sc;
      } else {
        throw new HTTP500Error(
          `Failed to post the meta attribute ${req.params.uuid}.`,
        );
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      next(err);
    } finally {
      (await client).release();
    }
  };

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
  post_attribute_for_scene: RequestHandler = async (req, res, next) => {
    const client = await database_connection.getPool().connect();

    try {
      await client.query("BEGIN");

      const newAttribute = plainToInstance(Attribute, req.body);
      const sc = await Metamodel_attributes_connection.postForParentUuid(
        client,
        req.params.uuid,
        newAttribute,
        req.body.tokendata.uuid,
      );
      if (Array.isArray(sc)) {
        res.status(201).json(filter_object(sc, req.query.filter));
      } else if (sc instanceof BaseError) {
        throw sc;
      } else {
        throw new HTTP500Error(
          `Cannot post the meta attribute for the scene type ${req.params.uuid}.`,
        );
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      next(err);
    } finally {
      (await client).release();
    }
  };

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
  post_attribute_for_class: RequestHandler = async (req, res, next) => {
    const client = await database_connection.getPool().connect();

    try {
      await client.query("BEGIN");

      const newAttribute = plainToInstance(Attribute, req.body);
      const sc = await Metamodel_attributes_connection.postForParentUuid(
        client,
        req.params.uuid,
        newAttribute,
        req.body.tokendata.uuid,
      );
      if (Array.isArray(sc)) {
        res.status(201).json(filter_object(sc, req.query.filter));
      } else if (sc instanceof BaseError) {
        throw sc;
      } else {
        throw new HTTP500Error(
          `Cannot post the meta attribute for the meta class ${req.params.uuid}.`,
        );
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      next(err);
    } finally {
      (await client).release();
    }
  };

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
  patch_attribute_by_uuid: RequestHandler = async (req, res, next) => {
    const client = await database_connection.getPool().connect();

    try {
      await client.query("BEGIN");

      const newAttribute = Attribute.fromJS(req.body) as Attribute;
      const sc = await Metamodel_attributes_connection.update(
        client,
        req.params.uuid,
        newAttribute,
        req.body.tokendata.uuid,
      );
      if (sc instanceof Attribute) {
        res.status(200).json(filter_object(sc, req.query.filter));
      } else if (sc instanceof BaseError) {
        throw sc;
      } else {
        throw new HTTP500Error(
          `Cannot patch the meta attribute ${req.params.uuid}.`,
        );
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      next(err);
    } finally {
      (await client).release();
    }
  };

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
  patch_attribute_by_parent_uuid: RequestHandler = async (req, res, next) => {
    const client = await database_connection.getPool().connect();

    try {
      await client.query("BEGIN");
      const newAttribute = plainToInstance(Attribute, req.body);
      const sc = await Metamodel_attributes_connection.updateForParentUuid(
        client,
        req.params.uuid,
        newAttribute,
        req.body.tokendata.uuid,
      );
      if (Array.isArray(sc)) {
        res.status(200).json(filter_object(sc, req.query.filter));
      } else if (sc instanceof BaseError) {
        throw sc;
      } else {
        throw new HTTP500Error(
          `Cannot patch the meta attribute for the scene type ${req.params.uuid}.`,
        );
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      next(err);
    } finally {
      (await client).release();
    }
  };

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
  delete_attributes_by_uuid: RequestHandler = async (req, res, next) => {
    const client = await database_connection.getPool().connect();

    try {
      await client.query("BEGIN");
      const sc = await Metamodel_attributes_connection.deleteByUuid(
        client,
        req.params.uuid,
        req.body.tokendata.uuid,
      );
      if (Array.isArray(sc)) {
        //The result does not contains any uuid, i.e. the metaobject is not linked to any instance
        res.status(200).json(filter_object(sc, req.query.filter));
      } else if (sc instanceof BaseError) {
        throw sc;
      } else {
        throw new HTTP500Error(
          `Cannot delete the meta attribute ${req.params.uuid}.`,
        );
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      next(err);
    } finally {
      (await client).release();
    }
  };

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
  delete_attributes_for_scene: RequestHandler = async (req, res, next) => {
    const client = await database_connection.getPool().connect();

    try {
      await client.query("BEGIN");

      const sc = await Metamodel_attributes_connection.deleteAllByParentUuid(
        client,
        req.params.uuid,
        req.body.tokendata.uuid,
      );
      if (Array.isArray(sc)) {
        //The result does not contains any uuid, i.e. the metaobject is not linked to any instance
        res.status(200).json(filter_object(sc, req.query.filter));
      } else if (sc instanceof BaseError) {
        throw sc;
      } else {
        throw new HTTP500Error(
          `Cannot delete the meta attribute for the scene type ${req.params.uuid}.`,
        );
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      next(err);
    } finally {
      (await client).release();
    }
  };

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
  delete_attributes_for_class: RequestHandler = async (req, res, next) => {
    const client = await database_connection.getPool().connect();

    try {
      await client.query("BEGIN");

      const sc = await Metamodel_attributes_connection.deleteAllByParentUuid(
        client,
        req.params.uuid,
        req.body.tokendata.uuid,
      );
      if (Array.isArray(sc)) {
        //The result does not contains any uuid, i.e. the metaobject is not linked to any instance
        res.status(200).send(filter_object(sc, req.query.filter));
      } else if (sc instanceof BaseError) {
        throw sc;
      } else {
        throw new HTTP500Error(
          `Cannot delete the meta attribute for the meta class ${req.params.uuid}.`,
        );
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      next(err);
    } finally {
      (await client).release();
    }
  };
}

export default new Metamodel_attributesController();
