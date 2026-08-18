import { NextFunction, Request, RequestHandler, Response } from "express";
import { PoolClient } from "pg";
import type { UUID } from "../../../../mmar-global-data-structure";
import { queries } from "../../../index";
import { with_client } from "../database_connection";
import { requireUser } from "./auth.middleware";
import { HTTP403NORIGHT } from "./error_handling/standard_errors.middleware";

/**
 * @description - The three rights a user can hold over a scene instance.
 *
 * They correspond one to one with the read_access / edit_access / delete_access
 * columns of scene_instance_user_access, and with the sceneinstance_*_check
 * queries that read them.
 */
export type SceneAccess = "read" | "edit" | "delete";

/**
 * @description - The check query that decides each right. These are the same
 * queries Instance_scenes uses for the scene itself, so that a caller who may
 * read a scene may read its contents and one who may not, may not.
 */
const CHECK_QUERY: Record<SceneAccess, string> = {
    read: "sceneinstance_read_check",
    edit: "sceneinstance_edit_check",
    delete: "sceneinstance_delete_check",
};

/**
 * @description - The scene instance that owns an instance object.
 *
 * Authorization in this server is scene-instance-level only: a user's rights over
 * a class instance, attribute instance, port, role, relation or bendpoint follow
 * from their access to the scene instance that contains it. The routes that
 * address one of those objects by uuid therefore have to find its scene before
 * they can decide anything, and this is that walk.
 *
 * It is a single recursive query rather than a chain of lookups. Every step is an
 * index or primary key hit, the walk is at most a handful of levels deep — an
 * attribute of a port of a class of a scene is the longest — and UNION discards
 * uuids already seen, so a reference cycle terminates instead of looping.
 * @param {PoolClient} client - The client to the database.
 * @param {UUID} objectUuid - The instance object to locate.
 * @returns {Promise<UUID | undefined>} - The owning scene instance, or undefined
 * if the object does not exist or belongs to no scene.
 */
export async function owning_scene_instance(
    client: PoolClient,
    objectUuid: UUID,
): Promise<UUID | undefined> {
    const query = queries.getQuery_get("instance_object_owning_scene_query");
    const res = await client.query(query, [objectUuid]);
    return res.rows[0]?.uuid_scene_instance as UUID | undefined;
}

/**
 * @description - Whether a user holds a right over a scene instance.
 * @param {PoolClient} client - The client to the database.
 * @param {UUID} sceneUuid - The scene instance to test.
 * @param {UUID} userUuid - The user asking.
 * @param {SceneAccess} access - The right required.
 * @returns {Promise<boolean>} - True if the user holds it.
 */
export async function has_scene_access(
    client: PoolClient,
    sceneUuid: UUID,
    userUuid: UUID,
    access: SceneAccess,
): Promise<boolean> {
    const check = queries.getQuery_get(CHECK_QUERY[access]);
    const res = await client.query(check, [sceneUuid, userUuid]);
    return res.rowCount !== 0;
}

/**
 * @description - Refuse the request unless the caller holds a right over the scene
 * instance that owns the object named by a path parameter.
 *
 * These routes — /classesInstances/:uuid and its siblings — address an instance
 * object directly and used to consult nothing at all, so knowing a uuid was
 * enough to read or change it. The check belongs here rather than in the data
 * layer because the same loaders serve the child path of a scene read, which has
 * already paid the check at the scene and must not pay it again per object.
 *
 * An object that resolves to no scene is passed through: it either does not exist,
 * in which case the handler answers 404 as it always has, or it is a scene-less
 * object created directly through a POST-by-uuid route, which has no scene
 * boundary to be authorized against.
 *
 * Must be placed after authenticate_token.
 * @param {SceneAccess} access - The right the verb of the route requires.
 * @param {string} param - The path parameter naming the instance object.
 * @returns {RequestHandler} - The middleware.
 */
export function authorize_instance_object(
    access: SceneAccess,
    param = "uuid",
): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = requireUser(req);
            const objectUuid = req.params[param];

            await with_client(undefined, async (client) => {
                const sceneUuid = await owning_scene_instance(client, objectUuid);
                if (sceneUuid === undefined) return;

                if (!(await has_scene_access(client, sceneUuid, user.uuid, access))) {
                    throw new HTTP403NORIGHT(
                        `The user ${user.uuid} has no right to ${access} the scene instance ${sceneUuid} that owns the instance object ${objectUuid}`,
                    );
                }
            });
            return next();
        } catch (err) {
            return next(err);
        }
    };
}

/**
 * @description - Refuse the request unless the caller holds a right over the scene
 * instance named directly by a path parameter.
 *
 * This is the /sceneInstances/:uuid/classesInstances family: the scene is already
 * in the path, so no walk is needed, but the handlers reach into the contents of
 * a scene through the child loaders, which perform no check of their own.
 *
 * Do not put this on /sceneInstances/:uuid itself — Instance_scenes checks that
 * one already, and a second check would be redundant.
 *
 * Must be placed after authenticate_token.
 * @param {SceneAccess} access - The right the verb of the route requires.
 * @param {string} param - The path parameter naming the scene instance.
 * @returns {RequestHandler} - The middleware.
 */
export function authorize_scene_instance(
    access: SceneAccess,
    param = "uuid",
): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = requireUser(req);
            const sceneUuid = req.params[param];

            await with_client(undefined, async (client) => {
                // A scene that does not exist is left to the handler, which answers
                // 404: reporting 403 here would say the same thing to a caller with
                // access and to one without, but for opposite reasons.
                const exists = await client.query(
                    queries.getQuery_get("sceneinstance_exist_check"),
                    [sceneUuid],
                );
                if (exists.rowCount === 0) return;

                if (!(await has_scene_access(client, sceneUuid, user.uuid, access))) {
                    throw new HTTP403NORIGHT(
                        `The user ${user.uuid} has no right to ${access} the scene instance ${sceneUuid}`,
                    );
                }
            });
            return next();
        } catch (err) {
            return next(err);
        }
    };
}
