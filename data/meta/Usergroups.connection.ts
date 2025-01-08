import {CRUD} from "../common/crud.interface";
import {PoolClient} from "pg";
import {Usergroup, UUID,} from "../../../mmar-global-data-structure";
import Metamodel_metaobject_connection from "./Metamodel_metaobjects.connection";
import Users_connection from "./Users.connection";
import {queries} from "../../index";
import {
    BaseError,
    HTTP403NORIGHT,
    HTTP404Error,
} from "../services/middleware/error_handling/standard_errors.middleware";
import Metamodel_common_functionsConnection from "./Metamodel_common_functions.connection";

class UsergroupsConnection implements CRUD {
    async getAll(client: PoolClient, userUuid?: UUID): Promise<Usergroup[] | BaseError> {
        try {
            const returnUsergroups = new Array<Usergroup>();
            const data = await client.query(
                "SELECT m.uuid FROM user_group ug, metaobject m WHERE ug.uuid_metaobject=m.uuid",
            );
            for (const row of data.rows) {
                const usergroup = await this.getByUuid(client, row.uuid, userUuid);
                if (usergroup instanceof Usergroup) returnUsergroups.push(usergroup);
            }
            return returnUsergroups;
        } catch (err) {
            throw new Error(`Error getting all usergroups: ${err}`);
        }
    }

    async getByUuid(
        client: PoolClient,
        usergroupUuid: UUID,
        userUuid?: UUID,
    ): Promise<Usergroup | undefined | BaseError> {
        try {
            const userGroup_query =
                "SELECT * FROM user_group ug, metaobject m WHERE ug.uuid_metaobject=m.uuid and ug.uuid_metaobject = $1 ";
            let newUserGroup: Usergroup | undefined;

            if (userUuid) {
                const read_check = queries.getQuery_get("read_check");
                const res = await client.query(read_check, [usergroupUuid, userUuid]);
                if (res.rowCount == 0) {
                    return new HTTP403NORIGHT(`The user ${userUuid} has no right to read the user group ${usergroupUuid}`);
                }
            }
            const res_usergroup = await client.query(userGroup_query, [usergroupUuid]);

            if (res_usergroup.rowCount == 1) {
                newUserGroup = Usergroup.fromJS(res_usergroup.rows[0]) as Usergroup;
                const dataWriteRights = await client.query(
                    "SELECT * FROM has_write_right har WHERE uuid_user_group = $1",
                    [usergroupUuid],
                );
                const dataReadRights = await client.query(
                    "SELECT * FROM has_read_right WHERE uuid_user_group = $1",
                    [usergroupUuid],
                );
                const dataDeleteRights = await client.query(
                    "SELECT * FROM has_delete_right WHERE uuid_user_group = $1",
                    [usergroupUuid],
                );

                const dataCreateInstances = await client.query(
                    "SELECT * FROM can_create_instances WHERE uuid_user_group = $1",
                    [usergroupUuid],
                );

                for (const row of dataWriteRights.rows) {
                    newUserGroup.add_write_right(row.uuid_metaobject);
                    newUserGroup.add_write_right(row.uuid_instance_object);
                }
                for (const row of dataReadRights.rows) {
                    newUserGroup.add_read_right(row.uuid_metaobject);
                    newUserGroup.add_read_right(row.uuid_instance_object);
                }
                for (const row of dataDeleteRights.rows) {
                    newUserGroup.add_delete_right(row.uuid_metaobject);
                    newUserGroup.add_delete_right(row.uuid_instance_object);
                }

                for (const row of dataCreateInstances.rows) {
                    newUserGroup.add_can_create_instances(row.uuid_metaobject);
                }

            }
            return newUserGroup;
        } catch (err) {
            throw new Error(`Error getting the usergroup ${usergroupUuid}: ${err}`);
        }
    }

    async create(
        client: PoolClient,
        newUserGroup: Usergroup,
        userUuid?: UUID,
    ): Promise<Usergroup | undefined | BaseError> {
        try {
            const created_metaObject = await Metamodel_metaobject_connection.create(
                client,
                newUserGroup,
                userUuid,
                "user_group",
            );
            if (created_metaObject instanceof BaseError) {
                if (created_metaObject.httpCode === 403) {
                    return new HTTP403NORIGHT(`The user ${userUuid} has no right to create the user group ${newUserGroup.get_uuid()}`);
                }
                return created_metaObject;
            }
            if (!created_metaObject) return undefined;

            await client.query(
                "INSERT INTO user_group (uuid_metaobject) VALUES ($1)",
                [created_metaObject.get_uuid()],
            );
            await this.update(
                client,
                created_metaObject.get_uuid(),
                newUserGroup,
            );

            return await this.getByUuid(
                client,
                created_metaObject.get_uuid(),
                userUuid
            );
        } catch (err) {
            throw new Error(`Error creating the usergroup: ${err}`);
        }
    }

