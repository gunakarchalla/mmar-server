import {RequestHandler} from "express";
import {
    BaseError,
    HTTP403NORIGHT,
    HTTP404Error,
    HTTP409CONFLICT,
    HTTP500Error,
    HttpStatusCode,
} from "../../data/services/middleware/error_handling/standard_errors.middleware";
import {
    listAccess,
    getAccessForUser,
    upsertAccess,
    deleteAccess,
    isDeleteOwner,
    AccessLevel,
} from "../../data/instance/Instance_scene_access.connection";

const VALID_LEVELS: AccessLevel[] = ['read', 'edit', 'delete'];

function tripleToLevel(read: boolean, edit: boolean, del: boolean): AccessLevel | null {
    if (del) return 'delete';
    if (edit) return 'edit';
    if (read) return 'read';
    return null;
}

class Scene_access_controller {
    /**
     * @description - List all users with access to a scene instance.
     * @param req.params.uuid - Scene instance UUID.
     * @yield {status: 200, body: AccessRow[]} - All access entries.
     * @throws {HTTP403NORIGHT} - Caller lacks delete access.
     */
    get_scene_instance_access: RequestHandler = async (req, res, next) => {
        try {
            /*
            #swagger.tags = ['Instance']
            #swagger.summary = 'List all users with access to a scene instance'
            #swagger.responses[200] = { "description": "Successful operation" }
            #swagger.responses[403] = { "description": "Caller lacks delete access" }
            */
            const {uuid} = req.params;
            const callerUuid: string = req.body.tokendata.uuid;

            const allowed = await isDeleteOwner(uuid, callerUuid);
            if (!allowed) {
                return next(new HTTP403NORIGHT(
                    `User ${callerUuid} does not have delete access on scene instance ${uuid}`
                ));
            }

            const rows = await listAccess(uuid);
            return res.status(200).json(rows);
        } catch (err) {
            next(err);
        }
    };

    /**
     * @description - Grant or upsert access for a user on a scene instance.
     * @param req.params.uuid - Scene instance UUID.
     * @param req.body.uuid_user - Target user UUID.
     * @param req.body.access - Access level: 'read' | 'edit' | 'delete'.
     * @yield {status: 200, body: AccessRow} - The upserted access entry.
     * @throws {HTTP403NORIGHT} - Caller lacks delete access.
     */
    post_scene_instance_access: RequestHandler = async (req, res, next) => {
        try {
            /*
            #swagger.tags = ['Instance']
            #swagger.summary = 'Grant or upsert access for a user on a scene instance'
            #swagger.responses[200] = { "description": "Successful operation" }
            #swagger.responses[400] = { "description": "Invalid access level" }
            #swagger.responses[403] = { "description": "Caller lacks delete access" }
            */
            const {uuid} = req.params;
            const callerUuid: string = req.body.tokendata.uuid;
            const {uuid_user, access} = req.body;

            const allowed = await isDeleteOwner(uuid, callerUuid);
            if (!allowed) {
                return next(new HTTP403NORIGHT(
                    `User ${callerUuid} does not have delete access on scene instance ${uuid}`
                ));
            }

            if (!VALID_LEVELS.includes(access)) {
                return next(new BaseError(
                    "Bad Request", HttpStatusCode.BAD_REQUEST, true,
                    `Invalid access level '${access}'. Must be one of: read, edit, delete`
                ));
            }

            const row = await upsertAccess(uuid, uuid_user, access as AccessLevel);
            if (!row) {
                return next(new HTTP500Error(`Failed to upsert access for user ${uuid_user}`));
            }
            return res.status(200).json(row);
        } catch (err) {
            next(err);
        }
    };

