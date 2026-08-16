import { RequestHandler } from "express";
import { SceneInstance } from "../../../../../mmar-global-data-structure";
import { PoolClient } from "pg";
import { with_client } from "../../database_connection";
import { applyRules } from "./Instance_scenes.rules";

export const verif_scene_instance_body: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const sceneInstanceToTest = SceneInstance.fromJS(req.body) as SceneInstance;
    await verif_inner_scene_body(sceneInstanceToTest);
    next();
  } catch (err) {
    next(err);
  }
};

export async function verif_inner_scene_body(
  sceneToTest: SceneInstance | SceneInstance[],
  client?: PoolClient
) {
  // The rule engine nests, so the connection is threaded down rather than a new
  // one taken at every level: see with_client.
  return await with_client(client, async (c) => {
    if (sceneToTest instanceof SceneInstance) {
      await applyRules(c, sceneToTest);
    } else {
      for (const element of sceneToTest) {
        await applyRules(c, element);
      }
    }
  });
}
