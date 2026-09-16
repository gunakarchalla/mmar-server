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

/**
 * The table rules of mmar-global-data-structure (Instance_tables), end to end: cells
 * are read back in table order, writing a table replaces its cells, a table that breaks
 * the rules is refused, and removing a column removes its cells.
 */
describe("Instance table attributes", function () {
    const server = chai.request(API_URL);
    const setup = TestEnvironmentSetup.getInstance(API_URL);

    this.timeout(TIMEOUT);
    let token: string;
    let client: PoolClient;

    const uuids = {
        sceneTypeUuid: uuidv4(),
        sceneInstanceUuid: uuidv4(),
        stringAttributeUuid: uuidv4(),
        stringTypeUuid: uuidv4(),
        tableAttributeUuid: uuidv4(),
        tableTypeUuid: uuidv4(),
        nameColumnUuid: uuidv4(),
        nameColumnTypeUuid: uuidv4(),
        valueColumnUuid: uuidv4(),
        valueColumnTypeUuid: uuidv4(),
        detailsColumnUuid: uuidv4(),
        detailsTypeUuid: uuidv4(),
        noteColumnUuid: uuidv4(),
        noteColumnTypeUuid: uuidv4(),
        stringInstanceUuid: uuidv4(),
        tableInstanceUuid: uuidv4(),
    };
    /** Cell uuids by position: `cell[row][column]`, columns being name, value, details. */
    const cell = [0, 1, 2].map(() => [uuidv4(), uuidv4(), uuidv4()]);
    /** The note cell of the nested table in each row's details cell. */
    const note = [uuidv4(), uuidv4(), uuidv4()];

    const columnType = (uuid: string, name: string) => ({
        uuid,
        name,
        pre_defined: false,
        default_value: "",
        regex_value: "",
    });

    const columns = (withValue = true) => [
        {
            sequence: 1,
            attribute: {uuid: uuids.nameColumnUuid, name: "name", attribute_type: columnType(uuids.nameColumnTypeUuid, "table_test_name")},
        },
        ...(withValue
            ? [{
                sequence: 2,
                attribute: {uuid: uuids.valueColumnUuid, name: "value", attribute_type: columnType(uuids.valueColumnTypeUuid, "table_test_value")},
            }]
            : []),
        {
            sequence: withValue ? 3 : 2,
            ui_component: "button",
            attribute: {
                uuid: uuids.detailsColumnUuid,
                name: "details",
                attribute_type: {
                    uuid: uuids.detailsTypeUuid,
                    name: "table_test_details",
                    has_table_attribute: [{
                        sequence: 1,
                        attribute: {uuid: uuids.noteColumnUuid, name: "note", attribute_type: columnType(uuids.noteColumnTypeUuid, "table_test_note")},
                    }],
                },
            },
        },
    ];

    /** One cell as the client sends it. */
    const cellJson = (uuid: string, column: string, row: number, value: string, extra: object = {}) => ({
        uuid,
        uuid_attribute: column,
        table_attribute_reference: uuids.tableInstanceUuid,
        table_row: row,
        value,
        ...extra,
    });

    /** A full row: name and value cells, and a details cell holding a one-row nested table. */
    const rowJson = (index: number, row: number) => [
        cellJson(cell[index][0], uuids.nameColumnUuid, row, `name ${index}`),
        cellJson(cell[index][1], uuids.valueColumnUuid, row, `value ${index}`),
        cellJson(cell[index][2], uuids.detailsColumnUuid, row, "", {
            table_attributes: [{
                uuid: note[index],
                uuid_attribute: uuids.noteColumnUuid,
                table_attribute_reference: cell[index][2],
                table_row: 0,
                value: `note ${index}`,
            }],
        }),
    ];

    const tableJson = (cells: object[]) => ({
        uuid: uuids.tableInstanceUuid,
        uuid_attribute: uuids.tableAttributeUuid,
        assigned_uuid_scene_instance: uuids.sceneInstanceUuid,
        value: "",
        table_attributes: cells,
    });

    const getTable = async () =>
        await server
            .get(`/instances/attributesInstances/${uuids.tableInstanceUuid}`)
            .set("accept", "application/json")
            .set("Cookie", "authcookie=" + token);

    const patchTable = async (cells: object[]) =>
        await server
            .patch(`/instances/attributesInstances/${uuids.tableInstanceUuid}`)
            .set("content-type", "application/json")
            .set("accept", "application/json")
            .set("Cookie", "authcookie=" + token)
            .send(tableJson(cells));

    /** The stored table as [row, value] pairs of its name cells, in the order returned. */
    const names = (table: { table_attributes: { uuid_attribute: string; table_row: number; value: string }[] }) =>
        table.table_attributes
            .filter((c) => c.uuid_attribute === uuids.nameColumnUuid)
            .map((c) => [c.table_row, c.value]);

    before(async () => {
        ({client, token} = await setup.setupTestEnvironment());

        const sceneType = await server
            .post("/metamodel/sceneTypes")
            .set("content-type", "application/json")
            .set("accept", "application/json")
            .set("Cookie", "authcookie=" + token)
            .send({
                uuid: uuids.sceneTypeUuid,
                name: "Table rules test",
                attributes: [
                    {uuid: uuids.stringAttributeUuid, name: "plain", attribute_type: columnType(uuids.stringTypeUuid, "table_test_plain")},
                    {
                        uuid: uuids.tableAttributeUuid,
                        name: "table",
                        attribute_type: {uuid: uuids.tableTypeUuid, name: "table_test_table", has_table_attribute: columns()},
                    },
                ],
            });
        expect(sceneType.status).to.equal(201);

        const sceneInstance = await server
            .post(`/instances/sceneTypes/${uuids.sceneTypeUuid}/sceneInstances`)
            .set("content-type", "application/json")
            .set("accept", "application/json")
            .set("Cookie", "authcookie=" + token)
            .send({uuid: uuids.sceneInstanceUuid, uuid_scene_type: uuids.sceneTypeUuid, name: "Table rules test scene"});
        expect(sceneInstance.status).to.equal(201);
    });

    after(async () => {
        await setup.tearDown(client, [...Object.values(uuids), ...cell.flat(), ...note]);
    });

    it("stores a table posted out of order and reads it back by row, then by column", async function () {
        // Rows posted last to first, and the cells of each row in reverse column order.
        const shuffled = [...rowJson(2, 2), ...rowJson(1, 1), ...rowJson(0, 0)].reverse();
        const res = await server
            .post(`/instances/sceneInstances/${uuids.sceneInstanceUuid}/attributesInstances`)
            .set("content-type", "application/json")
            .set("accept", "application/json")
            .set("Cookie", "authcookie=" + token)
            .send([tableJson(shuffled)]);
        expect(res.status).to.equal(201);

        const table = (await getTable()).body;
        expect(table.table_attributes.map((c: { uuid: string }) => c.uuid)).to.deep.equal(cell.flat());
        expect(table.table_attributes[2].table_attributes.map((c: { uuid: string }) => c.uuid)).to.deep.equal([note[0]]);
    });

    it("refuses a table whose rows have a gap", async function () {
        const res = await patchTable([...rowJson(0, 0), ...rowJson(1, 2), ...rowJson(2, 3)]);
        expect(res.status).to.equal(403);
        expect(res.body.error).to.contain("row 1 is missing");
    });

    it("refuses two cells at the same row and column", async function () {
        const res = await patchTable([...rowJson(0, 0), ...rowJson(1, 1), ...rowJson(2, 1)]);
        expect(res.status).to.equal(403);
        expect(res.body.error).to.contain("more than one cell");
    });

    it("refuses a cell outside the columns of the table", async function () {
        const res = await patchTable([
            ...rowJson(0, 0), ...rowJson(1, 1), ...rowJson(2, 2),
            cellJson(uuidv4(), uuids.stringAttributeUuid, 0, "stray"),
        ]);
        expect(res.status).to.equal(403);
        expect(res.body.error).to.contain("not in a column of the table");
    });

    it("refuses a cell that names another table", async function () {
        const res = await patchTable([
            ...rowJson(0, 0), ...rowJson(1, 1),
            ...rowJson(2, 2).map((c, i) => (i === 0 ? {...c, table_attribute_reference: uuids.tableAttributeUuid} : c)),
        ]);
        expect(res.status).to.equal(403);
        expect(res.body.error).to.contain("belongs to another table");
    });

    it("refuses a nested table that breaks the rules", async function () {
        const res = await patchTable([
            ...rowJson(0, 0), ...rowJson(1, 1),
            ...rowJson(2, 2).map((c, i) => (i === 2 ? {...c, table_attributes: [{
                uuid: note[2], uuid_attribute: uuids.noteColumnUuid, table_attribute_reference: cell[2][2], table_row: 1, value: "note 2",
            }]} : c)),
        ]);
        expect(res.status).to.equal(403);
        expect(res.body.error).to.contain("row 0 is missing");
    });

    it("refuses cells on an attribute that is not a table", async function () {
        const res = await server
            .post(`/instances/sceneInstances/${uuids.sceneInstanceUuid}/attributesInstances`)
            .set("content-type", "application/json")
            .set("accept", "application/json")
            .set("Cookie", "authcookie=" + token)
            .send([{
                uuid: uuids.stringInstanceUuid,
                uuid_attribute: uuids.stringAttributeUuid,
                value: "plain",
                table_attributes: [{uuid: uuidv4(), uuid_attribute: uuids.nameColumnUuid, table_row: 0, value: "stray"}],
            }]);
        expect(res.status).to.equal(403);
        expect(res.body.error).to.contain("is not a table");
    });

    it("left the table untouched through every refused write", async function () {
        const table = (await getTable()).body;
        expect(table.table_attributes.map((c: { uuid: string }) => c.uuid)).to.deep.equal(cell.flat());
    });

    it("moves a row: the new order is stored", async function () {
        // Row 2 to the top.
        const res = await patchTable([...rowJson(2, 0), ...rowJson(0, 1), ...rowJson(1, 2)]);
        expect(res.status).to.equal(200);

        expect(names((await getTable()).body)).to.deep.equal([[0, "name 2"], [1, "name 0"], [2, "name 1"]]);
    });

    it("removes a row: its cells, and the nested table in them, are deleted", async function () {
        // "name 0" (now row 1) goes; "name 1" moves up from row 2.
        const res = await patchTable([...rowJson(2, 0), ...rowJson(1, 1)]);
        expect(res.status).to.equal(200);

        expect(names((await getTable()).body)).to.deep.equal([[0, "name 2"], [1, "name 1"]]);
        const leftovers = await client.query(
            "SELECT count(*)::int AS n FROM attribute_instance WHERE uuid_instance_object = ANY ($1::uuid[])",
            [[...cell[0], note[0]]]
        );
        expect(leftovers.rows[0].n).to.equal(0);
    });

    it("removes a row through a scene autosave, which only sends the changed scene", async function () {
        const res = await server
            .patch(`/instances/sceneInstances/${uuids.sceneInstanceUuid}`)
            .set("content-type", "application/json")
            .set("accept", "application/json")
            .set("Cookie", "authcookie=" + token)
            .send({
                uuid: uuids.sceneInstanceUuid,
                uuid_scene_type: uuids.sceneTypeUuid,
                name: "Table rules test scene",
                attribute_instances: [tableJson([...rowJson(1, 0)])],
            });
        expect(res.status).to.equal(200);

        expect(names((await getTable()).body)).to.deep.equal([[0, "name 1"]]);
    });

    it("removes a column's cells from every table when the column leaves the type", async function () {
        const res = await server
            .patch(`/metamodel/attributeTypes/${uuids.tableTypeUuid}?hardpatch=true`)
            .set("content-type", "application/json")
            .set("accept", "application/json")
            .set("Cookie", "authcookie=" + token)
            .send({uuid: uuids.tableTypeUuid, name: "table_test_table", has_table_attribute: columns(false)});
        expect(res.status).to.equal(200);

        const table = (await getTable()).body;
        expect(table.table_attributes.map((c: { uuid: string }) => c.uuid)).to.deep.equal([cell[1][0], cell[1][2]]);
    });
});