    /**
     * @description - Change a user's access level on a scene instance.
     * @param req.params.uuid - Scene instance UUID.
     * @param req.params.uuid_user - Target user UUID.
     * @param req.body.access - New access level: 'read' | 'edit' | 'delete'.
     * @yield {status: 200, body: AccessRow} - The updated access entry.
     * @throws {HTTP403NORIGHT} - Caller lacks delete access.
     * @throws {HTTP409CONFLICT} - Would leave zero delete-owners.
     */
    patch_scene_instance_access: RequestHandler = async (req, res, next) => {
        try {
            /*
            #swagger.tags = ['Instance']
            #swagger.summary = 'Change a user\'s access level on a scene instance'
            #swagger.responses[200] = { "description": "Successful operation" }
            #swagger.responses[400] = { "description": "Invalid access level" }
            #swagger.responses[403] = { "description": "Caller lacks delete access" }
            #swagger.responses[409] = { "description": "Would leave zero delete-owners" }
            */
            const {uuid, uuid_user} = req.params;
            const callerUuid: string = req.body.tokendata.uuid;
            const {access} = req.body;

            const allowed = await isDeleteOwner(uuid, callerUuid);
            if (!allowed) {
                return next(new HTTP403NORIGHT(
                    `User ${callerUuid} does not have delete access on scene instance ${uuid}`
                ));
            }

            if (!VALID_LEVELS.includes(access)) {
                return next(new BaseError(
                    "Bad Request", HttpStatusCode.BAD_REQUEST, true,
                    `Invalid access level '${access}'. Must be one of: read, edit, delete`
                ));
            }

            if (access !== 'delete') {
                const rows = await listAccess(uuid);
                const deleteOwners = rows.filter(r => r.delete_access);
                const targetIsDeleteOwner = deleteOwners.some(r => r.uuid_user === uuid_user);
                if (targetIsDeleteOwner && deleteOwners.length === 1) {
                    return next(new HTTP409CONFLICT(
                        "a scene must have at least one user with delete access"
                    ));
                }
            }

            const row = await upsertAccess(uuid, uuid_user, access as AccessLevel);
            if (!row) {
                return next(new HTTP404Error(`User ${uuid_user} does not have access to scene instance ${uuid}`));
            }
            return res.status(200).json(row);
        } catch (err) {
            next(err);
        }
    };

    /**
     * @description - Revoke a user's access to a scene instance entirely.
     * @param req.params.uuid - Scene instance UUID.
     * @param req.params.uuid_user - Target user UUID.
     * @yield {status: 200, body: {uuid_user}} - UUID of the removed user.
     * @throws {HTTP403NORIGHT} - Caller lacks delete access.
     * @throws {HTTP409CONFLICT} - Would leave zero delete-owners.
     */
    delete_scene_instance_access: RequestHandler = async (req, res, next) => {
        try {
            /*
            #swagger.tags = ['Instance']
            #swagger.summary = 'Revoke a user\'s access to a scene instance'
            #swagger.responses[200] = { "description": "Successful operation" }
            #swagger.responses[403] = { "description": "Caller lacks delete access" }
            #swagger.responses[404] = { "description": "User has no access to this scene instance" }
            #swagger.responses[409] = { "description": "Would leave zero delete-owners" }
            */
            const {uuid, uuid_user} = req.params;
            const callerUuid: string = req.body.tokendata.uuid;

            const allowed = await isDeleteOwner(uuid, callerUuid);
            if (!allowed) {
                return next(new HTTP403NORIGHT(
                    `User ${callerUuid} does not have delete access on scene instance ${uuid}`
                ));
            }

            const rows = await listAccess(uuid);
            const deleteOwners = rows.filter(r => r.delete_access);
            const targetIsDeleteOwner = deleteOwners.some(r => r.uuid_user === uuid_user);
            if (targetIsDeleteOwner && deleteOwners.length === 1) {
                return next(new HTTP409CONFLICT(
                    "a scene must have at least one user with delete access"
                ));
            }

            const deletedUuid = await deleteAccess(uuid, uuid_user);
            if (!deletedUuid) {
                return next(new HTTP404Error(`User ${uuid_user} does not have access to scene instance ${uuid}`));
            }
            return res.status(200).json({uuid_user: deletedUuid});
        } catch (err) {
            next(err);
        }
    };

    /**
     * @description - Return caller's effective access level for a scene instance.
     * @param req.params.uuid - Scene instance UUID.
     * @yield {status: 200, body: {level: 'read'|'edit'|'delete'|null}}
     */
    get_my_access: RequestHandler = async (req, res, next) => {
        try {
            /*
            #swagger.tags = ['Instance']
            #swagger.summary = 'Get caller\'s effective access level for a scene instance'
            #swagger.responses[200] = { "description": "Successful operation" }
            */
            const {uuid} = req.params;
            const callerUuid: string = req.body.tokendata.uuid;

            const access = await getAccessForUser(uuid, callerUuid);
            const level = access
                ? tripleToLevel(access.read, access.edit, access.delete)
                : null;
            return res.status(200).json({level});
        } catch (err) {
            next(err);
        }
    };
}

export default new Scene_access_controller();
