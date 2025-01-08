import {RequestHandler} from "express";
import {PortInstance} from "../../../../../mmar-global-data-structure";
import {database_connection} from "../../../../index";
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
  portToTest: PortInstance | PortInstance[]
) {
  const client = await database_connection.getPool().connect();

  try {
    if (portToTest instanceof PortInstance) {
      await applyRules(client, portToTest);
    } else {
      for (const portInstanceToTestIntern of portToTest) {
        await applyRules(client, portInstanceToTestIntern);
      }
    }
    // eslint-disable-next-line no-useless-catch
  } catch (err) {
    throw err;
  } finally {
    client.release();
  }
}
