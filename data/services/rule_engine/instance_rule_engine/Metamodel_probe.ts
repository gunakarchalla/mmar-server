/**
 * @module instance/common
 */
import { PoolClient } from "pg";
import { UUID } from "../../../../../mmar-global-data-structure";
import { memoised } from "../../database_connection";

/**
 * @description - The kinds of meta object an instance object can point at.
 */
export type MetaKind =
    | "attribute"
    | "scene_type"
    | "class"
    | "relationclass"
    | "port"
    | "role";

/**
 * @description - Does a meta object of this kind exist under this uuid?
 *
 * One row per question. The rules used to answer it by calling the matching
 * Metamodel_*_connection.getByUuid and testing the result against undefined,
 * which loads the whole subtree - for an attribute that is the attribute, its
 * type, the type's role, and the type's table of columns, themselves attributes
 * - and then throws all of it away. On a scene of 150 objects that was some ten
 * thousand statements per autosave to answer about ten distinct questions.
 *
 * Each predicate below is the WHERE clause of the query the corresponding
 * getByUuid already runs, unchanged, with the projection reduced to a constant.
 * The answer is therefore the same one, for the same uuid, in every case.
 */
const EXISTS: Record<MetaKind, string> = {
    attribute:
        "SELECT 1 FROM metaobject m, attribute a WHERE m.uuid = a.uuid_metaobject AND a.uuid_metaobject = $1",
    scene_type:
        "SELECT 1 FROM metaobject m, scene_type st WHERE m.uuid = st.uuid_metaobject AND m.uuid = $1",
    class:
        "SELECT 1 FROM metaobject m, class c WHERE m.uuid = c.uuid_metaobject AND c.uuid_metaobject = $1",
    relationclass:
        "SELECT 1 FROM metaobject m, class c, relationclass rc WHERE m.uuid = c.uuid_metaobject AND rc.uuid_class = c.uuid_metaobject AND c.uuid_metaobject = $1",
    port: "SELECT 1 FROM port r, metaobject m WHERE r.uuid_metaobject = m.uuid AND r.uuid_metaobject = $1",
    role: "SELECT 1 FROM role r, metaobject m WHERE r.uuid_metaobject = m.uuid AND r.uuid_metaobject = $1",
};

/**
 * @description - The regex a meta attribute's type constrains its values with.
 *
 * The rules used to reach this one column through
 * Metamodel_attribute_types_connection.getAllByParentUuid, which resolves the
 * parent's kind, lists its types, and then loads each type as a subtree.
 */
const REGEX =
    "SELECT att.regex_value FROM metaobject m, attribute a, attribute_type att " +
    "WHERE m.uuid = att.uuid_metaobject AND a.attribute_type_uuid = att.uuid_metaobject " +
    "AND a.uuid_metaobject = $1";

/**
 * @description - Whether a meta object of the given kind exists.
 * @param {PoolClient} client - The client to the database.
 * @param {MetaKind} kind - Which kind of meta object the uuid must name.
 * @param {UUID} uuid - The uuid to look for.
 * @returns {Promise<boolean>} - True if it exists.
 * @throws {Error} - If the lookup itself fails.
 */
export async function meta_object_exists(
    client: PoolClient,
    kind: MetaKind,
    uuid: UUID
): Promise<boolean> {
    // A uuid that is absent makes the rule throw, so a negative is never asked
    // twice; it is memoised all the same, because within one validation pass no
    // statement can change the metamodel underneath it.
    return await memoised(`exists:${kind}:${uuid}`, async () => {
        const res = await client.query(EXISTS[kind], [uuid]);
        return res.rowCount === 1;
    });
}

/**
 * @description - The regex constraining a meta attribute's values, if it has one.
 * @param {PoolClient} client - The client to the database.
 * @param {UUID} attributeUuid - The meta attribute.
 * @returns {Promise<string | null>} - The regex, or null when the attribute has
 * no type or its type constrains nothing.
 * @throws {Error} - If the lookup itself fails.
 */
export async function attribute_regex(
    client: PoolClient,
    attributeUuid: UUID
): Promise<string | null> {
    return await memoised(`regex:${attributeUuid}`, async () => {
        const res = await client.query(REGEX, [attributeUuid]);
        if (res.rowCount !== 1) return null;
        return (res.rows[0].regex_value as string | null) ?? null;
    });
}