    async update(
        client: PoolClient,
        usergroupUuid: UUID,
        usergroupToUpdate: Usergroup,
        userUuid?: UUID,
    ): Promise<Usergroup | undefined | BaseError> {
        try {
            const updated_metaobj = await Metamodel_metaobject_connection.update(
                client,
                usergroupUuid,
                usergroupToUpdate,
                userUuid,
            );

            if (updated_metaobj instanceof BaseError) {
                if (updated_metaobj.httpCode === 403) {
                    return new HTTP403NORIGHT(`The user ${userUuid} has no right to update the user group ${usergroupUuid}`);
                }
                return updated_metaobj;
            }
            if (!updated_metaobj) return undefined;

            const params = [
                usergroupToUpdate.can_create_scenetype,
                usergroupToUpdate.can_create_attribute,
                usergroupToUpdate.can_create_attribute_type,
                usergroupToUpdate.can_create_class,
                usergroupToUpdate.can_create_relationclass,
                usergroupToUpdate.can_create_port,
                usergroupToUpdate.can_create_role,
                usergroupToUpdate.can_create_procedure,
                usergroupToUpdate.can_create_user_group,
                usergroupUuid,
            ];

            await client.query(
                "UPDATE user_group set can_create_scenetype = $1, can_create_attribute = $2, can_create_attribute_type = $3, can_create_class = $4, can_create_relationclass = $5, can_create_port = $6, can_create_role = $7, can_create_procedure = $8, can_create_user_group = $9 WHERE uuid_metaobject = $10",
                params,
            );

            for (const readRight of usergroupToUpdate.read_right) {
                const type = await Metamodel_common_functionsConnection.getTypeOfObject(client, readRight);
                if (type === "metaobject") {
                    await client.query(
                        "INSERT INTO has_read_right (uuid_user_group, uuid_metaobject) VALUES ($1, $2)",
                        [usergroupUuid, readRight],
                    );
                } else if (type === "instanceobject") {
                    await client.query(
                        "INSERT INTO has_read_right (uuid_user_group, uuid_instance_object) VALUES ($1, $2)",
                        [usergroupUuid, readRight],
                    );
                }
            }

            for (const right of usergroupToUpdate.write_right) {
                await client.query(
                    "INSERT INTO has_write_right (uuid_user_group, uuid_metaobject) VALUES ($1, $2)",
                    [usergroupUuid, right],
                );
            }

            for (const right of usergroupToUpdate.delete_right) {
                await client.query(
                    "INSERT INTO has_delete_right (uuid_user_group, uuid_metaobject) VALUES ($1, $2)",
                    [usergroupUuid, right],
                );
            }

            for (const right of usergroupToUpdate.can_create_instances) {
                await client.query(
                    "INSERT INTO can_create_instances (uuid_user_group, uuid_metaobject) VALUES ($1, $2)",
                    [usergroupUuid, right],
                );
            }


            return await this.getByUuid(client, usergroupUuid, userUuid);
        } catch (err) {
            throw new Error(`Error updating the usergroup ${usergroupUuid}: ${err}`);
        }
    }

    async hardUpdate(
        client: PoolClient,
        usergroupUuid: UUID,
        usergroupToUpdate: Usergroup,
        userUuid?: UUID,
    ): Promise<Usergroup | undefined | BaseError> {
        try {
            const currentUserGroup = Usergroup.fromJS(await this.getByUuid(client, usergroupUuid)) as Usergroup;
            const updated_obj = await this.update(
                client,
                usergroupUuid,
                usergroupToUpdate,
                userUuid,
            );

            if (updated_obj instanceof BaseError) {
                if (updated_obj.httpCode === 403) {
                    return new HTTP403NORIGHT(`The user ${userUuid} has no right to hard update the user group ${usergroupUuid}`);
                }
                return updated_obj;
            }
            if (!updated_obj) return undefined;

            const readRightsRemoved = currentUserGroup.get_read_right_difference(usergroupToUpdate.get_read_right()).removed;
            const writeRightsRemoved = currentUserGroup.get_write_right_difference(usergroupToUpdate.get_write_right()).removed;
            const deleteRightsRemoved = currentUserGroup.get_delete_right_difference(usergroupToUpdate.get_delete_right()).removed;
            const createInstancesRemoved = currentUserGroup.get_can_create_instances_difference(usergroupToUpdate.get_can_create_instances()).removed;

            const allRightsRemoved = [
                ...readRightsRemoved,
                ...writeRightsRemoved,
                ...deleteRightsRemoved,
                ...createInstancesRemoved
            ];

            for (const right of allRightsRemoved) {
                await this.deleteRight(client, usergroupUuid, right);
            }

            return await this.getByUuid(client, usergroupUuid);

        } catch (err) {
            throw new Error(
                `Error hard updating the usergroup ${usergroupUuid}: ${err}`,
            );
        }
    }

