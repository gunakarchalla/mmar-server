import { RequestHandler } from "express";
import { SceneInstance } from "../../../../../mmar-global-data-structure";
import { database_connection } from "../../../../index";
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
  sceneToTest: SceneInstance | SceneInstance[]
) {
  const client = await database_connection.getPool().connect();

  try {
    if (sceneToTest instanceof SceneInstance) {
      await applyRules(client, sceneToTest);
    } else {
      for (const sceneInstanceToTestIntern of sceneToTest) {
        await applyRules(client, sceneInstanceToTestIntern);
      }
    }
    // eslint-disable-next-line no-useless-catch
  } catch (err) {
    throw err;
  } finally {
    client.release();
  }
}
