import {CRUD} from "../common/crud.interface";
import {User, Usergroup, UUID} from "../../../mmar-global-data-structure";
import {PoolClient} from "pg";
import bcrypt from "bcrypt";
import Metamodel_metaobject_connection from "./Metamodel_metaobjects.connection";
import UsergroupsConnection from "./Usergroups.connection";
import {queries} from "../../index";
import {
    BaseError,
    HTTP403NORIGHT,
    HTTP409CONFLICT
} from "../services/middleware/error_handling/standard_errors.middleware";

class UsersConnection implements CRUD {
    async getByUuid(
        client: PoolClient,
        userUuid: UUID,
        requserUuid?: UUID,
    ): Promise<User | undefined | BaseError> {
        try {
            const user_query =
                "SELECT * FROM users AS usr JOIN metaobject AS mo ON mo.uuid = usr.uuid_metaobject WHERE usr.uuid_metaobject = $1 ";
            let newUser: User | undefined;

            if (requserUuid) {
                const read_check = queries.getQuery_get("read_check");
                const res = await client.query(read_check, [userUuid, requserUuid]);
                if (res.rowCount == 0) return new HTTP403NORIGHT(`User ${requserUuid} does not have the right to read user ${userUuid}`);
            }
            const res_user = await client.query(user_query, [userUuid]);

            if (res_user.rowCount == 1) {
                newUser = User.fromJS(res_user.rows[0]) as User;
                const userGroups = await UsergroupsConnection.getAllByUserUuid(
                    client,
                    newUser.get_uuid(),
                );
                if (Array.isArray(userGroups)) newUser.set_has_user_group(userGroups);
            }
            return newUser;
        } catch (err) {
            throw new Error(`Error getting the user ${userUuid}: ${err}`);
        }
    }

    async getByUsername(
        client: PoolClient,
        username: string,
        requserUuid?: UUID,
    ): Promise<User | undefined | BaseError> {
        try {
            const user_query =
                "SELECT * FROM users usr, metaobject mo WHERE mo.uuid = usr.uuid_metaobject AND usr.username = $1 ";
            let newUser: User | undefined;

            if (requserUuid) {
                const read_check = queries.getQuery_get("read_check");
                const requestedUser = (await this.getByUsername(client, username));
                const requestedUuid = requestedUser instanceof User ? requestedUser.get_uuid() : undefined;
                const res = await client.query(read_check, [requestedUuid, requserUuid]);
                if (res.rowCount == 0) return new HTTP403NORIGHT(`User ${requserUuid} does not have the right to read user ${username}`);
            }

            const res_user = await client.query(user_query, [username]);

            if (res_user.rowCount == 1) {
                newUser = User.fromJS(res_user.rows[0]) as User;
                const userGroups = await UsergroupsConnection.getAllByUserUuid(
                    client,
                    newUser.get_uuid(),
                );
                if (Array.isArray(userGroups)) newUser.set_has_user_group(userGroups);
            }
            return newUser;
        } catch (err) {
            throw new Error(`Error getting the user ${username}: ${err}`);
        }
    }

    async getAll(client: PoolClient, userUuid?: UUID): Promise<User[] | BaseError> {
        try {
            const users: User[] = new Array<User>();
            const data = await client.query(
                "SELECT mo.uuid FROM users usr, metaobject mo WHERE mo.uuid = usr.uuid_metaobject",
            );
            if (data.rowCount && data.rowCount > 0) {
                for (const usr of data.rows) {
                    const newUser = await this.getByUuid(client, usr.uuid, userUuid);
                    if (newUser instanceof User) users.push(newUser);
                }
            }
            return users;
        } catch (err) {
            throw new Error(`Error getting all users: ${err}`);
        }
    }

    async getByUsergroupUuid(
        client: PoolClient,
        usergroupUuid: UUID,
        userUuid?: UUID,
    ): Promise<User[] | BaseError> {
        try {
            const users: User[] = new Array<User>();
            const data = await client.query(
                "SELECT usr.uuid_metaobject FROM has_user_user_group AS huug JOIN users AS usr ON huug.uuid_user = usr.uuid_metaobject WHERE huug.uuid_user_group = $1",
                [usergroupUuid],
            );
            if (data.rowCount && data.rowCount > 0) {
                for (const usr of data.rows) {
                    const newUser = await this.getByUuid(client, usr.uuid_metaobject, userUuid);
                    if (newUser instanceof User) users.push(newUser);
                }
            }
            return users;
        } catch (err) {
            throw new Error(
                `Error getting all users for usergroup ${usergroupUuid}: ${err}`,
            );
        }
    }

