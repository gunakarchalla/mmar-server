import {Procedure, UUID,} from "../../../mmar-global-data-structure";
import {PoolClient} from "pg";
import {queries} from "../..";
import Metamodel_metaobject_connection from "./Metamodel_metaobjects.connection";
import {CRUD} from "../common/crud.interface";
import Metamodel_common_functions from "./Metamodel_common_functions.connection";
import {BaseError, HTTP403NORIGHT} from "../services/middleware/error_handling/standard_errors.middleware";

/**
 * @description - This is the class that handles the CRUD operations for the Meta procedures.
 * @class Metamodel_procedureConnection
 * @implements {CRUD}
 * @export - This class is exported so that it can be used by other classes.
 */
class Metamodel_procedureConnection implements CRUD {
    async getIndependentAlgorithms(
        client: PoolClient,
        userUuid?: UUID
    ): Promise<Procedure[] | BaseError> {
        try {
            const procedure_query =
                'select * from "procedure" p left join has_algorithm ha ON p.uuid_metaobject = ha.uuid_procedure where ha.uuid_procedure is null';
            const returnProcedure: Procedure[] = [];
            const res_procedure = await client.query(procedure_query);
            for (const pr of res_procedure.rows) {
                const newProcedure = await this.getByUuid(
                    client,
                    pr.uuid_metaobject,
                    userUuid
                );

                if (newProcedure instanceof Procedure) {
                    returnProcedure.push(newProcedure);
                }
            }
            return returnProcedure;
        } catch (err) {
            throw new Error(`Error getting all the procedures: ${err}`);
        }
    }

    /**
     * @description - This function gets all procedures.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} procedureUuid - The uuid of the procedure to get.
     * @param {UUID} userUuid - The uuid of the user that is requesting the procedure.
     * @returns {Promise<Procedure[]>} - The array of procedure if it exists, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error getting the procedure.
     * @memberof Metamodel_procedure_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export - This function is exported so that it can be used by other procedures.
     * @method
     */
    async getAlgorithms(
        client: PoolClient,
        userUuid?: UUID
    ): Promise<Procedure[] | BaseError> {
        try {
            const procedure_query =
                'SELECT * FROM metaobject m, "procedure" p WHERE m.uuid = p.uuid_metaobject ';
            const returnProcedure: Procedure[] = [];
            const res_procedure = await client.query(procedure_query);
            for (const pr of res_procedure.rows) {
                const newProcedure = await this.getByUuid(
                    client,
                    pr.uuid,
                    userUuid
                );

                if (newProcedure instanceof Procedure) {
                    returnProcedure.push(newProcedure);
                }
            }
            return returnProcedure;
        } catch (err) {
            throw new Error(`Error getting all the procedures: ${err}`);
        }
    }


    /**
     * @description - This function gets the procedure by uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} procedureUuid - The uuid of the procedure to get.
     * @param {UUID} userUuid - The uuid of the user that is requesting the procedure.
     * @returns {Promise<Procedure | undefined>} - The procedure if it exists, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error getting the procedure.
     * @memberof Metamodel_procedure_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export - This function is exported so that it can be used by other procedures.
     * @method
     */
    async getByUuid(
        client: PoolClient,
        procedureUuid: UUID,
        userUuid?: UUID
    ): Promise<Procedure | undefined | BaseError> {
        try {

            const procedure_query =
                'SELECT * FROM metaobject m, "procedure" p WHERE m.uuid = p.uuid_metaobject AND p.uuid_metaobject = $1 ';
            let newProcedure;

            if (userUuid) {
                const read_check = queries.getQuery_get("read_check");
                const res = await client.query(read_check, [procedureUuid, userUuid]);
                if (res.rowCount == 0) {
                    return new HTTP403NORIGHT(`The user ${userUuid} has no right to read the procedure ${procedureUuid}`);
                }
            }
            const res_procedure = await client.query(procedure_query, [procedureUuid]);

            if (res_procedure.rowCount == 1) {
                newProcedure = Procedure.fromJS(res_procedure.rows[0]) as Procedure;
            }
            return newProcedure;
        } catch (err) {
            throw new Error(`Error getting the procedure ${procedureUuid}: ${err}`);
        }
    }

