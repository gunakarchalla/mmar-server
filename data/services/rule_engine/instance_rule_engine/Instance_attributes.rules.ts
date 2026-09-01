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
 * regex, and an instance carrying no value at all. The latter covers the sentinel
 * strings the modeling clients store for an unset attribute ("not defined",
 * "undefined", "") as well as a real null/undefined - see `numerise` in
 * mmar-modeling-client-react/src/resources/services/format.ts.
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
    const normalized = typeof value === "string" ? value.trim() : value;
    if (
        normalized === "" ||
        normalized === "not defined" ||
        normalized === "undefined"
    )
        return true;

    // The flags are the ones this rule was written with. Note that "m" makes the
    // anchors match per line, so a multi-line value satisfies a "^...$" regex as
    // long as one of its lines does; that is the existing rule, not a new one.
    const sc = new RegExp(unwrapRegexLiteral(regexFromDb), "gmi");
    if (String(value).match(sc) !== null) {
        return true;
    }
    throw new HTTP403Constrain(
        `The rule error was fired for the attribute ${attributeToTest.uuid}: ${value} does not match the regex ${sc}`
    );
}

/**
 * @description - The metamodel stores a meta attribute type's regex as a bare
 * pattern (`^(TCP|UDP)$`). The metamodeling client's RegEx field is free text,
 * so values are sometimes entered - or round-tripped through serialization - as a
 * JavaScript regex literal instead: `/^(TCP|UDP)$/gim`, or a half-mangled
 * `/^(TCP|UDP)$` that kept only its leading slash. Fed straight to `new RegExp`
 * those slashes become literal characters the value can never contain, so every
 * instance is refused with a 403. This strips that wrapper back to the pattern.
 * @param {string} raw - The stored `regex_value`.
 * @returns {string} - The pattern, without any surrounding literal syntax.
 */
export function unwrapRegexLiteral(raw: string): string {
    const pattern = raw.trim();
    // A well-formed literal: /pattern/ or /pattern/flags. Flags are dropped - the
    // validator applies its own fixed "gmi".
    const literal = pattern.match(/^\/(.+)\/[dgimsuy]*$/);
    if (literal) return literal[1];
    // A literal whose trailing "/flags" was lost, leaving "/^...". A pattern that
    // truly begins by matching a slash then asserts start-of-line can never hold,
    // so treating the leading slash as a mistake is safe.
    if (pattern.startsWith("/^")) return pattern.slice(1);
    return pattern;
}
