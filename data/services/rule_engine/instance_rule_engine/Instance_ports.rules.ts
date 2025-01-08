/**
 * @module instance/port
 */
import {metaObjectExists} from "./Instance_commons.rules";
import {PortInstance} from "../../../../../mmar-global-data-structure";
import {PoolClient} from "pg";

/**
 * # Rule applied to this object:
 * all the rule are applied sequentially
 * 1. [[metaObjectExists]] : Check the existence of the meta-object
 */
export async function applyRules(client: PoolClient, portToTest: PortInstance) {
  //new rules comes here
  await metaObjectExists(client, portToTest);
}
