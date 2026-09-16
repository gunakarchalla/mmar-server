/**
 * @module instance/attribute
 */
import {AttributeInstance, table_violations} from "../../../../../mmar-global-data-structure";
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
