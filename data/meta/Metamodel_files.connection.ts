import {CRUD} from "../common/crud.interface";
import {PoolClient} from "pg";
import {File, UUID} from "../../../mmar-global-data-structure";
import Metamodel_metaobject_connection from "./Metamodel_metaobjects.connection";
import {queries} from "../../index";
import {BaseError, HTTP403NORIGHT} from "../services/middleware/error_handling/standard_errors.middleware";

class Metamodel_filesConnection implements CRUD {

    async create(
        client: PoolClient,
        newFile: File,
        userUuid?: UUID
    ): Promise<File | undefined | BaseError> {
        try {
            await client.query("BEGIN");
            const query =
                "INSERT INTO file (uuid_metaobject, data, type) VALUES ($1, $2, $3)";
            const created_metaObject = await Metamodel_metaobject_connection.create(
                client,
                newFile,
                userUuid,
                "file"
            );

            if (created_metaObject instanceof BaseError) {
                if (created_metaObject.httpCode === 403) {
                    return new HTTP403NORIGHT(`The user ${userUuid} has no right to create the file ${newFile.name}`);
                }
                return created_metaObject;
            }
            if (!created_metaObject) return undefined;

            await client.query(query, [
                created_metaObject.get_uuid(),
                newFile.data,
                newFile.type,
            ]);

            const createdFile = await this.update(client, created_metaObject.get_uuid(), newFile, userUuid);
            await client.query("COMMIT");

            return createdFile;

        } catch (error) {
            await client.query("ROLLBACK");
            throw new Error(`Error creating the file.`);
        }
    }

    async deleteByUuid(
        client: PoolClient,
        uuidToDelete: UUID,
        userUuid?: UUID
    ): Promise<UUID[] | BaseError | undefined> {
        try {
            return await Metamodel_metaobject_connection.deleteByUuid(
                await client,
                uuidToDelete,
                userUuid
            );
        } catch (err) {
            throw new Error(`Error deleting the file: ${uuidToDelete}: ${err}`);
        }
    }

    getAllByParentUuid(): Promise<File[]> {
        return Promise.resolve([]);
    }

    async getByUuid(
        client: PoolClient,
        uuidToGet: UUID,
        userUuid?: UUID
    ): Promise<File | undefined | BaseError> {
        try {
            await client.query("BEGIN");
            let return_file;
            const query =
                "SELECT * FROM file f JOIN metaobject m ON f.uuid_metaobject = m.uuid WHERE f.uuid_metaobject = $1 LIMIT 1";

            if (userUuid) {
                const read_check = queries.getQuery_get("read_check");
                const res = await client.query(read_check, [uuidToGet, userUuid]);
                if (res.rowCount == 0) {
                    return new HTTP403NORIGHT(`The user ${userUuid} has no right to read the file ${uuidToGet}`);
                }
            }

            const res = await client.query(query, [uuidToGet]);
            await client.query("COMMIT");
            if (res.rowCount == 1) {
                return_file = File.fromJS(res.rows[0]) as File;
            }
            return return_file;
        } catch (error) {
            await client.query("ROLLBACK");
            throw new Error(`Error getting the file with uuid ${uuidToGet}.`);
        }
    }

    // todo: test this function
    async getByName(
        client: PoolClient,
        name: string,
        userUuid?: UUID
    ): Promise<File | undefined | BaseError> {
        try {
            await client.query("BEGIN");
            let return_file;
            const query =
                "select * from file f, metaobject m where f.uuid_metaobject = m.uuid and m.name = $1 limit 1";

            if (userUuid) {
                const requestedFile = (await this.getByName(client, name));
                const requestedUuid = requestedFile instanceof File ? requestedFile.get_uuid() : undefined;
                const read_check = queries.getQuery_get("read_check");
                const res = await client.query(read_check, [requestedUuid, userUuid]);
                if (res.rowCount == 0) {
                    return new HTTP403NORIGHT(`The user ${userUuid} has no right to read the file ${name}`);
                }
            }


            const res = await client.query(query, [name]);
            await client.query("COMMIT");
            if (res.rowCount == 1) {
                // the user has the rights to read the file
                return_file = File.fromJS(res.rows[0]) as File;
            }
            return return_file;
        } catch (error) {
            await client.query("ROLLBACK");
            throw new Error(`Error getting the file with name ${name}.`);
        }
    }

    async update(
        client: PoolClient,
        uuidToUpdate: UUID,
        newFile: File,
        userUuid?: UUID
    ): Promise<File | undefined | BaseError> {
        try {
            await client.query("BEGIN");
            const query =
                "UPDATE file SET data = $1, type = $2 WHERE uuid_metaobject = $3";

            const updated_metaobj = await Metamodel_metaobject_connection.update(
                client,
                uuidToUpdate,
                newFile,
                userUuid
            );

            if (updated_metaobj instanceof BaseError) {
                if (updated_metaobj.httpCode === 403) {
                    return new HTTP403NORIGHT(`The user ${userUuid} has no right to update the file ${newFile.name}`);
                }
                return updated_metaobj;
            }
            if (!updated_metaobj) return undefined;

            await client.query(query, [newFile.data, newFile.type, uuidToUpdate]);

            await client.query("COMMIT");
            return await this.getByUuid(client, uuidToUpdate, userUuid);
        } catch (error) {
            await client.query("ROLLBACK");
            throw new Error(`Error updating the file with uuid ${uuidToUpdate}.`);
        }
    }
}

export default new Metamodel_filesConnection();