    async create(
        client: PoolClient,
        newUser: User,
        userUuid?: UUID,
    ): Promise<User | undefined | BaseError> {
        try {
            if (await this.getByUsername(client, newUser.get_username())) {
                return new HTTP409CONFLICT(`User ${newUser.get_username()} already exists`);
            }

            newUser.set_name(newUser.get_username());
            const created_metaObject = await Metamodel_metaobject_connection.create(
                client,
                newUser,
                userUuid,
                "user",
            );
            if (created_metaObject instanceof BaseError) {
                if (created_metaObject.httpCode === 403) {
                    return new HTTP403NORIGHT(`The user ${userUuid} has no right to create the user`);
                }
                return created_metaObject;
            }
            if (!created_metaObject) return undefined;

            const hash = await bcrypt.hash(newUser.get_password(), 10);

            await client.query(
                "INSERT INTO users(uuid_metaobject,username,  password) VALUES ($1, $2, $3) RETURNING uuid_metaobject, username, password",
                [created_metaObject.get_uuid(), newUser.get_username(), hash],
            );

            await this.update(client, created_metaObject.get_uuid(), newUser, userUuid);
            return await this.getByUsername(client, newUser.get_username());
        } catch (err) {
            throw new Error(`Error creating the user: ${err}`);
        }
    }

    async deleteByUuid(
        client: PoolClient,
        uuidToDelete: UUID,
        userUuid?: UUID,
    ): Promise<UUID[] | undefined | BaseError> {
        return await Metamodel_metaobject_connection.deleteByUuid(
            client,
            uuidToDelete,
            userUuid,
        );
    }

    async getAllByParentUuid(): Promise<User[]> {
        return Promise.resolve([]);
    }

    async update(
        client: PoolClient,
        uuidToUpdate: UUID,
        userToUpdate: User,
        userUuid?: UUID,
    ): Promise<User | undefined | BaseError> {
        try {
            const updated_metaObject = await Metamodel_metaobject_connection.update(
                client,
                uuidToUpdate,
                userToUpdate,
                userUuid,
            );

            if (updated_metaObject instanceof BaseError) {
                if (updated_metaObject.httpCode === 403) {
                    return new HTTP403NORIGHT(`The user ${userUuid} has no right to update the class`);
                }
                return updated_metaObject;
            }
            if (!updated_metaObject) return undefined;


            const query_update =
                "UPDATE users SET username = $1 WHERE uuid_metaobject = $2";
            await client.query(query_update, [userToUpdate.get_username(), uuidToUpdate]);

            const current_user = User.fromJS(await this.getByUuid(client, uuidToUpdate)) as User;

            // update the user groups of the user
            const userGroupDifference = current_user.get_user_group_difference(
                userToUpdate.get_has_user_group(),
            );

            for (const userGroup of userGroupDifference.added) {
                const newUserGroup = await UsergroupsConnection.create(client, userGroup, userUuid);
                if (newUserGroup instanceof Usergroup) {
                    await UsergroupsConnection.addByUserUuid(
                        client,
                        uuidToUpdate,
                        newUserGroup.get_uuid(),
                    );
                } else if (!(newUserGroup instanceof BaseError)) {
                    await UsergroupsConnection.addByUserUuid(
                        client,
                        uuidToUpdate,
                        userGroup.uuid,
                    );
                }
            }

            for (const userGroup of userGroupDifference.modified) {
                await UsergroupsConnection.update(
                    client,
                    userGroup.uuid,
                    userGroup,
                    userUuid,
                );
            }

            return await this.getByUuid(client, uuidToUpdate);
        } catch (err) {
            throw new Error(`Error updating user ${uuidToUpdate} : ${err}`);
        }
    }

    async hardPatch(
        client: PoolClient,
        uuidToUpdate: UUID,
        userToUpdate: User,
        userUuid?: UUID,
    ): Promise<User | undefined | BaseError> {
        try {
            const query_disconnect =
                "DELETE FROM has_user_user_group WHERE uuid_user = $1 and uuid_user_group = $2";

            await this.update(client, uuidToUpdate, userToUpdate, userUuid);

            const current_user = User.fromJS(await this.getByUuid(client, uuidToUpdate)) as User;

            const userGroupsRemoved = current_user.get_user_group_difference(
                userToUpdate.get_has_user_group(),
            ).removed;

            for (const userGroup of userGroupsRemoved) {
                await client.query(query_disconnect, [uuidToUpdate, userGroup.uuid]);
            }

            return await this.getByUuid(client, uuidToUpdate);
        } catch (err) {
            throw new Error(`Error hard patching user ${uuidToUpdate} : ${err}`);
        }
    }

    async matchPassword(
        client: PoolClient,
        username: string,
        password: string,
    ): Promise<boolean> {
        try {
            const user = await this.getByUsername(client, username);
            if (!(user instanceof User)) return false;
            return await bcrypt.compare(password, user.get_password());
        } catch (err) {
            throw new Error(`Error matching password for user ${username} : ${err}`);
        }
    }
}

export default new UsersConnection();
