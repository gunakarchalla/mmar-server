import { RequestHandler } from "express";
import { PoolClient } from "pg";
import {
  attribute_value_violations,
  is_valid_pattern,
  UUID,
} from "../../../../../mmar-global-data-structure";
import { HTTP403Constrain } from "../../middleware/error_handling/standard_errors.middleware";
import { with_client } from "../../database_connection";

/**
 * # Rules applied to a meta attribute and to the attribute type it points at
 *
 * The values an attribute stores have to match the regular expression of its type:
 * the default value every instance starts out holding, and the facets a value may be
 * picked from. An attribute whose default the type refuses hands every scene built from
 * it a value that the instance rule then refuses, which costs the modeling client the
 * whole scene — so it is refused here, before the metamodel can carry it.
 *
 * The rules run on the REQUEST BODY, like the instance rule engine, rather than on each
 * row as it is written. An attribute is written by more than its own routes — saving a
 * class, a port, a scene type, a relation class or a table-bearing attribute type writes
 * the attributes hanging off it, which is how a whole metamodel is imported — so the
 * body is walked for everything that is an attribute or an attribute type, however deep
 * it sits. Rules that run before the write also keep their answer: a refusal raised
 * inside the write is wrapped by the connection layer's own error handling and reaches
 * the caller as an opaque 500 rather than as the 403 it is.
 *
 * The metamodel's levels are checked one against the next, each as it is written: an
 * attribute against its attribute type, and an attribute instance against its attribute
 * (see Instance_attributes.rules). An attribute type itself only has to state a pattern
 * that can be applied.
 *
 * `Metamodel_attributes_connection.update` and
 * `Metamodel_attribute_types_connection.update` call the same rules as a backstop for
 * writes that never passed a route.
 *
 * What counts as the value being written is what the UPDATE statements store: they are
 * written with `coalesce($n, column)`, so a field the request leaves out keeps what is
 * stored, and that is the form the rule holds against the pattern.
 */

/** What these rules read of an attribute — a request body, or a revived `Attribute`. */
export interface AttributeUnderRule {
  uuid?: UUID;
  name?: string;
  default_value?: string | null;
  facets?: string | null;
  attribute_type?: { uuid?: UUID; regex_value?: string | null } | null;
}

/** What these rules read of an attribute type. */
export interface AttributeTypeUnderRule {
  uuid?: UUID;
  name?: string;
  regex_value?: string | null;
}

/** The attribute as it stands before this write. */
const STORED_ATTRIBUTE =
  "SELECT a.default_value, a.facets, a.attribute_type_uuid FROM attribute a WHERE a.uuid_metaobject = $1";

/** The pattern an attribute type constrains its values with. */
const TYPE_PATTERN =
  "SELECT att.regex_value FROM attribute_type att WHERE att.uuid_metaobject = $1";

/** `coalesce` semantics: an absent or null incoming value keeps what is stored. */
function effective(
  incoming: string | null | undefined,
  stored: string | null | undefined
): string | null {
  return incoming ?? stored ?? null;
}

/**
 * @description - Every attribute and every attribute type the body carries, at any
 * depth: a class holds attributes and ports, a scene type holds classes, an attribute
 * type holds the attributes of its columns, and each of those attributes holds its type.
 *
 * Recognised by shape rather than by the path they sit at, so a nesting this file does
 * not know about is still checked: an attribute is what points at an attribute type, an
 * attribute type is what states a regular expression.
 * @param {unknown} body - The request body.
 * @returns - The attributes and attribute types found.
 */
export function collect_attributes_and_types(body: unknown): {
  attributes: AttributeUnderRule[];
  attributeTypes: AttributeTypeUnderRule[];
} {
  const attributes: AttributeUnderRule[] = [];
  const attributeTypes: AttributeTypeUnderRule[] = [];
  const seen = new Set<object>();

  const walk = (node: unknown): void => {
    if (Array.isArray(node)) {
      for (const entry of node) walk(entry);
      return;
    }
    if (node === null || typeof node !== "object") return;
    if (seen.has(node)) return;
    seen.add(node);

    const record = node as Record<string, unknown>;
    if ("attribute_type" in record) attributes.push(record as AttributeUnderRule);
    if ("regex_value" in record) attributeTypes.push(record as AttributeTypeUnderRule);

    for (const value of Object.values(record)) walk(value);
  };

  walk(body);
  return { attributes, attributeTypes };
}

