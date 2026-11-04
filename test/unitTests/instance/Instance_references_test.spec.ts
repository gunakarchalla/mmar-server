import chai from "chai";
import chaiHttp from "chai-http";
import "mocha";
import {PoolClient} from "pg";
import {v4 as uuidv4} from "uuid";
import {TestEnvironmentSetup} from "../TestEnvironmentSetup";

process.env.NODE_ENV = "test";
chai.use(chaiHttp);
const expect = chai.expect;
const API_URL = "http://localhost:8000";
const TIMEOUT = 30000;

interface StoredAttribute {
    uuid: string;
    value: string;
    table_row: number;
    role_instance_from: object | null;
    table_attributes: StoredAttribute[];
}

interface StoredScene {
    uuid: string;
    attribute_instances: StoredAttribute[];
}

/**
 * What happens to a reference when the object it points at is deleted, whichever scene
 * either of them is in: the reference is cleared, a table cell keeps its row, and a copy
 * of the scene read before the delete can still be saved without bringing it back.
 */
describe("Instance references to deleted objects", function () {
    const server = chai.request(API_URL);
    const setup = TestEnvironmentSetup.getInstance(API_URL);

    this.timeout(TIMEOUT);
    let token: string;
    let client: PoolClient;

    const uuids = {
        sceneTypeUuid: uuidv4(),
        classUuid: uuidv4(),
        roleUuid: uuidv4(),
        plainAttributeUuid: uuidv4(),
        plainTypeUuid: uuidv4(),
        listAttributeUuid: uuidv4(),
        listTypeUuid: uuidv4(),
        listColumnUuid: uuidv4(),
        listColumnTypeUuid: uuidv4(),
        wideAttributeUuid: uuidv4(),
        wideTypeUuid: uuidv4(),
        wideReferenceColumnUuid: uuidv4(),
        wideReferenceColumnTypeUuid: uuidv4(),
        wideNoteColumnUuid: uuidv4(),
        wideNoteColumnTypeUuid: uuidv4(),
        targetSceneUuid: uuidv4(),
        firstTargetUuid: uuidv4(),
        secondTargetUuid: uuidv4(),
        thirdTargetUuid: uuidv4(),
        referencingSceneUuid: uuidv4(),
        plainInstanceUuid: uuidv4(),
        listInstanceUuid: uuidv4(),
        wideInstanceUuid: uuidv4(),
        wideNoteCellUuid: uuidv4(),
        wideReferenceCellUuid: uuidv4(),
    };
    /** The cells of the one-column table: `listCell[row]`. */
    const listCell = [uuidv4(), uuidv4(), uuidv4()];

    const columnType = (uuid: string, name: string) => ({
        uuid,
        name,
        pre_defined: false,
        default_value: "",
        regex_value: "",
    });

    const roleTo = (target: string) => ({
        uuid: uuidv4(),
        name: "a reference",
        uuid_role: uuids.roleUuid,
        uuid_has_reference_class_instance: target,
    });

    const scene = async (uuid: string) => {
        const res = await server
            .get(`/instances/sceneInstances/${uuid}`)
            .set("accept", "application/json")
            .set("Cookie", "authcookie=" + token);
        expect(res.status).to.equal(200);
        return res.body;
    };

    const saveScene = async (body: {uuid: string}) =>
        await server
            .patch(`/instances/sceneInstances/${body.uuid}`)
            .set("content-type", "application/json")
            .set("accept", "application/json")
            .set("Cookie", "authcookie=" + token)
            .send(body);

    const attribute = (body: StoredScene, uuid: string) =>
        body.attribute_instances.find((candidate) => candidate.uuid === uuid) as StoredAttribute;

    /** The one-column table as [row, value, whether the cell still holds a role instance]. */
    const rowsOfList = (body: StoredScene) =>
        attribute(body, uuids.listInstanceUuid).table_attributes
            .map((cell) => [cell.table_row, cell.value, Boolean(cell.role_instance_from)]);

    let copyReadBeforeTheDelete: StoredScene;

    before(async () => {
        ({client, token} = await setup.setupTestEnvironment());

        const sceneType = await server
            .post("/metamodel/sceneTypes")
            .set("content-type", "application/json")
            .set("accept", "application/json")
            .set("Cookie", "authcookie=" + token)
            .send({
                uuid: uuids.sceneTypeUuid,
                name: "References test",
                classes: [
                    {uuid: uuids.classUuid, name: "target", is_reusable: false, is_abstract: false, geometry: ""},
                ],
                attributes: [
                    {
                        uuid: uuids.plainAttributeUuid,
                        name: "plain",
                        attribute_type: columnType(uuids.plainTypeUuid, "references_test_plain"),
                    },
                    {
                        uuid: uuids.listAttributeUuid,
                        name: "list",
                        attribute_type: {
                            uuid: uuids.listTypeUuid,
                            name: "references_test_list",
                            has_table_attribute: [{
                                sequence: 1,
                                attribute: {
                                    uuid: uuids.listColumnUuid,
                                    name: "reference",
                                    attribute_type: columnType(uuids.listColumnTypeUuid, "references_test_list_column"),
                                },
                            }],
                        },
                    },
                    {
                        uuid: uuids.wideAttributeUuid,
                        name: "wide",
                        attribute_type: {
                            uuid: uuids.wideTypeUuid,
                            name: "references_test_wide",
                            has_table_attribute: [
                                {
                                    sequence: 1,
                                    attribute: {
                                        uuid: uuids.wideReferenceColumnUuid,
                                        name: "reference",
                                        attribute_type: columnType(uuids.wideReferenceColumnTypeUuid, "references_test_wide_reference"),
                                    },
                                },
                                {
                                    sequence: 2,
                                    attribute: {
                                        uuid: uuids.wideNoteColumnUuid,
                                        name: "note",
                                        attribute_type: columnType(uuids.wideNoteColumnTypeUuid, "references_test_wide_note"),
                                    },
                                },
                            ],
                        },
                    },
                ],
            });
        expect(sceneType.status).to.equal(201);

        const role = await server
            .post(`/metamodel/sceneTypes/${uuids.sceneTypeUuid}/roles`)
            .set("content-type", "application/json")
            .set("accept", "application/json")
            .set("Cookie", "authcookie=" + token)
            .send([{
                uuid: uuids.roleUuid,
                name: "reference role",
                scenetype_references: [{uuid: uuids.sceneTypeUuid, min: 1, max: 1}],
            }]);
        expect(role.status).to.equal(201);

        const targetScene = await saveScene({
            uuid: uuids.targetSceneUuid,
            uuid_scene_type: uuids.sceneTypeUuid,
            name: "Target scene",
            class_instances: [uuids.firstTargetUuid, uuids.secondTargetUuid, uuids.thirdTargetUuid]
                .map((uuid) => ({uuid, uuid_class: uuids.classUuid, name: "target"})),
        } as {uuid: string});
        expect(targetScene.status).to.equal(200);

        const referencingScene = await saveScene({
            uuid: uuids.referencingSceneUuid,
            uuid_scene_type: uuids.sceneTypeUuid,
            name: "Referencing scene",
            attribute_instances: [
                {
                    uuid: uuids.plainInstanceUuid,
                    uuid_attribute: uuids.plainAttributeUuid,
                    value: "first",
                    role_instance_from: roleTo(uuids.firstTargetUuid),
                },
                {
                    uuid: uuids.listInstanceUuid,
                    uuid_attribute: uuids.listAttributeUuid,
                    value: "",
                    table_attributes: [uuids.firstTargetUuid, uuids.secondTargetUuid, uuids.thirdTargetUuid]
                        .map((target, row) => ({
                            uuid: listCell[row],
                            uuid_attribute: uuids.listColumnUuid,
                            table_attribute_reference: uuids.listInstanceUuid,
                            table_row: row,
                            value: `target ${row}`,
                            role_instance_from: roleTo(target),
                        })),
                },
                {
                    uuid: uuids.wideInstanceUuid,
                    uuid_attribute: uuids.wideAttributeUuid,
                    value: "",
                    table_attributes: [
                        {
                            uuid: uuids.wideReferenceCellUuid,
                            uuid_attribute: uuids.wideReferenceColumnUuid,
                            table_attribute_reference: uuids.wideInstanceUuid,
                            table_row: 0,
                            value: "first",
                            role_instance_from: roleTo(uuids.firstTargetUuid),
                        },
                        {
                            uuid: uuids.wideNoteCellUuid,
                            uuid_attribute: uuids.wideNoteColumnUuid,
                            table_attribute_reference: uuids.wideInstanceUuid,
                            table_row: 0,
                            value: "a note",
                        },
                    ],
                },
            ],
        } as {uuid: string});
        expect(referencingScene.status).to.equal(200);

        copyReadBeforeTheDelete = await scene(uuids.referencingSceneUuid);
        expect(rowsOfList(copyReadBeforeTheDelete)).to.deep.equal([
            [0, "target 0", true],
            [1, "target 1", true],
            [2, "target 2", true],
        ]);
    });

    after(async () => {
        await setup.tearDown(client, [...Object.values(uuids), ...listCell]);
    });

    describe("when a class instance is deleted", function () {
        before(async () => {
            const res = await server
                .delete(`/instances/classesInstances/${uuids.firstTargetUuid}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);
            expect(res.status).to.equal(200);
        });

        it("clears a table cell that referenced it, and keeps its row", async () => {
            expect(rowsOfList(await scene(uuids.referencingSceneUuid))).to.deep.equal([
                [0, "", false],
                [1, "target 1", true],
                [2, "target 2", true],
            ]);
        });

        it("clears the reference and leaves the rest of its row", async () => {
            const {table_attributes: cells} = attribute(await scene(uuids.referencingSceneUuid), uuids.wideInstanceUuid);
            const reference = cells.find((cell) => cell.uuid === uuids.wideReferenceCellUuid);
            const note = cells.find((cell) => cell.uuid === uuids.wideNoteCellUuid);

            expect(reference?.value).to.equal("");
            expect(reference?.role_instance_from).to.not.exist;
            expect(note?.value).to.equal("a note");
        });

        it("clears a reference outside a table", async () => {
            const plain = attribute(await scene(uuids.referencingSceneUuid), uuids.plainInstanceUuid);

            expect(plain.value).to.equal("");
            expect(plain.role_instance_from).to.not.exist;
        });

        it("saves a copy read before the delete, without bringing the reference back", async () => {
            const res = await saveScene(copyReadBeforeTheDelete);
            expect(res.status).to.equal(200);

            expect(rowsOfList(res.body)).to.deep.equal([
                [0, "", false],
                [1, "target 1", true],
                [2, "target 2", true],
            ]);
            expect(attribute(res.body, uuids.plainInstanceUuid).value).to.equal("");

            const stored = await client.query(
                "SELECT value, role_instance_from FROM attribute_instance WHERE uuid_instance_object = $1",
                [listCell[0]]
            );
            expect(stored.rows).to.deep.equal([{value: "", role_instance_from: null}]);
        });

        it("leaves the wide table as it was after that save", async () => {
            const {table_attributes: cells} = attribute(await scene(uuids.referencingSceneUuid), uuids.wideInstanceUuid);

            expect(cells.map((cell) => [cell.table_row, cell.value])).to.deep.equal([[0, ""], [0, "a note"]]);
        });
    });

    describe("when the whole scene of the targets is deleted", function () {
        before(async () => {
            const res = await server
                .delete(`/instances/sceneInstances/${uuids.targetSceneUuid}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);
            expect(res.status).to.equal(200);
        });

        it("clears the references to everything in it, and keeps the rows", async () => {
            expect(rowsOfList(await scene(uuids.referencingSceneUuid))).to.deep.equal([
                [0, "", false],
                [1, "", false],
                [2, "", false],
            ]);
        });

        it("still saves a copy read before the delete", async () => {
            const res = await saveScene(copyReadBeforeTheDelete);

            expect(res.status).to.equal(200);
            expect(rowsOfList(res.body)).to.deep.equal([
                [0, "", false],
                [1, "", false],
                [2, "", false],
            ]);
        });
    });
});
