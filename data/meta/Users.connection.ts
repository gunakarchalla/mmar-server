import {CRUD} from "../common/crud.interface";
import {User, UUID} from "../../../mmar-global-data-structure";
import {PoolClient} from "pg";
import bcrypt from "bcrypt";
import Metamodel_metaobject_connection from "./Metamodel_metaobjects.connection";
import UsergroupsConnection from "./Usergroups.connection";
import {queries} from "../../index";
import {is_administrator} from "../services/authorization";
import {
    API401Error,
    BaseError,
    HTTP403NORIGHT,
    HTTP404Error,
    HTTP409CONFLICT
} from "../services/middleware/error_handling/standard_errors.middleware";

/**
 * @description - A valid bcrypt hash of a value nobody knows, compared against
 * when the requested login does not exist so that both outcomes take the same
 * time. Its plaintext is irrelevant and it is never stored.
 */
const NON_EXISTENT_USER_HASH =
    "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

/**
 * @description - The bcrypt cost factor every password of this system is hashed
 * with. NON_EXISTENT_USER_HASH above is a hash of this same cost, and the equal
 * timing it gives the sign in path holds only while the two agree.
 */
const BCRYPT_COST = 10;

/**
 * @description - The columns of a user that may leave the data layer.
 *
 * The password hash is deliberately absent. It used to be pulled in by SELECT *
 * and then blanked again in each controller before responding, which meant that
 * every handler added later leaked it until somebody noticed. Selecting it only
 * where it is needed — getPasswordHash, below — makes that mistake impossible
 * to repeat.
 */
const USER_COLUMNS = `mo.uuid,
                      mo.name,
                      mo.description,
                      mo.creation_time,
                      mo.modification_time,
                      usr.uuid_metaobject,
                      usr.username,
                      usr.token`;

