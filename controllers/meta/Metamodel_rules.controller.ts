import {RequestHandler} from "express";
import {database_connection} from "../../index";
import {
    API404Error,
    BaseError,
    HTTP500Error,
} from "../../data/services/middleware/error_handling/standard_errors.middleware";

import {Rule} from "../../../mmar-global-data-structure";
import {plainToInstance} from "class-transformer";
import {filter_object} from "../../data/services/middleware/object_filter";
import Metamodel_rules_connection from "../../data/meta/Metamodel_rules.connection";

/**
 * @classdesc - This class is used to handle all the requests for the rules.
 * @export - The class is exported so that it can be used by other files.
 * @class - Metamodel_rules_controller
 */
class Metamodel_rulesController {
    /**
     * @description - Get the rule by its UUID.
     * @param {UUID} req.params.uuid - The uuid of the rule.
     * @param res
     * @param next
     * @yield {status: 200, body: {Rule | undefined}} - The rule(s).
     * @throws {API404Error} - If the rule is not found.
     * @throws {HTTP500Error} - If the acquisition of the rules fails.
     * @memberof Metamodel_rules_controller
     * @method
     */
    get_rules_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();
        try {
            await client.query("BEGIN");
            const sc = await Metamodel_rules_connection.getByUuid(
                client,
                req.params.uuid,
                req.body.tokendata.uuid
            );
            if (sc instanceof Rule) {
                res.status(200).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to retrieve the rule ${req.params.uuid}.`
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
     * @description - Get all the rules for a specific meta object by its UUID.
     * @param {UUID} req.params.uuid - The uuid of the meta object.
     * @param res
     * @param next
     * @yield {status: 200, body: {Rule[]}} - The rules.
     * @throws {API404Error} - If the meta object is not found.
     * @throws {HTTP500Error} - If the acquisition of the rules fails.
     * @memberof Metamodel_rules_controller
     * @method
     */
    get_rules_for_metaobject_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();
        try {
            await client.query("BEGIN");
            const sc = await Metamodel_rules_connection.getAllByParentUuid(
                client,
                req.params.uuid,
                req.body.tokendata.uuid
            );
            if (sc instanceof Array) {
                res.status(200).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Failed to retrieve the rules for the metaObject ${req.params.uuid}.`
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
     * @description - Modify a specific rules by its UUID.
     * @param {UUID} req.params.uuid - The uuid of the rule.
     * @param {Rule} req.body - The new rule.
     * @param res
     * @param next
     * @yield {status: 200, body: {Rule}} - The modified rule.
     * @throws {HTTP500Error} - If the modification of the rule fails.
     * @memberof Metamodel_rules_controller
     * @method
     */
    patch_rule_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");

            const newRule = Rule.fromJS(req.body) as Rule;
            const sc = await Metamodel_rules_connection.update(
                await client,
                req.params.uuid,
                newRule,
                req.body.tokendata.uuid
            );
            if (sc instanceof Rule) {
                res.status(200).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(`Failed to update rule ${req.params.uuid}`);
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
     * @description - Create a specific rule by its UUID.
     * @param {UUID} req.params.uuid - The uuid of the rule.
     * @param {Rule} req.body - The new rule.
     * @param res
     * @param next
     * @yield {status: 200, body: {Rule}} - The created rule.
     * @throws {HTTP500Error} - If the creation of the rule fails.
     * @memberof Metamodel_rules_controller
     * @method
     */
    post_rule_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();
        try {
            await client.query("BEGIN");

            const newRule = Rule.fromJS(req.body) as Rule;
            if (req.params.uuid) {
                newRule.uuid = req.params.uuid;
            }
            const sc = await Metamodel_rules_connection.create(
                client,
                newRule,
                req.body.tokendata.uuid
            );
            if (sc instanceof Rule) {
                res.status(200).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(`Failed to create rule.`);
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
     * @description - Create a specific rule for a specific meta object by its UUID.
     * @param {UUID} req.params.uuid - The uuid of the meta object.
     * @param {Rule | Rule[]} req.body - The new rule.
     * @param res
     * @param next
     * @yield {status: 200, body: {Rule[]}} - The created rule(s).
     * @throws {HTTP500Error} - If the creation of the rule fails.
     * @memberof Metamodel_rules_controller
     * @method
     */
    post_rules_for_metaobject: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");

            const newRules = plainToInstance(Rule, req.body);
            const sc = await Metamodel_rules_connection.postRuleForMetaobject(
                client,
                req.params.uuid,
                newRules,
                req.body.tokendata.uuid
            );
            if (Array.isArray(sc)) {
                res.status(200).json(filter_object(sc, req.query.filter));
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(`Failed to create rules.`);
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
     * @description - Delete a specific rule by its UUID.
     * @param {UUID} req.params.uuid - The uuid of the rule.
     * @param res
     * @param next
     * @yield {status: 200, body: {UUID}} - The uuid of all the deleted objects.
     * @throws {HTTP500Error} - If the deletion of the rule fails.
     * @memberof Metamodel_rules_controller
     * @method
     */
    delete_rules_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();
        try {
            await client.query("BEGIN");
            const sc = await Metamodel_rules_connection.deleteByUuid(
                client,
                req.params.uuid
            );
            if (Array.isArray(sc)) {
                //The result does not contains any uuid, i.e. the metaobject is not linked to any instance
                res.status(200).json(sc);
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(`Failed to delete rule ${req.params.uuid}`);
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

export default new Metamodel_rulesController();
