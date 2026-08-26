/**
 * @module instance/attribute
 */
import {AttributeInstance} from "../../../../../mmar-global-data-structure";
import {HTTP403Constrain} from "../../middleware/error_handling/standard_errors.middleware";
import {metaObjectExists} from "./Instance_commons.rules";
import {PoolClient} from "pg";
import {attribute_regex} from "./Metamodel_probe";

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
 *
 * The guard used to read `attributeType.length === 0` and then index
 * `attributeType[0]`, so the check ran only when there was nothing to check with
 * and was skipped whenever the attribute had a type - which is to say it never
 * enforced anything. Enforcing it is a deliberate behaviour change, decided by
 * the operator: a value that does not match its type's regex is now refused with
 * 403 where it used to be stored.
 *
 * Two cases accept without testing, because there is no constraint to apply
 * rather than because the value satisfies one: an attribute whose type states no
 * regex, and an instance carrying no value at all.
 * @category Rule
 * @param client The database connection client
 * @param attributeToTest The attribute to test the value
 */
export async function regexExValidator(
    client: PoolClient,
    attributeToTest: AttributeInstance
): Promise<boolean> {
    const regexFromDb = await attribute_regex(
        client,
        attributeToTest.uuid_attribute
    );
    if (regexFromDb === null) return true;

    const value = attributeToTest.get_value();
    if (value === null || value === undefined) return true;

    // The flags are the ones this rule was written with. Note that "m" makes the
    // anchors match per line, so a multi-line value satisfies a "^...$" regex as
    // long as one of its lines does; that is the existing rule, not a new one.
    const sc = new RegExp(regexFromDb, "gmi");
    if (String(value).match(sc) !== null) {
        return true;
    }
    throw new HTTP403Constrain(
        `The rule error was fired for the attribute ${attributeToTest.uuid}: ${value} does not match the regex ${sc}`
    );
}
