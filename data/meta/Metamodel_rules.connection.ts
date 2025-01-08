import {Rule, UUID} from "../../../mmar-global-data-structure";
import {PoolClient} from "pg";
import {queries} from "../..";
import {API404Error, BaseError} from "../services/middleware/error_handling/standard_errors.middleware";
import {CRUD} from "../common/crud.interface";

/**
 * @description - This is the class that handles the CRUD operations for the rules.
 * @class Metamodel_rulesConnection
 * @implements {CRUD}
 * @export - This class is exported so that it can be used by other classes.
 */
class Metamodel_rulesConnection implements CRUD {
    /**
     * @description - This function gets the rule by uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} ruleUuid - The uuid of the rule to get.
     * @param {UUID} userUuid - The uuid of the user that wants to get the rule.
     * @returns {Promise<undefined | Rule>} - The rule if it exists, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error getting the rule.
     * @memberof Metamodel_rules_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export - This function is exported so that it can be used by other classes.
     * @method
     */
    async getByUuid(
        client: PoolClient,
        ruleUuid: UUID,
        userUuid?: UUID
    ): Promise<undefined | Rule | BaseError> {
        try {

            // TODO add right check for the user
            const rules_query = queries.getQuery_get("rule_by_uuid_query");
            let returnRule
            const res_rule = await client.query(rules_query, [ruleUuid]);
            if (res_rule.rowCount == 1) {
                returnRule = Rule.fromJS(res_rule.rows[0]) as Rule;
            }
            return returnRule;
        } catch (err) {
            throw new Error(`Error getting the rule by the uuid: ${err}`);
        }
    }

    /**
     * @description - This function get all the rules of a meta object by its uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} uuidParent - The uuid of the meta object of the rule to get.
     * @param {UUID} userUuid - The uuid of the user that wants to get the rule.
     * @returns {Promise<Rule[]>} - The array of rule if it exists.
     * @throws {Error} - This function throws an error if there is an error getting the rule.
     * @memberof Metamodel_rules_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export - This function is exported so that it can be used by other files.
     * @method
     */
    async getAllByParentUuid(
        client: PoolClient,
        uuidParent: UUID,
        userUuid?: UUID
    ): Promise<Rule[] | BaseError> {
        try {
            //todo add right check for the user
            const rule_query = queries.getQuery_get("rule_by_metaobject_uuid_query");
            const returnRules = new Array<Rule>();
            const res_rules = await client.query(rule_query, [uuidParent]);

            for (const cr of res_rules.rows) {
                const newRule = await this.getByUuid(client, cr.uuid, userUuid);
                if (newRule instanceof Rule) returnRules.push(newRule);

            }
            return returnRules;
        } catch (err) {
            throw new Error(
                `Error getting  the rules for the meta object ${uuidParent}: ${err}`
            );
        }
    }

    /**
     * @description - This function update a rule.
     * @param {PoolClient} client - The client to the database.
     * @param {Rule} newRule - The rule to update.
     * @param {UUID} ruleUuidToUpdate - The uuid of the rule to update.
     * @param {UUID} userUuid - The uuid of the user that wants to update the rule.
     * @returns {Promise<Rule | undefined>} - The rule updated, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error updating the rule.
     * @memberof Metamodel_rules_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export - This function is exported so that it can be used by other files.
     * @method
     */
    async update(
        client: PoolClient,
        ruleUuidToUpdate: UUID,
        newRule: Rule,
        userUuid?: UUID
    ): Promise<Rule | undefined | BaseError> {
        try {
            // TODO add right check for the user
            const query_update_rule = queries.getQuery_post("update_rule");
            await client.query(query_update_rule, [
                newRule.name,
                newRule.value,
                newRule.assigned_uuid_metaobject,
                ruleUuidToUpdate,
            ]);
            return await this.getByUuid(client, ruleUuidToUpdate, userUuid);

        } catch (err) {
            throw new Error(`Error updating the rule ${ruleUuidToUpdate}: ${err}`);
        }
    }

