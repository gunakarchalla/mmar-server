// get attribute type
import {RequestHandler} from "express";
import {database_connection} from "../../index";
import {filter_object} from "../../data/services/middleware/object_filter";
import {
  API404Error,
  BaseError,
  HTTP500Error,
} from "../../data/services/middleware/error_handling/standard_errors.middleware";
import {AttributeType} from "../../../mmar-global-data-structure";
import Metamodel_attribute_types_connection from "../../data/meta/Metamodel_attribute_types.connection";

/**
 * @classdesc - This class is used to handle all the requests for the meta attribute type.
 * @export - The class is exported so that it can be used by other files.
 * @class - Metamodel_attribute_types_controller
 */
class Metamodel_attribute_typesController {
  get_all_attributetypes: RequestHandler = async (req, res, next) => {
    const client = await database_connection.getPool().connect();
    try {
      await client.query("BEGIN");
      const sc = await Metamodel_attribute_types_connection.getAll(
        client,
        req.body.tokendata.uuid,
      );
      if (Array.isArray(sc)) {
        res.status(200).json(filter_object(sc, req.query.filter));
      } else if (sc instanceof BaseError) {
        throw sc;
      } else {
        throw new HTTP500Error(`Cannot get all the meta attribute types.`);
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
   * @description - Get a specific attribute type by its uuid.
   * @param {UUID} req.params.uuid - The uuid of the attribute type.
   * @param res
   * @param next
   * @yield {status: 200, body: {AttributeType}} - The attribute type.
   * @throws {API404Error} - If the attribute type is not found.
   * @throws {HTTP500Error} - If the acquisition of the attribute type fails.
   * @memberof Metamodel_attribute_types_controller
   * @method
   */
  get_attributetype_by_uuid: RequestHandler = async (req, res, next) => {
    const client = await database_connection.getPool().connect();

    try {
      await client.query("BEGIN");
      const sc = await Metamodel_attribute_types_connection.getByUuid(
        client,
        req.params.uuid,
        req.body.tokendata.uuid,
      );
      if (sc instanceof AttributeType) {
        res.status(200).json(filter_object(sc, req.query.filter));
      } else if (sc instanceof BaseError) {
        throw sc;
      } else {
        throw new HTTP500Error(
          `Cannot get the meta attribute type ${req.params.uuid}.`,
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
   * @description - Get all the attribute types for a specific meta attribute by its uuid.
   * @param {UUID} req.params.uuid - The uuid of the meta attribute.
   * @param res
   * @param next
   * @yield {status: 200, body: {AttributeType[]}} - The attribute types.
   * @throws {HTTP500Error} - If the acquisition of the attribute types fails.
   * @throws {API404Error} - If the meta attribute is not found.
   * @memberof Metamodel_attribute_types_controller
   * @method
   */
  get_attributetype_for_attribute: RequestHandler = async (req, res, next) => {
    const client = await database_connection.getPool().connect();

    try {
      await client.query("BEGIN");
      const sc = await Metamodel_attribute_types_connection.getAllByParentUuid(
        client,
        req.params.uuid,
        req.body.tokendata.uuid,
      );
      if (Array.isArray(sc)) {
        res.status(200).json(filter_object(sc, req.query.filter));
      } else if (sc instanceof BaseError) {
        throw sc;
      } else {
        throw new HTTP500Error(
          `Cannot get the meta attribute types for the meta attribute ${req.params.uuid}.`,
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
   * @description - Create all the attribute types for a specific meta attribute by its uuid.
   * @param {UUID} req.params.uuid - The uuid of the meta attribute.
   * @param {AttributeType} req.body - The attribute type to create.
   * @param res
   * @param next
   * @yield {status: 201, body: {AttributeType}} - The attribute types.
   * @throws {HTTP500Error} - If the creation of the attribute types fails.
   * @memberOf Metamodel_attribute_typesController
   * @method
   */
  post_attributetype_for_attribute: RequestHandler = async (req, res, next) => {
    const client = await database_connection.getPool().connect();

    try {
      await client.query("BEGIN");
      const newAttributeType = AttributeType.fromJS(req.body) as AttributeType;
      const sc =
        await Metamodel_attribute_types_connection.postAttributeTypeForAttribute(
          client,
          req.params.uuid,
          newAttributeType,
          req.body.tokendata.uuid,
        );
      if (sc instanceof AttributeType) {
        res.status(201).json(filter_object(sc, req.query.filter));
      } else if (sc instanceof BaseError) {
        throw sc;
      } else {
        throw new HTTP500Error(
          `Cannot post the meta attribute type for the meta attribute ${req.params.uuid}.`,
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
   * @description - Modify a specific attribute types by its uuid.
   * @param {UUID} req.params.uuid - The uuid of the attribute type.
   * @param {AttributeType} req.body - The attribute type to modify.
   * @param res
   * @param next
   * @yield {status: 200, body: {AttributeType}} - The attribute type.
   * @throws {HTTP500Error} - If the modification of the attribute type fails.
   * @memberOf Metamodel_attribute_typesController
   * @method
   */
  patch_attributetype_by_uuid: RequestHandler = async (req, res, next) => {
    const client = await database_connection.getPool().connect();

    try {
      await client.query("BEGIN");
      const newAttributeType = AttributeType.fromJS(req.body) as AttributeType;
      const hardPatch = req.query.hardpatch === "true";
      let sc;

      if (hardPatch) {
        sc = await Metamodel_attribute_types_connection.hardUpdate(
          client,
          req.params.uuid,
          newAttributeType,
          req.body.tokendata.uuid,
        );
      } else {
        sc = await Metamodel_attribute_types_connection.update(
          client,
          req.params.uuid,
          newAttributeType,
          req.body.tokendata.uuid,
        );
      }
      if (sc instanceof AttributeType) {
        res.status(200).json(filter_object(sc, req.query.filter));
      } else if (sc instanceof BaseError) {
        throw sc;
      } else {
        throw new HTTP500Error(
          `Failed to patch the meta attribute type ${req.params.uuid}.`,
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
   * @description - Create a specific attribute type by its uuid.
   * @param {UUID} req.params.uuid - The uuid of the attribute type.
   * @param {AttributeType} req.body - The attribute type to create.
   * @param res
   * @param next
   * @yield {status: 201, body: {AttributeType}} - The attribute type.
   * @throws {HTTP500Error} - If the creation of the attribute type fails.
   * @memberOf Metamodel_attribute_typesController
   * @method
   */
  post_attributetype_by_uuid: RequestHandler = async (req, res, next) => {
    const client = await database_connection.getPool().connect();

    try {
      await client.query("BEGIN");
      const newAttributeType = AttributeType.fromJS(req.body) as AttributeType;
      newAttributeType.set_uuid(req.params.uuid);
      const sc = await Metamodel_attribute_types_connection.create(
        client,
        newAttributeType,
        req.body.tokendata.uuid,
      );
      if (sc instanceof AttributeType) {
        res.status(201).json(filter_object(sc, req.query.filter));
      } else if (sc instanceof BaseError) {
        throw sc;
      } else {
        throw new HTTP500Error(
          `Failed to post the meta attribute type ${req.params.uuid}.`,
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
   * @description - Delete a specific attribute type by its uuid.
   * @param {UUID} req.params.uuid - The uuid of the attribute type.
   * @param res
   * @param next
   * @yield {status: 200, body: {UUID[]}} - The uuids of all the deleted objets.
   * @throws {HTTP500Error} - If the deletion of the attribute type fails.
   * @memberOf Metamodel_attribute_typesController
   * @method
   */
  delete_attributetype_by_uuid: RequestHandler = async (req, res, next) => {
    const client = await database_connection.getPool().connect();

    try {
      await client.query("BEGIN");
      const resultQuery =
        await Metamodel_attribute_types_connection.deleteByUuid(
          client,
          req.params.uuid,
          req.body.tokendata.uuid,
        );
      if (Array.isArray(resultQuery)) {
        //The result does not contains any uuid, i.e. the metaobject is not linked to any instance
        res.status(200).json(filter_object(resultQuery, req.query.filter));
      } else if (resultQuery instanceof BaseError) {
        throw resultQuery;
      } else {
        throw new HTTP500Error(
          `Failed to delete the meta attribute type ${req.params.uuid}.`,
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

export default new Metamodel_attribute_typesController();
