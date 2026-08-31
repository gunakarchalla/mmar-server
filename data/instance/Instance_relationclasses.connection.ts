import {RelationclassInstance, RoleInstance, UUID,} from "../../../mmar-global-data-structure";
import {PoolClient} from "pg";
import Instance_role_connection from "./Instance_roles.connection";
import {CRUD} from "../common/crud.interface";
import Instance_attribute_connection from "./Instance_attributes.connection";
import Instance_class_connection from "./Instance_classes.connection";
import Instance_objects_connection from "./Instance_objects.connection";
import {} from "../../index";
import {BaseError, HTTP403NORIGHT} from "../services/middleware/error_handling/standard_errors.middleware";

/**
 * @description - This is the class that handles the CRUD operations for the RelationClass Instances.
 * @export - The class is exported so that it can be used by other files.
 * @class Instance_relationclassesConnection
 * @implements {CRUD}
 */
class Instance_relationclassesConnection implements CRUD {
    /**
     * @description - This function gets the relationclass by the uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} relclassUuid - The uuid of the relationclass to get.
     * @param {UUID} userUuid - The uuid of the user that wants to get the relationclass.
     * @returns {Promise<RelationclassInstance | undefined>} - The relationclass instance if it exists, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error getting the port.
     * @memberof Instance_relationclass_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async getByUuid(
        client: PoolClient,
        relclassUuid: UUID,
        userUuid?: UUID
    ): Promise<RelationclassInstance | undefined | BaseError> {
        try {
            const relclasses_query: string =
                "select * from instance_object io, relationclass_instance ri, class_instance ci where io.uuid=ci.uuid_instance_object AND ri.uuid_class_instance=ci.uuid_instance_object AND ri.uuid_class_instance =$1 ";
            let newRelClass;
            // Authorization happens at the scene boundary, never per instance
            // object: the routes that address this object by uuid resolve the
            // scene instance that owns it and check that instead. Do not add a
            // per-object right check here — it would also fire for every child
            // of a scene read, which has already been authorized.

            const res_relclass = await client.query(relclasses_query, [relclassUuid]);

            if (res_relclass.rowCount == 1) {
                const cl = res_relclass.rows.pop();
                newRelClass = RelationclassInstance.fromJS(cl) as RelationclassInstance;

                const attributes = await Instance_attribute_connection.getAllByParentUuid(
                    client,
                    cl.uuid,
                    userUuid
                );
                if (Array.isArray(attributes)) newRelClass.set_attribute_instances(attributes);

                // Both ends in one query rather than one each: a relation always
                // has two roles, so this halves the round trips of every read of
                // one, and getAllByParentUuid below reads every end of every
                // relation of a scene in a single query on the same loader.
                const roles = await Instance_role_connection.getByUuids(client, [
                    cl.uuid_role_instance_from,
                    cl.uuid_role_instance_to,
                ]);

                const roleFrom = roles.get(cl.uuid_role_instance_from);
                if (roleFrom instanceof RoleInstance) newRelClass.set_role_instance_from(roleFrom);

                const roleTo = roles.get(cl.uuid_role_instance_to);
                if (roleTo instanceof RoleInstance) newRelClass.set_role_instance_to(roleTo);
            }

            return newRelClass;
        } catch (err) {
            throw new Error(
                `Error getting the relationclass ${relclassUuid}: ${err}`
            );
        }
    }

    /**
     * @description - This function get all the relationclass instances of a parent instance by its uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} uuidParent - The uuid of the parent instance of the relationclass instance to get.
     * @param {UUID} userUuid - The uuid of the user that wants to get the relationclass instances.
     * @returns {Promise<RelationclassInstance[]>} - The array of relationclass instances if it exists, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error getting the relationclass.
     * @memberof Instance_relationclass_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async getAllByParentUuid(
        client: PoolClient,
        uuidParent: UUID,
        _userUuid?: UUID
    ): Promise<RelationclassInstance[] | BaseError> {
        try {
            // The relations of the scene, then - for all of them at once - their
            // attributes and both ends of each. Calling getByUuid per relation
            // instead cost one query for the relation, one to resolve the type of
            // its attribute parent, one to list those attributes and two more for
            // its roles: five per relation where this is three in total.
            //
            // The column order is io, ri, ci exactly as in the single-relation
            // query above, so fromJS sees the same row it always did.
            const res_relclasses = await client.query(
                `SELECT io.*, ri.*, ci.*
                 FROM scene_instance si
                          JOIN assigned_to_scene ats ON ats.uuid_scene_instance = si.uuid_instance_object
                          JOIN relationclass_instance ri ON ri.uuid_class_instance = ats.uuid_class_instance
                          JOIN class_instance ci ON ci.uuid_instance_object = ri.uuid_class_instance
                          JOIN instance_object io ON io.uuid = ci.uuid_instance_object
                 WHERE si.uuid_instance_object = $1`,
                [uuidParent]
            );
            if (res_relclasses.rowCount === 0) return [];

            const returnRelClasses = res_relclasses.rows.map(
                (row) => RelationclassInstance.fromJS(row) as RelationclassInstance
            );

            // Both ends of every relation in one call. Duplicates cost nothing:
            // getByUuids keys its result by uuid.
            const roleUuids: UUID[] = [];
            for (const row of res_relclasses.rows) {
                if (row.uuid_role_instance_from) roleUuids.push(row.uuid_role_instance_from);
                if (row.uuid_role_instance_to) roleUuids.push(row.uuid_role_instance_to);
            }

            const [attributes, roles] = await Promise.all([
                Instance_attribute_connection.getAllByParentUuids(
                    client,
                    returnRelClasses.map((relClass) => relClass.get_uuid()),
                    "relationclass"
                ),
                Instance_role_connection.getByUuids(client, roleUuids),
            ]);

            res_relclasses.rows.forEach((row, index) => {
                const relClass = returnRelClasses[index];
                relClass.set_attribute_instances(
                    attributes.get(relClass.get_uuid()) ?? []
                );

                const roleFrom = roles.get(row.uuid_role_instance_from);
                if (roleFrom instanceof RoleInstance) relClass.set_role_instance_from(roleFrom);

                const roleTo = roles.get(row.uuid_role_instance_to);
                if (roleTo instanceof RoleInstance) relClass.set_role_instance_to(roleTo);
            });

            return returnRelClasses;
        } catch (err) {
            throw new Error(
                `Error getting the relationclasses for the parent ${uuidParent}: ${err}`
            );
        }
    }

    /**
     * @description - This function create a new relationclass instance.
     * @param {PoolClient} client - The client to the database.
     * @param {RelationclassInstance} newRelationclass - The relationclass instance to create.
     * @param {UUID} userUuid - The uuid of the user that wants to create the relationclass instance.
     * @returns {Promise<RelationclassInstance | undefined>} - The relationclass instance created, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error creating the relationclass.
     * @memberof Instance_relationclass_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async create(
        client: PoolClient,
        newRelationclass: RelationclassInstance,
        userUuid?: UUID
    ): Promise<RelationclassInstance | undefined | BaseError> {
        try {

            const query_create_relationClass =
                "insert into relationclass_instance (uuid_class_instance, uuid_role_instance_from,uuid_role_instance_to) values ($1,$2,$3) returning uuid_class_instance ";

            newRelationclass.set_class_instance_uuid(
                newRelationclass.uuid_relationclass
            );
            const created_instanceObject = await Instance_class_connection.create(
                client,
                newRelationclass,
                userUuid
            );

            if (created_instanceObject instanceof BaseError) {
                if (created_instanceObject.httpCode === 403) {
                    return new HTTP403NORIGHT(`The user ${userUuid} has no right to create the relationclass`);
                }
                return created_instanceObject;
            }
            if (!created_instanceObject) return undefined;


            const addedRoleFrom = await Instance_role_connection.postRolesInstance(
                client,
                newRelationclass.get_role_instance_from(),
                userUuid
            );
            const addedRoleTo = await Instance_role_connection.postRolesInstance(
                client,
                newRelationclass.get_role_instance_to(),
                userUuid
            );
            if (Array.isArray(addedRoleFrom) && Array.isArray(addedRoleTo)) {
                await client.query(query_create_relationClass, [
                    created_instanceObject.get_uuid(),
                    newRelationclass.get_role_instance_from().get_uuid(),
                    newRelationclass.get_role_instance_to().get_uuid(),
                ]);
                // otherwise the role can't be created with reference with not already created relationclass
                await Instance_role_connection.update(
                    client,
                    newRelationclass.get_role_instance_from().get_uuid(),
                    newRelationclass.get_role_instance_from()
                );
                await Instance_role_connection.update(
                    client,
                    newRelationclass.get_role_instance_to().get_uuid(),
                    newRelationclass.get_role_instance_to()
                );
            }


            await this.update(
                client,
                created_instanceObject.get_uuid(),
                newRelationclass
            );

            return await this.getByUuid(
                client,
                created_instanceObject.get_uuid(),
                userUuid
            );

        } catch (err) {
            throw new Error(`Error creating the relationclass: ${err}`);
        }
    }

    /**
     * @description - This function update a relationclass instance.
     * @param {PoolClient} client - The client to the database.
     * @param {RelationclassInstance} newRelClass - The relationclass instance to update.
     * @param {UUID} relclassUuidToUpdate - The uuid of the relationclass instance to update.
     * @param {UUID} userUuid - The uuid of the user that wants to update the relationclass instance.
     * @returns {Promise<RelationclassInstance | undefined>} - The relationclass instance updated, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error updating the relationclass.
     * @memberof Instance_relationclass_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async update(
        client: PoolClient,
        relclassUuidToUpdate: UUID,
        newRelClass: RelationclassInstance,
        userUuid?: UUID
    ): Promise<RelationclassInstance | undefined | BaseError> {
        const query_update_relationclass =
            "update relationclass_instance set uuid_role_instance_from=coalesce($2,uuid_role_instance_from),uuid_role_instance_to=coalesce($3,uuid_role_instance_to), line_points=coalesce($4,line_points) where uuid_class_instance = $1 ";

        try {
            const updated_obj = await Instance_class_connection.update(
                client,
                relclassUuidToUpdate,
                newRelClass,
                userUuid
            );

            if (updated_obj instanceof BaseError) {
                if (updated_obj.httpCode === 403) {
                    return new HTTP403NORIGHT(`The user ${userUuid} has no right to update the relationclass instance ${relclassUuidToUpdate}`);
                }
                return updated_obj;
            }
            if (!updated_obj) return undefined;

            await client.query(query_update_relationclass, [
                relclassUuidToUpdate,
                newRelClass.get_role_instance_from().get_uuid(),
                newRelClass.get_role_instance_to().get_uuid(),
                newRelClass.get_line_points(),
            ]);
            return await this.getByUuid(client, relclassUuidToUpdate);
        } catch (err) {
            throw new Error(
                `Error updating the relationclass ${relclassUuidToUpdate}: ${err}`
            );
        }
    }

    /**
     * @description - This function create and link a relationclass instance to a parent.
     * @param {PoolClient} client - The client to the database.
     * @param {RelationclassInstance[] | RelationclassInstance} newRelClass - The relationclass instance or array of relationclass instances to create.
     * @param {UUID} uuidParent - The uuid of the parent to link the relationclass instance to.
     * @param {UUID} userUuid - The uuid of the user that wants to create the relationclass instance.
     * @returns {Promise<RelationclassInstance[] | undefined>} - The relationclass instance created, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error creating the relationclass instance.
     * @memberof Instance_relationclass_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async postRelationClassInstance(
        client: PoolClient,
        newRelClass: RelationclassInstance[] | RelationclassInstance,
        uuidParent?: UUID,
        userUuid?: UUID
    ): Promise<RelationclassInstance[] | undefined | BaseError> {
        try {
            // ON CONFLICT: the else-branch below runs precisely when the relation
            // already exists, and "already in this scene" is then the norm rather than
            // a fault. A plain insert raised 23505 on assigned_to_scene_pkey, which
            // left the whole PATCH answered with an opaque 500 — so a scene holding a
            // relation the server can no longer see could never be saved again.
            const query_connect_relclass_scenetype =
                "insert into assigned_to_scene (uuid_class_instance, uuid_scene_instance) values ($1,$2) on conflict do nothing ";
            const returnRelClass: Array<RelationclassInstance> = [];

            if (!Array.isArray(newRelClass)) newRelClass = [newRelClass];

            for (const relclassToAdd of newRelClass) {
                let currentRelClass = await this.create(client, relclassToAdd, userUuid);

                if (uuidParent) {
                    if (currentRelClass instanceof RelationclassInstance) {
                        await client.query(query_connect_relclass_scenetype, [
                            currentRelClass.get_uuid(),
                            uuidParent,
                        ]);
                    } else {
                        await client.query(query_connect_relclass_scenetype, [
                            relclassToAdd.get_uuid(),
                            uuidParent,
                        ]);
                        currentRelClass = await this.getByUuid(
                            client,
                            relclassToAdd.get_uuid()
                        );
                    }
                }
                if (currentRelClass instanceof RelationclassInstance) {
                    returnRelClass.push(currentRelClass);
                }
            }
            return returnRelClass;
        } catch (err) {
            throw new Error(`Error creating the relationclass: ${err}`);
        }
    }

    /**
     * @description - This function delete relationclass instances by uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} uuidToDelete - The uuid of the parent.
     * @param {UUID} userUuid - The uuid of the user that wants to delete the relationclass instance.
     * @returns {Promise<UUID[] | undefined>} - The array of uuid of all the objects deleted, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error deleting the relationclass instance.
     * @memberof Instance_relationclass_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    /**
     * @description - The class instances a relationclass instance uses as its
     * bendpoints.
     *
     * A bendpoint belongs to the relation that bends through it and has no meaning
     * without it, but nothing in the schema says so: line_points is a text[] of
     * JSON documents on relationclass_instance, and
     * class_instance.uuid_relationclass_bendpoint references the *meta* class
     * rather than the relationclass instance. The ownership therefore has to be
     * resolved here, and it has to be read before the relation is deleted, since
     * deleting it takes line_points with it.
     *
     * Only the INTERIOR line points are bendpoints, and only those the database
     * confirms are bendpoint class instances are returned — the two ends of the line
     * are the objects the relation connects and must outlive it.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} relationclassInstanceUuid - The relation to inspect.
     * @returns {Promise<UUID[]>} - The uuids of its bendpoint class instances.
     */
    private async getBendpointUuids(
        client: PoolClient,
        relationclassInstanceUuid: UUID
    ): Promise<UUID[]> {
        const res = await client.query(
            "SELECT line_points FROM relationclass_instance WHERE uuid_class_instance = $1",
            [relationclassInstanceUuid]
        );
        const points: string[] = res.rows[0]?.line_points ?? [];

        // line_points is [from, ...bendpoints, to]: the FIRST and LAST entries name the
        // objects the relation connects, not bendpoints. Reading the whole array made
        // this method answer with the relation's two endpoints, and deleteByUuid then
        // deleted them — so removing one Arc took the Place and the Transition it ran
        // between with it, and the arcs hanging off those cascaded down to rows the
        // scene query can no longer see.
        const interior = points.slice(1, -1);

        const uuids: UUID[] = [];
        for (const point of interior) {
            try {
                const parsed = typeof point === "string" ? JSON.parse(point) : point;
                const uuid = parsed?.UUID ?? parsed?.uuid;
                if (typeof uuid === "string") uuids.push(uuid);
            } catch {
                // A line point that is not a JSON document names no bendpoint.
            }
        }
        if (uuids.length === 0) return [];

        // Position alone is not proof. A class instance is only deleted here if the
        // database agrees it is a bendpoint, so a malformed or reordered line_points
        // can never cost the user a modelled object.
        const confirmed = await client.query(
            `SELECT uuid_instance_object
             FROM class_instance
             WHERE uuid_instance_object = ANY ($1::uuid[])
               AND uuid_relationclass_bendpoint IS NOT NULL`,
            [uuids]
        );
        return confirmed.rows.map((row) => row.uuid_instance_object as UUID);
    }