/**
 * @description - Refuses an attribute whose default value or facets its attribute type
 * does not allow.
 *
 * The pattern held against is the one this write leaves behind: a request that carries
 * the attribute's type states the pattern itself, and the stored pattern decides only
 * when it does not.
 * @param {PoolClient} client - The database connection client.
 * @param {UUID | undefined} attributeUuid - The attribute being written, when known.
 * @param {AttributeUnderRule} incoming - The attribute as the request states it.
 * @throws {HTTP403Constrain} - If a value the write would leave behind is not allowed.
 */
export async function attribute_values_rule(
  client: PoolClient,
  attributeUuid: UUID | undefined,
  incoming: AttributeUnderRule
): Promise<void> {
  const uuid = incoming.uuid ?? attributeUuid;
  const stored = uuid
    ? (await client.query(STORED_ATTRIBUTE, [uuid])).rows[0]
    : undefined;
  const current = stored ?? {};

  const default_value = effective(incoming.default_value, current.default_value);
  const facets = effective(incoming.facets, current.facets);

  const incomingType = incoming.attribute_type;
  let pattern = incomingType?.regex_value;
  if (pattern === undefined || pattern === null) {
    const typeUuid = incomingType?.uuid ?? current.attribute_type_uuid;
    if (!typeUuid) return;
    const type = await client.query(TYPE_PATTERN, [typeUuid]);
    pattern = (type.rows[0]?.regex_value as string | null) ?? null;
  }

  const problems = attribute_value_violations({ default_value, facets }, pattern);
  if (problems.length > 0) {
    throw new HTTP403Constrain(
      `The attribute ${incoming.name ?? uuid} cannot be saved: ${problems.join("; ")}`
    );
  }
}

/**
 * @description - Refuses an attribute type whose regular expression cannot be compiled.
 *
 * A pattern is typed by hand, so an unbalanced group is a SyntaxError rather than a
 * pattern that refuses everything: stored, it would be a rule no client can apply.
 *
 * That is the whole rule. An attribute type is the more fundamental object: it states
 * what values of that type look like, and nothing about the attributes pointing at it
 * is asked here. Each level is held to the one above it as that level is written - an
 * attribute to its attribute type, an attribute instance to its attribute.
 * @param {AttributeTypeUnderRule} incoming - The type as the request states it.
 * @throws {HTTP403Constrain} - If the pattern cannot be applied.
 */
export function attribute_type_pattern_rule(incoming: AttributeTypeUnderRule): void {
  const pattern = incoming.regex_value;
  if (pattern === undefined || pattern === null) return;
  if (is_valid_pattern(pattern)) return;

  throw new HTTP403Constrain(
    `The attribute type ${incoming.name ?? incoming.uuid} cannot be saved: ${JSON.stringify(pattern)} is not a regular expression this platform can apply.`
  );
}

/**
 * @description - Applies both rules to everything in a request body, whatever kind of
 * meta object the body is. The rule the metamodel routes share.
 * @param {unknown} body - The request body.
 * @param {UUID} [uuidFromRoute] - The object the route addresses, for a body that states
 * no uuid of its own.
 * @param {PoolClient} [client] - An open connection to run on, if there is one.
 * @throws {HTTP403Constrain} - On the first value the metamodel does not allow.
 */
export async function verif_inner_metamodel_attribute_values(
  body: unknown,
  uuidFromRoute?: UUID,
  client?: PoolClient
): Promise<void> {
  const { attributes, attributeTypes } = collect_attributes_and_types(body);
  for (const attributeType of attributeTypes) attribute_type_pattern_rule(attributeType);
  if (attributes.length === 0) return;

  // Only the attribute rule asks the database anything. The rules nest, so the
  // connection is threaded down rather than a new one taken at every level: see
  // with_client.
  await with_client(client, async (c) => {
    for (const attribute of attributes) {
      await attribute_values_rule(c, uuidFromRoute, attribute);
    }
  });
}

/** The rule as the metamodel routes use it: refuse the request, or let it through. */
function body_rule(): RequestHandler {
  return async (req, _res, next) => {
    try {
      await verif_inner_metamodel_attribute_values(req.body, req.params.uuid as UUID);
      next();
    } catch (err) {
      next(err);
    }
  };
}

export const verif_attributetype_body: RequestHandler = body_rule();

export const verif_attribute_body: RequestHandler = body_rule();

/**
 * The same rule for the routes whose bodies carry attributes further down: a class and
 * its ports, a scene type and its classes, a relation class and both its ends.
 */
export const verif_metamodel_body: RequestHandler = body_rule();