    /**
     * @description - This function get all the procedure of a parent instance by its uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} uuidParent - The uuid of the parent instance of the procedure to get.
     * @param {UUID} userUuid - The uuid of the user that is requesting the procedure.
     * @returns {Promise<Procedure[]>} - The array of procedure if it exists, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error getting the procedure.
     * @memberof Metamodel_procedure_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export - This function is exported so that it can be used by other files.
     * @method
     */
    async getAllByParentUuid(
        client: PoolClient,
        uuidParent: UUID,
        userUuid?: UUID
    ): Promise<Procedure[] | BaseError> {
        try {
            let procedure_query: string;
            const returnProcedure = new Array<Procedure>();
            const uuid_type =
                await Metamodel_common_functions.getMetaTypeWithMetaUuid(
                    client,
                    uuidParent
                );
            if (uuid_type !== undefined) {
                switch (uuid_type) {
                    case "scene_type":
                        procedure_query =
                            'SELECT * FROM metaobject m, "procedure" p, has_algorithm ha WHERE m.uuid = p.uuid_metaobject AND p.uuid_metaobject = ha.uuid_procedure AND ha.uuid_scene_type = $1 ';
                        break;
                    default:
                        throw new Error(
                            `Error the uuid ${uuidParent} cannot be a parent for a procedure`
                        );
                        break;
                }
                const res_procedure = await client.query(procedure_query, [uuidParent]);
                for (const cl of res_procedure.rows) {
                    const newProcedure = await this.getByUuid(client, cl.uuid, userUuid);
                    if (newProcedure instanceof Procedure) returnProcedure.push(newProcedure);

                }
            }
            return returnProcedure;
        } catch (err) {
            throw new Error(
                `Error getting procedures for parent ${uuidParent}: ${err}`
            );
        }
    }

    /**
     * @description - This function create a new procedure.
     * @param {PoolClient} client - The client to the database.
     * @param {Procedure} newProcedure - The procedure to create.
     * @param {UUID} userUuid - The uuid of the user that is creating the procedure.
     * @returns {Promise<Procedure | undefined>} - The procedure created, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error creating the procedure.
     * @memberof Metamodel_procedure_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export - This function is exported so that it can be used by other files.
     * @method
     */
    async create(
        client: PoolClient,
        newProcedure: Procedure,
        userUuid?: UUID
    ): Promise<Procedure | undefined | BaseError> {
        try {
            const query_create_procedure =
                'INSERT INTO "procedure" (uuid_metaobject) values ($1)';
            let returnProcedure: Procedure | 403 | undefined;
            const created_metaObject = await Metamodel_metaobject_connection.create(
                client,
                newProcedure,
                userUuid,
                "procedure"
            );
            if (created_metaObject instanceof BaseError) {
                if (created_metaObject.httpCode === 403) {
                    return new HTTP403NORIGHT(`The user ${userUuid} has no right to create the procedure`);
                }
                return created_metaObject;
            }
            if (!created_metaObject) return undefined;

            await client.query(query_create_procedure, [
                created_metaObject.get_uuid(),
            ]);
            await this.update(client, created_metaObject.get_uuid(), newProcedure);
            return await this.getByUuid(
                client,
                created_metaObject.get_uuid(),
                userUuid
            );
        } catch (err) {
            throw new Error(`Error creating the procedure: ${err}`);
        }
    }

