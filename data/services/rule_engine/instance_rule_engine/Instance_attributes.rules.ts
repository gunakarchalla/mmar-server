/**
 * @module instance/attribute
 */
import {AttributeInstance, table_violations, value_matches_pattern} from "../../../../../mmar-global-data-structure";
import {HTTP403Constrain} from "../../middleware/error_handling/standard_errors.middleware";
import {metaObjectExists} from "./Instance_commons.rules";
import {PoolClient} from "pg";
import {attribute_regex, attribute_table_columns} from "./Metamodel_probe";

/**
 * # Rule applied to this object:
 * all the rule are applied sequentially
 * 1. [[metaObjectExists]] : Check the existence of the meta-object
 * 2. [[regexExValidator]] : Check if the entered attribute value match the rexgex of the meta attribute type
 * 3. [[tableValidator]] : Check that the cells of a table, and of every table nested in it, follow the table rules
 *
 */
export async function applyRules(
    client: PoolClient,
    attributeToTest: AttributeInstance
) {
    await metaObjectExists(client, attributeToTest);
    await regexExValidator(client, attributeToTest);
    await tableValidator(client, attributeToTest);
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
 * How the regex is read - without flags, and against the whole value - lives in
 * `value_matches_pattern` in mmar-global-data-structure, which the modeling client
 * and the metamodeling client apply to the same values. Two cases accept without
 * testing, because there is no constraint to apply rather than because the value
 * satisfies one: an attribute whose type states no regex, and a field the request
 * did not send at all, which the write keeps as it is stored.
 *
 * An EMPTY value is not one of them. It is the value an attribute holds until
 * someone fills it in, and whether that is allowed is what the attribute type's
 * regex says: a type that accepts "" leaves its attributes optional, one that does
 * not requires a value.
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
    if (value_matches_pattern(value, regexFromDb)) return true;

    throw new HTTP403Constrain(
        `The rule error was fired for the attribute ${attributeToTest.uuid}: ${JSON.stringify(value ?? "")} does not match the regex ${regexFromDb}`
    );
}

/**
 * This rule checks that an attribute's cells follow the table rules of
 * mmar-global-data-structure (Instance_tables): every cell sits in a column of the
 * attribute's type, carries a row counted from 0 and belongs to this table, rows run
 * without gaps, and no position holds two cells. A cell that is itself a table is
 * checked the same way against its own columns. An attribute whose type has no
 * columns is not a table and may hold no cells.
 *
 * It checks the structure only. The cells' values are not put through the regex rule,
 * which applies to the attribute itself.
 * @category Rule
 * @param client The database connection client
 * @param attributeToTest The attribute whose table to check
 */
export async function tableValidator(
    client: PoolClient,
    attributeToTest: AttributeInstance
): Promise<boolean> {
    const columns = await attribute_table_columns(client, attributeToTest.uuid_attribute);
    const problems = table_violations(attributeToTest, columns);
    if (problems.length > 0) {
        throw new HTTP403Constrain(
            `The table rule was fired for the attribute ${attributeToTest.uuid}: ${problems.join("; ")}`
        );
    }
    for (const cell of attributeToTest.table_attributes ?? []) {
        await tableValidator(client, cell);
    }
    return true;
}
