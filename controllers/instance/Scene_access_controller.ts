import {RequestHandler} from "express";
import {
    HTTP400Error,
    HTTP403NORIGHT,
    HTTP404Error,
    HTTP409CONFLICT,
    HTTP500Error,
} from "../../data/services/middleware/error_handling/standard_errors.middleware";
import {
    listAccess,
    getAccessForUser,
    upsertAccess,
    deleteAccess,
    isDeleteOwner,
    isViewOwner,
    AccessLevel,
} from "../../data/instance/Instance_scene_access.connection";
import { requireUser } from "../../data/services/middleware/auth.middleware";
import { withTransaction } from "../../data/services/transaction";
import {record_security_event} from "../../data/services/security_audit.service";

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
     * @throws {HTTP403NORIGHT} - Caller lacks view access.
     */
    get_scene_instance_access: RequestHandler = withTransaction(async (client, req, res) => {
        /*
        #swagger.tags = ['Instance']
        #swagger.summary = 'List all users with access to a scene instance'
        #swagger.responses[200] = { "description": "Successful operation" }
        #swagger.responses[403] = { "description": "Caller lacks view access" }
        */
        const {uuid} = req.params;
        const callerUuid: string = requireUser(req).uuid;

        if (!(await isViewOwner(client, uuid, callerUuid))) {
            throw new HTTP403NORIGHT(
                `User ${callerUuid} does not have view access on scene instance ${uuid}`
            );
        }

        res.status(200).json(await listAccess(client, uuid));
    });

    /**
     * @description - Grant or upsert access for a user on a scene instance.
     * @param req.params.uuid - Scene instance UUID.
     * @param req.body.uuid_user - Target user UUID.
     * @param req.body.access - Access level: 'read' | 'edit' | 'delete'.
     * @yield {status: 200, body: AccessRow} - The upserted access entry.
     * @throws {HTTP403NORIGHT} - Caller lacks delete access.
     */
    post_scene_instance_access: RequestHandler = withTransaction(async (client, req, res) => {
        /*
        #swagger.tags = ['Instance']
        #swagger.summary = 'Grant or upsert access for a user on a scene instance'
        #swagger.responses[200] = { "description": "Successful operation" }
        #swagger.responses[400] = { "description": "Invalid access level" }
        #swagger.responses[403] = { "description": "Caller lacks delete access" }
        */
        const {uuid} = req.params;
        const callerUuid: string = requireUser(req).uuid;
        const {uuid_user, access} = req.body;

        if (!(await isDeleteOwner(client, uuid, callerUuid))) {
            throw new HTTP403NORIGHT(
                `User ${callerUuid} does not have delete access on scene instance ${uuid}`
            );
        }

        if (!VALID_LEVELS.includes(access)) {
            throw new HTTP400Error(
                `Invalid access level '${access}'. Must be one of: read, edit, delete`
            );
        }

        const row = await upsertAccess(client, uuid, uuid_user, access as AccessLevel);
        if (!row) {
            throw new HTTP500Error(`Failed to upsert access for user ${uuid_user}`);
        }
        record_security_event({
            event: "access_grant",
            outcome: "success",
            req: req,
            uuid_user: callerUuid,
            detail: {
                scene_instance: uuid,
                target_user: uuid_user,
                access: access,
            },
        });
        res.status(200).json(row);
    });

    /**
     * @description - Change a user's access level on a scene instance.
     * @param req.params.uuid - Scene instance UUID.
     * @param req.params.uuid_user - Target user UUID.
     * @param req.body.access - New access level: 'read' | 'edit' | 'delete'.
     * @yield {status: 200, body: AccessRow} - The updated access entry.
     * @throws {HTTP403NORIGHT} - Caller lacks delete access.
     * @throws {HTTP409CONFLICT} - Would leave zero delete-owners.
     */
    patch_scene_instance_access: RequestHandler = withTransaction(async (client, req, res) => {
        /*
        #swagger.tags = ['Instance']
        #swagger.summary = 'Change a user\'s access level on a scene instance'
        #swagger.responses[200] = { "description": "Successful operation" }
        #swagger.responses[400] = { "description": "Invalid access level" }
        #swagger.responses[403] = { "description": "Caller lacks delete access" }
        #swagger.responses[409] = { "description": "Would leave zero delete-owners" }
        */
        const {uuid, uuid_user} = req.params;
        const callerUuid: string = requireUser(req).uuid;
        const {access} = req.body;

        if (!(await isDeleteOwner(client, uuid, callerUuid))) {
            throw new HTTP403NORIGHT(
                `User ${callerUuid} does not have delete access on scene instance ${uuid}`
            );
        }

        if (!VALID_LEVELS.includes(access)) {
            throw new HTTP400Error(
                `Invalid access level '${access}'. Must be one of: read, edit, delete`
            );
        }

        if (access !== 'delete') {
            const rows = await listAccess(client, uuid);
            const deleteOwners = rows.filter(r => r.delete_access);
            const targetIsDeleteOwner = deleteOwners.some(r => r.uuid_user === uuid_user);
            if (targetIsDeleteOwner && deleteOwners.length === 1) {
                throw new HTTP409CONFLICT(
                    "a scene must have at least one user with delete access"
                );
            }
        }

        const row = await upsertAccess(client, uuid, uuid_user, access as AccessLevel);
        if (!row) {
            throw new HTTP404Error(`User ${uuid_user} does not have access to scene instance ${uuid}`);
        }
        record_security_event({
            event: "access_grant",
            outcome: "success",
            req: req,
            uuid_user: callerUuid,
            detail: {
                scene_instance: uuid,
                target_user: uuid_user,
                access: access,
            },
        });
        res.status(200).json(row);
    });

    /**
     * @description - Revoke a user's access to a scene instance entirely.
     * @param req.params.uuid - Scene instance UUID.
     * @param req.params.uuid_user - Target user UUID.
     * @yield {status: 200, body: {uuid_user}} - UUID of the removed user.
     * @throws {HTTP403NORIGHT} - Caller lacks delete access.
     * @throws {HTTP409CONFLICT} - Would leave zero delete-owners.
     */
    delete_scene_instance_access: RequestHandler = withTransaction(async (client, req, res) => {
        /*
        #swagger.tags = ['Instance']
        #swagger.summary = 'Revoke a user\'s access to a scene instance'
        #swagger.responses[200] = { "description": "Successful operation" }
        #swagger.responses[403] = { "description": "Caller lacks delete access" }
        #swagger.responses[404] = { "description": "User has no access to this scene instance" }
        #swagger.responses[409] = { "description": "Would leave zero delete-owners" }
        */
        const {uuid, uuid_user} = req.params;
        const callerUuid: string = requireUser(req).uuid;

        if (!(await isDeleteOwner(client, uuid, callerUuid))) {
            throw new HTTP403NORIGHT(
                `User ${callerUuid} does not have delete access on scene instance ${uuid}`
            );
        }

        const rows = await listAccess(client, uuid);
        const deleteOwners = rows.filter(r => r.delete_access);
        const targetIsDeleteOwner = deleteOwners.some(r => r.uuid_user === uuid_user);
        if (targetIsDeleteOwner && deleteOwners.length === 1) {
            throw new HTTP409CONFLICT(
                "a scene must have at least one user with delete access"
            );
        }

        const deletedUuid = await deleteAccess(client, uuid, uuid_user);
        if (!deletedUuid) {
            throw new HTTP404Error(`User ${uuid_user} does not have access to scene instance ${uuid}`);
        }
        record_security_event({
            event: "access_revoke",
            outcome: "success",
            req: req,
            uuid_user: callerUuid,
            detail: { scene_instance: uuid, target_user: uuid_user },
        });
        res.status(200).json({uuid_user: deletedUuid});
    });

    /**
     * @description - Return caller's effective access level for a scene instance.
     * @param req.params.uuid - Scene instance UUID.
     * @yield {status: 200, body: {level: 'read'|'edit'|'delete'|null}}
     */
    get_my_access: RequestHandler = withTransaction(async (client, req, res) => {
        /*
        #swagger.tags = ['Instance']
        #swagger.summary = 'Get caller\'s effective access level for a scene instance'
        #swagger.responses[200] = { "description": "Successful operation" }
        */
        const {uuid} = req.params;
        const callerUuid: string = requireUser(req).uuid;

        const access = await getAccessForUser(client, uuid, callerUuid);
        const level = access
            ? tripleToLevel(access.read, access.edit, access.delete)
            : null;
        res.status(200).json({level});
    });
}

export default new Scene_access_controller();