    async deleteByUuid(
        client: PoolClient,
        uuidToDelete: UUID,
        userUuid?: UUID
    ): Promise<UUID[] | undefined | BaseError> {
        try {
            // Read the bendpoints first: they are named by the row about to go.
            const bendpointUuids = await this.getBendpointUuids(client, uuidToDelete);

            const deleted = await Instance_objects_connection.deleteByUuid(
                client,
                uuidToDelete,
                userUuid
            );
            if (!Array.isArray(deleted)) return deleted;

            // A bendpoint outlives its relation otherwise, leaving a class instance
            // in the scene that nothing references and no client can reach.
            const removed = new Set<UUID>(deleted);
            for (const bendpointUuid of bendpointUuids) {
                if (removed.has(bendpointUuid)) continue;
                const cascaded = await Instance_objects_connection.deleteByUuid(
                    client,
                    bendpointUuid,
                    userUuid
                );
                if (Array.isArray(cascaded)) {
                    for (const uuid of cascaded) removed.add(uuid);
                }
            }
            return [...removed];
        } catch (err) {
            throw new Error(`Error deleting relationclass ${uuidToDelete}: ${err}`);
        }
    }

    /**
     * @description - This function delete relationclass instances by the parent's uuid.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} parentUuid - The uuid of the parent.
     * @param {UUID} userUuid - The uuid of the user that wants to delete the relationclass instance.
     * @returns {Promise<UUID[] | undefined>} - The array of uuid of all the objects deleted, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error deleting the relationclass instance.
     * @memberof Instance_relationclass_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async deleteAllByParentUuid(
        client: PoolClient,
        parentUuid: UUID,
        userUuid?: UUID
    ): Promise<UUID[] | undefined | BaseError> {
        try {
            const relationclassInstances = await this.getAllByParentUuid(client, parentUuid, userUuid);
            if (relationclassInstances instanceof BaseError) return relationclassInstances;

            // Deleted one at a time through deleteByUuid rather than as a
            // collection, so that each relation takes its bendpoints with it.
            const removed = new Set<UUID>();
            for (const relationclassInstance of relationclassInstances) {
                const deleted = await this.deleteByUuid(
                    client,
                    relationclassInstance.get_uuid(),
                    userUuid
                );
                if (deleted instanceof BaseError) return deleted;
                if (Array.isArray(deleted)) {
                    for (const uuid of deleted) removed.add(uuid);
                }
            }
            return [...removed];
        } catch (err) {
            throw new Error(
                `Error deleting the relationclass for the parent ${parentUuid}: ${err}`
            );
        }
    }

    /**
     * @description - This function return relationclass instances given a role from or a role to.
     * @param {PoolClient} client - The client to the database.
     * @param {UUID} roleUuidToTest - The uuid of the role to check.
     * @param {UUID} userUuid - The uuid of the user that wants to get the relationclass instance.
     * @returns {Promise<RelationclassInstance | undefined>} - The relationclass instances, undefined otherwise.
     * @throws {Error} - This function throws an error if there is an error getting the relationclass instance.
     * @memberof Instance_relationclass_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export
     * @method
     */
    async getRelationclassIfRoleFromOrTo(
        client: PoolClient,
        roleUuidToTest: UUID,
        userUuid?: UUID
    ): Promise<RelationclassInstance | undefined | BaseError> {
        try {

            const query_get_relationclass_if_role_from_or_to =
                "select * from relationclass_instance where uuid_role_instance_from = $1 or uuid_role_instance_to = $1 ";

            const result = await client.query(
                query_get_relationclass_if_role_from_or_to,
                [roleUuidToTest]
            );
            if (result.rows.length > 0) {
                return this.getByUuid(
                    client,
                    result.rows[0].uuid_class_instance,
                    userUuid
                );
            }
            return undefined;

        } catch (err) {
            throw new Error(
                `Error getting the relationclass related to the role ${roleUuidToTest}: ${err}`
            );
        }
    }
}

export default new Instance_relationclassesConnection();