    async deleteByUuid(
        client: PoolClient,
        usergroupUuid: UUID,
        userUuid?: UUID,
    ): Promise<UUID[] | undefined | BaseError> {
        return await Metamodel_metaobject_connection.deleteByUuid(
            client,
            usergroupUuid,
            userUuid,
        );
    }

    async deleteByUserUuid(
        client: PoolClient,
        userFilterUuid: UUID,
        userGroupUuid: UUID,
        userUuid?: UUID,
    ): Promise<Usergroup | undefined | BaseError> {
        try {
            if (userUuid) {
                const delete_check = queries.getQuery_get("delete_check");
                const res = await client.query(delete_check, [userGroupUuid, userUuid]);
                if (res.rowCount == 0) return new HTTP403NORIGHT(`The user ${userUuid} has no right to delete the usergroup ${userGroupUuid}`);
            }

            await client.query(
                "DELETE FROM has_user_user_group WHERE uuid_user = $1 AND uuid_user_group = $2",
                [userFilterUuid, userGroupUuid],
            );
            return await this.getByUuid(client, userGroupUuid, userUuid);
        } catch (err) {
            throw new Error(
                `Error deleting the usergroup ${userGroupUuid} from the user ${userFilterUuid}: ${err}`,
            );
        }
    }

    async getAllByParentUuid(
        client: PoolClient,
        parentUuid: UUID,
        userUuid?: UUID,
    ): Promise<Usergroup[] | BaseError> {
        return this.getAllByUserUuid(client, parentUuid, userUuid);
    }

    async addByUserUuid(
        client: PoolClient,
        userFilterUuid: UUID,
        usergroupUuid: UUID,
        userUuid?: UUID,
    ): Promise<Usergroup | undefined | BaseError> {
        try {
            // test if the usergroup exists
            const usergroup = await this.getByUuid(client, usergroupUuid);
            if (usergroup == undefined) return new HTTP404Error(`The usergroup ${usergroupUuid} does not exist`);

            const user = await Users_connection.getByUuid(client, userFilterUuid);
            if (user == undefined) return new HTTP404Error(`The user ${userFilterUuid} does not exist`);

            if (userUuid) {
                const write_check = queries.getQuery_get("write_check");
                const res = await client.query(write_check, [usergroupUuid, userUuid]);
                if (res.rowCount == 0) return new HTTP403NORIGHT(`The user ${userUuid} has no right to update the usergroup ${usergroupUuid}`);
            }

            await client.query(
                "INSERT INTO has_user_user_group (uuid_user, uuid_user_group) VALUES ($1, $2)",
                [userFilterUuid, usergroupUuid],
            );
            return await this.getByUuid(client, usergroupUuid, userUuid);
        } catch (err) {
            throw new Error(
                `Error adding the usergroup ${usergroupUuid} to the user ${userFilterUuid}: ${err}`,
            );
        }
    }

    async getAllByUserUuid(
        client: PoolClient,
        userFilterUuid: UUID,
        userUuid?: UUID,
    ): Promise<Usergroup[] | BaseError> {
        try {
            const data = await client.query(
                "SELECT uuid_user_group FROM has_user_user_group WHERE uuid_user = $1",
                [userFilterUuid],
            );
            const usergroups: Usergroup[] = [];

            if (data.rowCount && data.rowCount > 0) {
                for (const row of data.rows) {
                    const usergroup = await this.getByUuid(client, row.uuid_user_group, userUuid);
                    if (usergroup instanceof Usergroup) {
                        usergroups.push(usergroup);
                    }
                }
            }
            return usergroups;
        } catch (err) {
            throw new Error(`Error getting all usergroups: ${err}`);
        }
    }

