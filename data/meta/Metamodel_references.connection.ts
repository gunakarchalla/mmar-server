import {PoolClient} from "pg";
import {queries} from "../..";
import {
    ClassReference,
    PortReference,
    RelationClassReference,
    SceneTypeReference,
    UUID,
} from "../../../mmar-global-data-structure";
import {BaseError} from "../services/middleware/error_handling/standard_errors.middleware";

/**
 * @description - This is the class that handles the meta references for the roles.
 * @class Metamodel_referencesConnection
 * @export - This class is exported so that it can be used by other classes.
 */
class Metamodel_referencesConnection {
    /**
     * @description - This function is used to get the class references for a role by its UUID.
     * @param {PoolClient} client - The client used to connect to the database.
     * @param {UUID} roleUUID - The UUID of the role.
     * @param {UUID} userUUID - The UUID of the user that is requesting the class references.
     * @returns {ClassReference[]} - The class references for the role.
     * @throws {Error} - This function throws an error if there is an error getting the classes.
     * @memberof Metamodel_references_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export - This function is exported so that it can be used by other classes.
     * @method
     * @todo - This function needs to be updated to include the userUUID.
     */
    async getClassReferences(
        client: PoolClient,
        roleUUID: UUID,
        userUUID?: UUID
    ): Promise<ClassReference[] | BaseError> {
        try {
            const role_class_ref_query = queries.getQuery_get("role_class_ref_query");
            const returnClassReferences = new Array<ClassReference>();

            const res_class_ref = await client.query(role_class_ref_query, [
                roleUUID,
            ]);
            for (const cr of res_class_ref.rows) {
                returnClassReferences.push(
                    new ClassReference(cr.uuid_class, cr.min, cr.max)
                );
            }
            return returnClassReferences;
        } catch (err) {
            throw new Error(
                `Error getting the classes for the role ${roleUUID}: ${err}`
            );
        }
    }

    /**
     * @description - This function is used to get the relationclass references for a role by its UUID.
     * @param {PoolClient} client - The client used to connect to the database.
     * @param {UUID} roleUUID - The UUID of the role.
     * @returns {RelationClassReference[]} - The relationclass references for the role.
     * @throws {Error} - This function throws an error if there is an error getting the relationclasses.
     * @memberof Metamodel_references_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export - This function is exported so that it can be used by other relationclasses.
     * @method
     * @todo - This function needs to be updated to include the userUUID.
     */
    async getRelationclassReferences(
        client: PoolClient,
        roleUUID: UUID,
        userUUID?: UUID
    ): Promise<RelationClassReference[] | BaseError> {
        try {
            const role_relclass_ref_query = queries.getQuery_get(
                "role_relclass_ref_query"
            );
            const returnRelationClassReferences = new Array<RelationClassReference>();

            const res_relclass_ref = await client.query(role_relclass_ref_query, [
                roleUUID,
            ]);
            for (const rr of res_relclass_ref.rows) {
                returnRelationClassReferences.push(
                    new RelationClassReference(rr.uuid_relationclass, rr.min, rr.max)
                );
            }
            return returnRelationClassReferences;
        } catch (err) {
            throw new Error(
                `Error getting the relation classes for the role ${roleUUID}: ${err}`
            );
        }
    }

    /**
     * @description - This function is used to get the sceneType references for a role by its UUID.
     * @param {PoolClient} client - The client used to connect to the database.
     * @param {UUID} roleUUID - The UUID of the role.
     * @returns {SceneTypeReference[]} - The sceneType references for the role.
     * @throws {Error} - This function throws an error if there is an error getting the sceneType.
     * @memberof Metamodel_references_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export - This function is exported so that it can be used by other sceneTypes.
     * @method
     * @todo - This function needs to be updated to include the userUUID.
     */
    async getSceneTypeReferences(
        client: PoolClient,
        roleUUID: UUID,
        userUUID?: UUID
    ): Promise<SceneTypeReference[] | BaseError> {
        const role_scenetype_ref_query =
            "SELECT * FROM role_scene_reference rs WHERE rs.uuid_role = $1 ";

        try {
            const returnSceneTypeReferences = new Array<SceneTypeReference>();
            const res_scenetype_ref = await client.query(role_scenetype_ref_query, [
                roleUUID,
            ]);

            for (const scr of res_scenetype_ref.rows) {
                returnSceneTypeReferences.push(
                    new SceneTypeReference(scr.uuid_scene_type, scr.min, scr.max)
                );
            }
            return returnSceneTypeReferences;
        } catch (err) {
            throw new Error(
                `Error getting the scene types for the role ${roleUUID}: ${err}`
            );
        }
    }

    /**
     * @description - This function is used to get the ports references for a role by its UUID.
     * @param {PoolClient} client - The client used to connect to the database.
     * @param {UUID} roleUUID - The UUID of the role.
     * @returns {PortReference[]} - The sceneType references for the role.
     * @throws {Error} - This function throws an error if there is an error getting the ports.
     * @memberof Metamodel_references_connection
     * @async - This function is asynchronous, it must be called with the await keyword in front of it to get the inside of the promise.
     * @export - This function is exported so that it can be used by other ports.
     * @method
     * @todo - This function needs to be updated to include the userUUID.
     */
    async getPortReferences(
        client: PoolClient,
        roleUUID: UUID,
        userUUID?: UUID
    ): Promise<PortReference[] | BaseError> {
        try {
            const role_port_ref_query =
                "SELECT * FROM role_port_reference rp WHERE rp.uuid_role = $1 ";
            const returnPortReferences = new Array<PortReference>();
            const res_port_ref = await client.query(role_port_ref_query, [roleUUID]);

            for (const pr of res_port_ref.rows) {
                returnPortReferences.push(
                    new PortReference(pr.uuid_port, pr.min, pr.max)
                );
            }
            return returnPortReferences;
        } catch (err) {
            throw new Error(
                `Error getting the ports for the role ${roleUUID}: ${err}`
            );
        }
    }

    async getAttributeReferences(
        client: PoolClient,
        roleUUID: UUID,
        userUUID?: UUID
    ): Promise<PortReference[] | BaseError> {
        try {
            const role_attribute_ref_query =
                "SELECT * FROM role_attribute_reference ra WHERE ra.uuid_role = $1 ";
            const returnAttributeReferences = new Array<PortReference>();
            const res_attribute_ref = await client.query(role_attribute_ref_query, [
                roleUUID,
            ]);

            for (const pr of res_attribute_ref.rows) {
                returnAttributeReferences.push(
                    new PortReference(pr.uuid_attribute, pr.min, pr.max)
                );
            }
            return returnAttributeReferences;
        } catch (err) {
            throw new Error(
                `Error getting the attributes for the role ${roleUUID}: ${err}`
            );
        }
    }
}

export default new Metamodel_referencesConnection();