    /**
     * @description - This function update a procedure.
     * @param {PoolClient} client - The client to the database.
     * @param {Procedure} newProcedure - The procedure to update.
     * @param {UUID} procedureUuidToUpdate - The uuid of the procedure to update.
     * @param {UUID} userUuid
     * @returns {Promise<Procedure | undefined>} - The procedure updated, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error updating the procedure.
     * @memberof Metamodel_procedure_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export - This function is exported so that it can be used by other files.
     * @method
     */
    async update(
        client: PoolClient,
        procedureUuidToUpdate: UUID,
        newProcedure: Procedure,
        userUuid?: UUID
    ): Promise<Procedure | undefined | BaseError> {
        try {
            const query_update_procedure =
                "UPDATE procedure SET definition= coalesce($1,definition) WHERE uuid_metaobject = $2";

            const updated_metaobj = await Metamodel_metaobject_connection.update(
                client,
                procedureUuidToUpdate,
                newProcedure,
                userUuid
            );

            if (updated_metaobj instanceof BaseError) {
                if (updated_metaobj.httpCode === 403) {
                    return new HTTP403NORIGHT(`The user ${userUuid} has no right to update the procedure ${procedureUuidToUpdate}`);
                }
                return updated_metaobj;
            }
            if (!updated_metaobj) return undefined;

            await client.query(query_update_procedure, [
                newProcedure.get_definition(),
                procedureUuidToUpdate,
            ]);

            return await this.getByUuid(client, procedureUuidToUpdate, userUuid);
        } catch (err) {
            throw new Error(
                `Error updating the procedure ${procedureUuidToUpdate}: ${err}`
            );
        }
    }

    async hardUpdate(
        client: PoolClient,
        procedureUuidToUpdate: UUID,
        newProcedure: Procedure,
        userUuid?: UUID
    ): Promise<Procedure | undefined | BaseError> {
        try {
            const query_update_procedure =
                "UPDATE procedure SET definition= coalesce($1,definition) WHERE uuid_metaobject = $2";

            const updated_metaobj = await Metamodel_metaobject_connection.update(
                client,
                procedureUuidToUpdate,
                newProcedure,
                userUuid
            );

            if (updated_metaobj instanceof BaseError) {
                if (updated_metaobj.httpCode === 403) {
                    return new HTTP403NORIGHT(`The user ${userUuid} has no right to update the procedure ${procedureUuidToUpdate}`);
                }
                return updated_metaobj;
            }
            if (!updated_metaobj) return undefined;

            await client.query(query_update_procedure, [
                newProcedure.get_definition(),
                procedureUuidToUpdate,
            ]);

            return await this.getByUuid(client, procedureUuidToUpdate, userUuid);
        } catch (err) {
            throw new Error(
                `Error updating the procedure ${procedureUuidToUpdate}: ${err}`
            );
        }
    }


    /**
     * @description - This function create a procedure for the scene type by the uuid of the scene type.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} sceneTypeUUID - The uuid of the scene type.
     * @param {Procedure[] | Procedure} newProcedure - The procedure or an array of attributes to create.
     * @param {UUID} userUuid - The uuid of the user that is creating the procedure.
     * @returns {Promise<Procedure[] | undefined>} - The array of procedure created, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error creating the procedure.
     * @memberof Metamodel_procedure_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export - This function is exported so that it can be used by other files.
     * @method
     */
    async postProceduresForSceneType(
        client: PoolClient,
        sceneTypeUUID: UUID,
        newProcedure: Procedure[] | Procedure,
        userUuid?: UUID
    ): Promise<Procedure[] | undefined | BaseError> {
        try {
            const query_connect_procedure_scenetype =
                "INSERT INTO has_algorithm (uuid_procedure, uuid_scene_type) VALUES ($1, $2) RETURNING uuid_procedure ";
            const returnProcedure = new Array<Procedure>();

            // If newProcedure is not an array, make it an array.
            if (!Array.isArray(newProcedure)) newProcedure = [newProcedure];

            for (const procedureToAdd of newProcedure) {
                const currentProcedure = await this.create(
                    client,
                    procedureToAdd,
                    userUuid
                );
                if (currentProcedure instanceof Procedure) {
                    await client.query(query_connect_procedure_scenetype, [
                        currentProcedure.get_uuid(),
                        sceneTypeUUID,
                    ]);
                    returnProcedure.push(currentProcedure);
                } else {
                    const existingProcedure = await this.getByUuid(
                        client,
                        procedureToAdd.get_uuid()
                    );
                    if (existingProcedure instanceof Procedure) {
                        await client.query(query_connect_procedure_scenetype, [
                            existingProcedure.get_uuid(),
                            sceneTypeUUID,
                        ]);
                        returnProcedure.push(existingProcedure);
                    }
                }
            }
            return returnProcedure;
        } catch (err) {
            throw new Error(
                `Error creating the procedure for the scene type ${sceneTypeUUID}: ${err}`
            );
        }
    }