    async addRightToMetaObject(
        client: PoolClient,
        usergroupUuid: UUID,
        objectUuid: UUID,
        requesterUuid?: UUID,
        has_read_right?: boolean,
        has_write_right?: boolean,
        has_delete_right?: boolean,
        can_create_instances?: boolean,
    ): Promise<Usergroup | undefined | BaseError> {
        try {
            const res = await this.addRight(client, usergroupUuid, objectUuid, "uuid_metaobject", requesterUuid, has_read_right, has_write_right, has_delete_right, can_create_instances);
            if (res instanceof BaseError) return res;
            return await this.getByUuid(client, usergroupUuid, requesterUuid);
        } catch (err) {
            throw new Error(
                `Error adding the object ${objectUuid} to the usergroup ${usergroupUuid}: ${err}`,
            );
        }
    }

    async addRightToInstanceObject(
        client: PoolClient,
        usergroupUuid: UUID,
        objectUuid: UUID,
        requesterUuid?: UUID,
        has_read_right?: boolean,
        has_write_right?: boolean,
        has_delete_right?: boolean,
    ): Promise<Usergroup | undefined | BaseError> {
        try {
            const res = await this.addRight(client, usergroupUuid, objectUuid, "uuid_instance_object", requesterUuid, has_read_right, has_write_right, has_delete_right);
            if (res instanceof BaseError) return res;
            return await this.getByUuid(client, usergroupUuid);
        } catch (err) {
            throw new Error(
                `Error adding the object ${objectUuid} to the usergroup ${usergroupUuid}: ${err}`,
            );
        }
    }

    async deleteRight(
        client: PoolClient,
        usergroupUuid: UUID,
        objectUuid: UUID,
        userUuid?: UUID,
    ): Promise<Usergroup | undefined | BaseError> {
        try {

            if (userUuid) {
                const write_check = queries.getQuery_get("write_check");
                const res = await client.query(write_check, [objectUuid, userUuid]);
                if (res.rowCount == 0) return new HTTP403NORIGHT(`The user ${userUuid} has no right to update the usergroup ${usergroupUuid}`);
            }


            await client.query(
                `
                    DELETE
                    FROM has_read_right
                    WHERE uuid_user_group = $1
                      AND (uuid_instance_object = $2 OR uuid_metaobject = $2);`, [usergroupUuid, objectUuid])
            await client.query(
                `
                    DELETE
                    FROM has_write_right
                    WHERE uuid_user_group = $1
                      AND (uuid_instance_object = $2 OR uuid_metaobject = $2);`, [usergroupUuid, objectUuid])
            await client.query(` DELETE
                                 FROM has_delete_right
                                 WHERE uuid_user_group = $1
                                   AND (uuid_instance_object = $2 OR uuid_metaobject = $2);`, [usergroupUuid, objectUuid]);
            await client.query(`DELETE
                                FROM can_create_instances
                                WHERE uuid_user_group = $1
                                  AND uuid_metaobject = $2;`, [usergroupUuid, objectUuid]);
            return await this.getByUuid(client, usergroupUuid, userUuid);
        } catch (err) {
            throw new Error(
                `Error deleting the object ${objectUuid} from the usergroup ${usergroupUuid}: ${err}`,
            );
        }
    }

    private async addRight(
        client: PoolClient,
        usergroupUuid: UUID,
        objectUuid: UUID,
        target: 'uuid_metaobject' | 'uuid_instance_object',
        requesterUuid?: UUID,
        has_read_right?: boolean,
        has_write_right?: boolean,
        has_delete_right?: boolean,
        can_create_instances?: boolean,
    ): Promise<void | BaseError> {

        if (requesterUuid) {
            const write_check = queries.getQuery_get("write_check");
            const res = await client.query(write_check, [usergroupUuid, requesterUuid]);
            if (res.rowCount == 0) return new HTTP403NORIGHT(`The user ${requesterUuid} has no right to update the group ${usergroupUuid}`);
        }

        if (has_read_right) {
            await client.query(
                `INSERT INTO has_read_right (uuid_user_group, ${target})
                 VALUES ($1, $2)`,
                [usergroupUuid, objectUuid],
            );
        }
        if (has_write_right) {
            await client.query(
                `INSERT INTO has_write_right (uuid_user_group, ${target})
                 VALUES ($1, $2)`,
                [usergroupUuid, objectUuid],
            );
        }
        if (has_delete_right) {
            await client.query(
                `INSERT INTO has_delete_right (uuid_user_group, ${target})
                 VALUES ($1, $2)`,
                [usergroupUuid, objectUuid],
            );
        }

        if (can_create_instances) {
            await client.query(
                "INSERT INTO can_create_instances (uuid_user_group, uuid_metaobject) VALUES ($1, $2)",
                [usergroupUuid, objectUuid],
            );
        }
    }
}

export default new UsergroupsConnection();
