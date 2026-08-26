import {RequestHandler} from "express";
import {BaseError, HTTP500Error,} from "../../data/services/middleware/error_handling/standard_errors.middleware";
import UsergroupsConnection from "../../data/meta/Usergroups.connection";
import {Usergroup} from "../../../mmar-global-data-structure";
import { requireUser } from "../../data/services/middleware/auth.middleware";
import { withTransaction } from "../../data/services/transaction";

class UsersgroupController {
    get_usergroups: RequestHandler = withTransaction(async (client, req) => {
        const usersgroups = await UsergroupsConnection.getAll(
            client,
            requireUser(req).uuid,
        );
        if (Array.isArray(usersgroups)) {
            // withTransaction applies the ?filter to what is returned, so the
            // list is handed back whole rather than filtered element by element.
            return usersgroups;
        } else {
            throw new HTTP500Error("Failed to retrieve usergroups");
        }
    });

    get_usergroup_by_uuid: RequestHandler = withTransaction(async (client, req) => {
        const usergroup = await UsergroupsConnection.getByUuid(
            await client,
            req.params.uuid,
            requireUser(req).uuid,
        );
        if (usergroup instanceof Usergroup) {
            return usergroup;
        } else if (usergroup instanceof BaseError) {
            throw usergroup;
        } else {
            throw new HTTP500Error(`Failed to retrieve usergroup ${req.params.uuid}`,);
        }
    });

    get_usergroup_for_user_uuid: RequestHandler = withTransaction(async (client, req) => {
        const usergroup = await UsergroupsConnection.getAllByUserUuid(
            await client,
            req.params.uuid,
            requireUser(req).uuid,
        );
        if (Array.isArray(usergroup)) {
            return usergroup;
        } else {
            throw new HTTP500Error(`Failed to retrieve usergroup ${req.params.uuid}`,);
        }
    });

    post_usergroup: RequestHandler = withTransaction(async (client, req) => {
        const newUserGroup = Usergroup.fromJS(req.body) as Usergroup;
        if (req.params.uuid) {
            newUserGroup.uuid = req.params.uuid;
        }
        const usergroup = await UsergroupsConnection.create(client, newUserGroup, requireUser(req).uuid);
        if (usergroup instanceof Usergroup) {
            return usergroup;
        } else if (usergroup instanceof BaseError) {
            throw usergroup;
        } else {
            throw new HTTP500Error("Usergroup could not be created");
        }
    }, { status: 201 });

    patch_usergroup: RequestHandler = withTransaction(async (client, req) => {
        const userGrpToUpdate = Usergroup.fromJS(req.body) as Usergroup;
        userGrpToUpdate.uuid = req.params.uuid;
        const hardPatch = req.query.hardpatch === "true";
        let sc;
        if (hardPatch) {
            sc = await UsergroupsConnection.hardUpdate(
                client,
                req.params.uuid,
                userGrpToUpdate,
                requireUser(req).uuid,
            );
        } else {
            sc = await UsergroupsConnection.update(
                client,
                req.params.uuid,
                userGrpToUpdate,
                requireUser(req).uuid
            );
        }
        if (sc instanceof Usergroup) {
            return sc;
        } else if (sc instanceof BaseError) {
            throw sc;
        } else {
            throw new HTTP500Error(`Failed to update usergroup ${req.params.uuid}`);
        }
    });

    delete_usergroup: RequestHandler = withTransaction(async (client, req) => {
        const usergroup = await UsergroupsConnection.deleteByUuid(
            client,
            req.params.uuid,
            requireUser(req).uuid,
        );
        if (Array.isArray(usergroup)) {
            return usergroup;
        } else if (usergroup instanceof BaseError) {
            throw usergroup;
        } else {
            throw new HTTP500Error("Usergroup could not be deleted");
        }
    });

    delete_usergroup_for_user_uuid: RequestHandler = withTransaction(async (client, req) => {
        const usergroup = await UsergroupsConnection.deleteByUserUuid(
            client,
            req.params.userUuid,
            req.params.groupUuid,
            requireUser(req).uuid,
        );
        if (usergroup instanceof Usergroup) {
            return usergroup;
        } else if (usergroup instanceof BaseError) {
            throw usergroup;
        } else {
            throw new HTTP500Error("Usergroup could not be deleted");
        }
    });

    add_usergroup_for_user_uuid: RequestHandler = withTransaction(async (client, req) => {
        const usergroup = await UsergroupsConnection.addByUserUuid(
            client,
            req.params.userUuid,
            req.params.groupUuid,
            requireUser(req).uuid,
        );
        if (usergroup instanceof Usergroup) {
            return usergroup;
        } else if (usergroup instanceof BaseError) {
            throw usergroup;
        } else {
            throw new HTTP500Error("User could not be added to usergroup");
        }
    });

    add_metaobject_to_usergroup: RequestHandler = withTransaction(async (client, req) => {
        const usergroup = await UsergroupsConnection.addRightToMetaObject(
            client,
            req.params.uuid,
            req.params.uuidMetaObject,
            requireUser(req).uuid,
            req.body.has_read_right,
            req.body.has_write_right,
            req.body.has_delete_right
        );
        if (usergroup instanceof Usergroup) {
            return usergroup;
        } else if (usergroup instanceof BaseError) {
            throw usergroup;
        } else {
            throw new HTTP500Error("Object could not be added to usergroup");

        }
    });

    delete_metaobject_from_usergroup: RequestHandler = withTransaction(async (client, req) => {
        const usergroup = await UsergroupsConnection.deleteRightFromMetaObject(
            client,
            req.params.uuid,
            req.params.uuidMetaObject,
            requireUser(req).uuid,
            req.body.has_read_right,
            req.body.has_write_right,
            req.body.has_delete_right
        );
        if (usergroup instanceof Usergroup) {
            return usergroup;
        } else if (usergroup instanceof BaseError) {
            throw usergroup;
        } else {
            throw new HTTP500Error("Object could not be deleted from usergroup");
        }
    });
}

export default new UsersgroupController();