    /**
     * @description - This function delete procedure for a given parent by uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} sceneTypeUUID - The uuid of the parent to delete the procedure for.
     * @param {UUID} userUuid - The uuid of the user that is deleting the procedure.
     * @returns {Promise<UUID[] | undefined>} - The array of uuid of all the objects deleted, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error deleting the procedure.
     * @memberof Metamodel_procedure_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async deleteAllByParentUuid(
        client: PoolClient,
        sceneTypeUUID: UUID,
        userUuid?: UUID
    ): Promise<UUID[] | undefined | BaseError> {
        try {
            const delete_procedure_for_scene_query =
                "delete from metaobject where uuid in (select uuid_procedure from has_algorithm where uuid_scene_type = $1) ";

            return await Metamodel_common_functions.deleteAllItems(
                client,
                delete_procedure_for_scene_query,
                sceneTypeUUID,
                userUuid
            );
        } catch (err) {
            throw new Error(
                `Error deleting the procedure(s) for the scenetype ${sceneTypeUUID}: ${err}`
            );
        }
    }

    async deleteProcedureByUUID(
        client: PoolClient,
        procedureUuid: UUID,
        userUuid?: UUID
    ): Promise<UUID[] | undefined | BaseError> {
        try {
            const delete_scene_types_query = queries.getQuery_delete(
                "delete_procedure_by_UUID"
            );
            return await Metamodel_common_functions.deleteAllItems(
                client,
                delete_scene_types_query,
                userUuid
            );
        } catch (err) {
            throw new Error(`Error deleting all the procedures: ${err}`);
        }
    }

    async deleteAll(
        client: PoolClient,
        userUuid?: UUID
    ): Promise<UUID[] | undefined | BaseError> {
        try {
            const delete_scene_types_query = queries.getQuery_delete(
                "delete_all_procedures"
            );
            return await Metamodel_common_functions.deleteAllItems(
                client,
                delete_scene_types_query,
                userUuid
            );
        } catch (err) {
            throw new Error(`Error deleting all the procedures: ${err}`);
        }
    }

    /**
     * @description - This function delete procedure by uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} uuidToDelete - The uuid of the procedure to delete.
     * @param {UUID} userUuid - The uuid of the user that is deleting the procedure.
     * @returns {Promise<UUID[] | undefined>} - The array of uuid of all the objects deleted, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error deleting the procedure.
     * @memberof Metamodel_procedure_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export - This function is exported so that it can be used by other files.
     * @method
     */
    async deleteByUuid(
        client: PoolClient,
        uuidToDelete: UUID,
        userUuid?: UUID
    ): Promise<UUID[] | undefined | BaseError> {
        try {
            return await Metamodel_metaobject_connection.deleteByUuid(
                client,
                uuidToDelete,
                userUuid
            );
        } catch (err) {
            throw new Error(`Error deleting the procedure: ${uuidToDelete}: ${err}`);
        }
    }
}



export default new Metamodel_procedureConnection();