class UsersConnection implements CRUD {
    async getByUuid(
        client: PoolClient,
        userUuid: UUID,
        requserUuid?: UUID,
    ): Promise<User | undefined | BaseError> {
        try {
            const user_query =
                `SELECT ${USER_COLUMNS} FROM users AS usr JOIN metaobject AS mo ON mo.uuid = usr.uuid_metaobject WHERE usr.uuid_metaobject = $1 `;
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
                `SELECT ${USER_COLUMNS} FROM users usr, metaobject mo WHERE mo.uuid = usr.uuid_metaobject AND usr.username = $1 `;
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

            const hash = await bcrypt.hash(newUser.get_password(), BCRYPT_COST);

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
                const userGroupUuid = userGroup.uuid;
                if (!userGroupUuid) {
                    return new HTTP404Error("User group UUID is required to link an existing user group");
                }

                const existingUserGroup = await UsergroupsConnection.getByUuid(
                    client,
                    userGroupUuid,
                    userUuid,
                );

                if (existingUserGroup instanceof BaseError) {
                    return existingUserGroup;
                }

                if (!existingUserGroup) {
                    return new HTTP404Error(`User group ${userGroupUuid} does not exist`);
                }

                // The caller is passed on so that the group's own write check and
                // the administrative-group guard apply here too: adding a
                // membership through a user PATCH used to skip both.
                await UsergroupsConnection.addByUserUuid(
                    client,
                    uuidToUpdate,
                    userGroupUuid,
                    userUuid,
                );
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

    /**
     * @description - Set the password of a user, on an administrator's behalf.
     *
     * Passwords are written only here and in changeOwnPassword below, never by
     * update(): a user is saved by PATCHing the whole object, so accepting a
     * password there would put the plaintext on the wire on every save of an
     * unrelated field.
     *
     * Restricted to administrators, checked inside the caller's transaction so
     * that the restriction holds for every route this is reached through. A
     * write right on a user object does not confer the ability to take over that
     * account.
     *
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} uuidToUpdate - The user whose password is being set.
     * @param {string} newPassword - The new password, in plaintext.
     * @param {UUID} requserUuid - The user asking, who must be an administrator.
     * @returns {Promise<User | undefined | BaseError>} - The user, without the
     * hash, or the error explaining the refusal.
     */
    async setPassword(
        client: PoolClient,
        uuidToUpdate: UUID,
        newPassword: string,
        requserUuid: UUID,
    ): Promise<User | undefined | BaseError> {
        try {
            if (!(await is_administrator(client, requserUuid))) {
                return new HTTP403NORIGHT(
                    `The user ${requserUuid} has no right to set the password of user ${uuidToUpdate}`,
                );
            }

            const written = await this.writePasswordHash(
                client,
                uuidToUpdate,
                newPassword,
            );

            // No row means no such user, which is a 404 rather than a silent success.
            if (!written) {
                return new HTTP404Error(`The user ${uuidToUpdate} does not exist`);
            }

            return await this.getByUuid(client, uuidToUpdate);
        } catch (err) {
            throw new Error(`Error setting the password of user ${uuidToUpdate}: ${err}`);
        }
    }

    /**
     * @description - Change a user's own password, authorised by their current one.
     *
     * The only password path that does not require an administrator. Knowledge
     * of the current password stands in for the caller's identity, which is what
     * makes this usable without a token — it is offered while signed out. The
     * route rate limits it for the same reason.
     *
     * The current password is checked with the comparison the sign in path uses,
     * so an unknown login costs what a wrong password costs, and both are
     * reported identically: this must not reveal which accounts exist.
     *
     * @param {PoolClient} client - The client to the database.
     * @param {string} username - The login whose password is being changed.
     * @param {string} currentPassword - The password in force, as proof of identity.
     * @param {string} newPassword - The password to replace it with.
     * @returns {Promise<User | undefined | BaseError>} - The user, without the
     * hash, or the error explaining the refusal.
     */
    async changeOwnPassword(
        client: PoolClient,
        username: string,
        currentPassword: string,
        newPassword: string,
    ): Promise<User | undefined | BaseError> {
        try {
            if (!(await this.matchPassword(client, username, currentPassword))) {
                return new API401Error(`Wrong password or username`);
            }

            // Reached only once the current password matched, so looking the
            // account up here cannot reveal whether it exists.
            const user = await this.getByUsername(client, username);
            if (!(user instanceof User)) {
                return new API401Error(`Wrong password or username`);
            }

            const written = await this.writePasswordHash(
                client,
                user.get_uuid(),
                newPassword,
            );
            if (!written) {
                return new HTTP404Error(`The user ${username} does not exist`);
            }

            return await this.getByUuid(client, user.get_uuid());
        } catch (err) {
            throw new Error(`Error changing the password of user ${username}: ${err}`);
        }
    }

    /**
     * @description - Hash a password and store it. The single write that touches
     * the password column. It performs no authorisation of its own: each caller
     * establishes that it is entitled to the write before reaching here.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} uuidToUpdate - The user to write to.
     * @param {string} newPassword - The new password, in plaintext.
     * @returns {Promise<boolean>} - False if no such user exists.
     */
    private async writePasswordHash(
        client: PoolClient,
        uuidToUpdate: UUID,
        newPassword: string,
    ): Promise<boolean> {
        const hash = await bcrypt.hash(newPassword, BCRYPT_COST);
        const res = await client.query(
            "UPDATE users SET password = $1 WHERE uuid_metaobject = $2",
            [hash, uuidToUpdate],
        );
        return res.rowCount !== 0;
    }

    /**
     * @description - Read the stored password hash of a user. This is the only
     * read that touches the column, and its result must never reach a response.
     * @param {PoolClient} client - The client to the database.
     * @param {string} username - The login to look up.
     * @returns {Promise<string | undefined>} - The hash, or undefined if no such user.
     */
    private async getPasswordHash(
        client: PoolClient,
        username: string,
    ): Promise<string | undefined> {
        const res = await client.query(
            "SELECT password FROM users WHERE username = $1",
            [username],
        );
        return res.rowCount === 1 ? (res.rows[0].password as string) : undefined;
    }

    async matchPassword(
        client: PoolClient,
        username: string,
        password: string,
    ): Promise<boolean> {
        try {
            const hash = await this.getPasswordHash(client, username);

            // An unknown login and a wrong password have to cost the same, or the
            // difference in response time tells an attacker which usernames exist.
            // Comparing against a throwaway hash keeps both paths on the same
            // bcrypt work factor.
            if (hash === undefined) {
                await bcrypt.compare(password, NON_EXISTENT_USER_HASH);
                return false;
            }
            return await bcrypt.compare(password, hash);
        } catch (err) {
            throw new Error(`Error matching password for user ${username} : ${err}`);
        }
    }
}

export default new UsersConnection();
