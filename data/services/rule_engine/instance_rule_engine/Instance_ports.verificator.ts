import {RequestHandler} from "express";
import {PortInstance} from "../../../../../mmar-global-data-structure";
import {PoolClient} from "pg";
import {with_client} from "../../database_connection";
import {applyRules} from "./Instance_ports.rules";

export const verif_port_instance_body: RequestHandler = async (
  req,
  res,
  next
) => {
  const portToTest = PortInstance.fromJS(req.body) as PortInstance;
  try {
    await verif_inner_port_instance_body(portToTest);
    next();
  } catch (err) {
    next(err);
  }
};

export async function verif_inner_port_instance_body(
  portToTest: PortInstance | PortInstance[],
  client?: PoolClient
) {
  // The rule engine nests, so the connection is threaded down rather than a new
  // one taken at every level: see with_client.
  return await with_client(client, async (c) => {
    if (portToTest instanceof PortInstance) {
      await applyRules(c, portToTest);
    } else {
      for (const element of portToTest) {
        await applyRules(c, element);
      }
    }
  });
}
