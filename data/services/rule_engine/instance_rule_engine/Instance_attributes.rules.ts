/**
 * @module instance/attribute
 */
import {AttributeInstance} from "../../../../../mmar-global-data-structure";
import {HTTP403Constrain} from "../../middleware/error_handling/standard_errors.middleware";
import {metaObjectExists} from "./Instance_commons.rules";
import {PoolClient} from "pg";
import Metamodel_attribute_types_connection from "../../../meta/Metamodel_attribute_types.connection";

/**
 * # Rule applied to this object:
 * all the rule are applied sequentially
 * 1. [[metaObjectExists]] : Check the existence of the meta-object
 * 2. [[regexExValidator]] : Check if the entered attribute value match the rexgex of the meta attribute type
 *
 */
export async function applyRules(
    client: PoolClient,
    attributeToTest: AttributeInstance
) {
    await metaObjectExists(client, attributeToTest);
    await regexExValidator(client, attributeToTest);
}

/**
 * This rule check if the entered attribute value match the rexgex of the meta attribute type
 * @category Rule
 * @param client The database connection client
 * @param attributeToTest The attribute to test the value
 */
export async function regexExValidator(
    client: PoolClient,
    attributeToTest: AttributeInstance
): Promise<boolean> {

    const attributeType = await Metamodel_attribute_types_connection.getAllByParentUuid(
        client,
        attributeToTest.uuid_attribute
    );
    if (Array.isArray(attributeType) && attributeType.length === 0) {
        const regexFromDb = attributeType[0].regex_value; // this is ugly but it works
        const sc = new RegExp(regexFromDb, "gmi");
        //logger.info(`Matcher regex: ${attributeToTest.value.match(sc)}`)
        if (regexFromDb == null || attributeToTest.value.match(sc) != null) {
            return true;
        } else {
            throw new HTTP403Constrain(
                `The rule error was fired for the attribute ${attributeToTest.uuid}: ${attributeToTest.value} does not match the regex ${sc}`
            );
        }
    }
    return false;
}