    /**
     * @description - This function create a new rule.
     * @param {PoolClient} client - The client to the database.
     * @param {Rule} newRule - The rule to create.
     * @param {UUID} userUuid - The uuid of the user that wants to create the rule.
     * @returns {Promise<Rule | undefined>} - The rule created, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error creating the rule.
     * @memberof Metamodel_rules_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export - This function is exported so that it can be used by other files.
     * @method
     */
    async create(
        client: PoolClient,
        newRule: Rule,
        userUuid?: UUID
    ): Promise<Rule | undefined | BaseError> {
        try {
            // TODO add right check for the user
            const query_create_rule = queries.getQuery_post("create_rule"); // $1 = name, $2 = value, $3 = uuid_metaobject
            const query_create_rule_uuid = queries.getQuery_post(
                "create_rule_with_uuid"
            ); // $1 = uuid $2 = name, $3 = value, $4 = uuid_metaobject
            const query_metaobject_exist = queries.getQuery_get(
                "metaobject_existence"
            ); // returns exists=true if the metaobject exists, exists=false otherwise

            // Check if the metaobject exists and get it
            const meta_exist = (
                await client.query(query_metaobject_exist, [
                    newRule.assigned_uuid_metaobject,
                ])
            ).rows.pop().exists;
            if (meta_exist) {
                // the metaobject exists, we can create the rule
                if (newRule.uuid == undefined) {
                    // the rule has no uuid, we call the query to create the rule without uuid
                    await client.query(query_create_rule, [
                        newRule.name,
                        newRule.value,
                        newRule.assigned_uuid_metaobject,
                    ]);
                } else {
                    // the rule has uuid, we call the query to create the rule with uuid
                    const testRuleExistence = await this.getByUuid(client, newRule.uuid);
                    if (testRuleExistence !== undefined) {
                        // the rule already exists, we throw an error
                        throw new Error(
                            `the uuid ${newRule.uuid} already exists in the database`
                        );
                    } else {
                        // the rule does not exist, we call the query to create the rule with uuid
                        await client.query(query_create_rule_uuid, [
                            newRule.uuid,
                            newRule.name,
                            newRule.value,
                            newRule.assigned_uuid_metaobject,
                        ]);
                    }
                }
                return await this.getByUuid(client, newRule.uuid, userUuid);
            } else {
                // the linked meta object does not exist in the database, we throw an error
                throw new API404Error(
                    `MetaObject with the uuid ${newRule.assigned_uuid_metaobject} cannot be found in the database`
                );
            }
        } catch (err) {
            throw new Error(`Error creating the rule: ${err}`);
        }
    }

    /**
     * @description - This function creates rules for the meta object by the uuid of the meta object.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} metaobjectUuid - The uuid of the met object.
     * @param {Rule[] | Rule} newRules - The rule or an array of attributes to create.
     * @param {UUID} userUuid - The uuid of the user that wants to create the rules.
     * @returns {Promise<Rule[] | undefined>} - The array of rule created, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error creating the rule.
     * @memberof Metamodel_rules_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export - This function is exported so that it can be used by other files.
     * @method
     */
    async postRuleForMetaobject(
        client: PoolClient,
        metaobjectUuid: UUID,
        newRules: Rule[] | Rule,
        userUuid?: UUID
    ): Promise<Rule[] | undefined | BaseError> {
        try {
            // TODO add right check for the user
            const returnRules = new Array<Rule>();
            let currentRule

            if (newRules instanceof Rule) {
                // the newRules is a rule, we create it
                newRules.assigned_uuid_metaobject = metaobjectUuid;
                currentRule = await this.create(client, newRules, userUuid);
                if (currentRule instanceof Rule) {
                    returnRules.push(currentRule);
                }
            } else {
                // the newRules is an array of rules, we create them
                for (const ruleToAdd of newRules) {
                    ruleToAdd.assigned_uuid_metaobject = metaobjectUuid;
                    currentRule = await this.create(client, ruleToAdd, userUuid);
                    if (currentRule instanceof Rule) {
                        returnRules.push(currentRule);
                    }
                }
            }
            return returnRules;
        } catch (err) {
            throw new Error(
                `Error creating the rules for the metaobject uuid ${metaobjectUuid} : ${err}`
            );
        }
    }

    /**
     * @description - This function delete rule by uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} uuidToDelete - The uuid of the rule to delete.
     * @returns {Promise<UUID[] | undefined>} - The array of uuid of all the objects deleted, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error deleting the rule.
     * @memberof Metamodel_rules_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export - This function is exported so that it can be used by other files.
     * @method
     * @todo - Add the userUuid parameter for the user manangement.
     */
    async deleteByUuid(
        client: PoolClient,
        uuidToDelete: UUID
    ): Promise<UUID[] | undefined | BaseError> {
        try {
            // TODO add right check for the user
            const returnUuids: UUID[] = new Array<UUID>();
            const delete_rule_uuid_query =
                queries.getQuery_delete("delete_rule_uuid");
            const uuid_deleted = await client.query(delete_rule_uuid_query, [
                uuidToDelete,
            ]);
            for (const uuid of uuid_deleted.rows) {
                returnUuids.push(uuid.affected_uuid);
            }
            return returnUuids;
        } catch (err) {
            throw new Error(`Error deleting the rule ${uuidToDelete}: ${err}`);
        }
    }
}

export default new Metamodel_rulesConnection();
