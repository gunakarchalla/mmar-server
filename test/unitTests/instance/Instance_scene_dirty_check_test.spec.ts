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
const TIMEOUT = 60000;
const server = chai.request(API_URL);

/**
 * @description - The clients autosave the whole scene, and the server used to
 * write the whole of what they sent: get_collection_difference reported every
 * object present on both sides as modified, without comparing a field. These
 * tests hold the two halves of the fix together — that an untouched object is no
 * longer written, and that an edit nested inside an untouched object still is.
 * The second is the trap: the update() of a class instance walks into its
 * attributes and ports, so a parent skipped on its own columns alone would drop
 * its children's edits.
 */
describe("Instance sceneInstance dirty checking", function () {
    this.timeout(TIMEOUT);
    const setup = TestEnvironmentSetup.getInstance(API_URL);

    let token: string;
    let client: PoolClient;

    const NODES = 6;
    const ATTRS = 2;

    const uuids = {
        sceneTypeUuid: uuidv4(),
        sceneInstanceUuid: uuidv4(),
        classUuid: uuidv4(),
        portUuid: uuidv4(),
        attributeUuids: Array.from({length: ATTRS}, () => uuidv4()),
        attributeTypeUuids: Array.from({length: ATTRS}, () => uuidv4()),
        classInstanceUuids: Array.from({length: NODES}, () => uuidv4()),
        attributeInstanceUuids: Array.from({length: NODES}, () =>
            Array.from({length: ATTRS}, () => uuidv4())
        ),
        portInstanceUuid: uuidv4(),
        portAttributeInstanceUuid: uuidv4(),
    };

    /**
     * @description - The body a client autosaves: the whole scene, every time.
     * @returns {object} - The scene instance as the client would send it.
     */
    function whole_scene(): Record<string, unknown> {
        return {
            uuid: uuids.sceneInstanceUuid,
            uuid_scene_type: uuids.sceneTypeUuid,
            name: "dirty check scene",
            class_instances: uuids.classInstanceUuids.map((classInstanceUuid, n) => ({
                uuid: classInstanceUuid,
                uuid_class: uuids.classUuid,
                name: `node ${n}`,
                geometry: "",
                coordinates_2d: {x: n, y: n, z: 0},
                attribute_instance: uuids.attributeInstanceUuids[n].map((attrUuid, a) => ({
                    uuid: attrUuid,
                    uuid_attribute: uuids.attributeUuids[a],
                    assigned_uuid_class_instance: classInstanceUuid,
                    value: `node ${n} attr ${a}`,
                })),
                port_instance:
                    n !== 0
                        ? []
                        : [
                            {
                                uuid: uuids.portInstanceUuid,
                                uuid_port: uuids.portUuid,
                                uuid_class_instance: classInstanceUuid,
                                name: "the port",
                                geometry: "",
                                attribute_instances: [
                                    {
                                        uuid: uuids.portAttributeInstanceUuid,
                                        uuid_attribute: uuids.attributeUuids[0],
                                        assigned_uuid_port_instance: uuids.portInstanceUuid,
                                        value: "port attr",
                                    },
                                ],
                            },
                        ],
            })),
        };
    }

    const patch = async (body: Record<string, unknown>) =>
        server
            .patch(`/instances/sceneInstances/${uuids.sceneInstanceUuid}`)
            .set("content-type", "application/json")
            .set("accept", "application/json")
            .set("Cookie", "authcookie=" + token)
            .send(body);

    const read = async () =>
        (
            await server
                .get(`/instances/sceneInstances/${uuids.sceneInstanceUuid}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
        ).body;

    /**
     * @description - The id of the last audit row, so that what a request went on
     * to write can be read back.
     *
     * Every UPDATE fires a trigger that inserts one row into logging.t_history
     * naming the table it wrote. That is the measure this phase is about — not how
     * many queries ran, but how many objects were rewritten — and unlike
     * pg_stat_user_tables it is committed with the request instead of being
     * flushed some time afterwards, which attributed a slow request's writes to
     * the next measurement.
     * @returns {Promise<number>} - The current maximum history id.
     */
    async function history_mark(): Promise<number> {
        const res = await client.query(
            "SELECT coalesce(max(id), 0) AS id FROM logging.t_history"
        );
        return Number(res.rows[0].id);
    }

    /**
     * @description - How many instance_object rows were rewritten since the mark.
     * @param {number} mark - A value from history_mark taken before the request.
     * @returns {Promise<number>} - The number of objects written.
     */
    async function objects_written(mark: number): Promise<number> {
        const res = await client.query(
            `SELECT count(*)::int AS rows FROM logging.t_history
              WHERE id > $1 AND operation = 'UPDATE' AND tabname = 'instance_object'`,
            [mark]
        );
        return Number(res.rows[0].rows);
    }

    const node_of = (scene: Record<string, never>, n: number) =>
        (scene.class_instances as Record<string, never>[]).find(
            (c) => (c.uuid as unknown as string) === uuids.classInstanceUuids[n]
        ) as Record<string, never>;

    before(async () => {
        ({client, token} = await setup.setupTestEnvironment());

        await server
            .post("/metamodel/sceneTypes")
            .set("content-type", "application/json")
            .set("accept", "application/json")
            .set("Cookie", "authcookie=" + token)
            .send({
                uuid: uuids.sceneTypeUuid,
                name: "Dirty check scene type",
                classes: [
                    {
                        uuid: uuids.classUuid,
                        name: "Node",
                        is_reusable: true,
                        is_abstract: false,
                        geometry: "",
                        attributes: uuids.attributeUuids.map((attrUuid, a) => ({
                            uuid: attrUuid,
                            name: `attr_${a}`,
                            attribute_type: {
                                uuid: uuids.attributeTypeUuids[a],
                                name: `String ${a}`,
                                pre_defined: true,
                                default_value: "",
                            },
                        })),
                        ports: [
                            {
                                uuid: uuids.portUuid,
                                name: "Node port",
                                uuid_class: uuids.classUuid,
                                geometry: "",
                            },
                        ],
                    },
                ],
            });

        const created = await server
            .post(`/instances/sceneTypes/${uuids.sceneTypeUuid}/sceneInstances`)
            .set("content-type", "application/json")
            .set("accept", "application/json")
            .set("Cookie", "authcookie=" + token)
            .send(whole_scene());
        expect(created.status).to.equal(201);
    });

    after(async function () {
        await setup.tearDown(client, [
            ...uuids.classInstanceUuids,
            ...uuids.attributeInstanceUuids.flat(),
            uuids.portInstanceUuid,
            uuids.portAttributeInstanceUuid,
            uuids.sceneInstanceUuid,
            uuids.sceneTypeUuid,
            uuids.classUuid,
            uuids.portUuid,
            ...uuids.attributeUuids,
            ...uuids.attributeTypeUuids,
        ]);
    });

    it("writes only the scene itself when the client re-sends a scene it has not changed", async () => {
        const mark = await history_mark();
        const res = await patch(whole_scene());
        expect(res.status).to.equal(200);

        // The one row is the scene instance: Instance_scenes.update writes it
        // before it diffs anything, so an idle autosave still costs one object.
        // Everything below it is now left alone; it used to be all of them.
        expect(
            await objects_written(mark),
            "an idle autosave must not rewrite the objects of the scene"
        ).to.equal(1);
    });

    it("writes one object, plus the scene, when one object moved", async () => {
        const body = whole_scene();
        (body.class_instances as Record<string, unknown>[])[2].name = "node 2 moved";

        const mark = await history_mark();
        const res = await patch(body);
        expect(res.status).to.equal(200);

        expect(
            await objects_written(mark),
            "only the moved object and the scene should be rewritten"
        ).to.equal(2);
        expect(node_of(await read(), 2).name as unknown as string).to.equal("node 2 moved");
    });

    it("still writes an attribute edited inside an otherwise unchanged class instance", async () => {
        const body = whole_scene();
        const node = (body.class_instances as Record<string, unknown>[])[3];
        (node.attribute_instance as Record<string, unknown>[])[1].value = "edited attribute";

        const res = await patch(body);
        expect(res.status).to.equal(200);

        const stored = node_of(await read(), 3);
        const attribute = (stored.attribute_instance as Record<string, never>[]).find(
            (a) => (a.uuid as unknown as string) === uuids.attributeInstanceUuids[3][1]
        );
        expect(attribute?.value as unknown as string).to.equal("edited attribute");
    });

    it("still writes an attribute edited two levels down, inside an unchanged port", async () => {
        const body = whole_scene();
        const node = (body.class_instances as Record<string, unknown>[])[0];
        const port = (node.port_instance as Record<string, unknown>[])[0];
        (port.attribute_instances as Record<string, unknown>[])[0].value = "edited port attribute";

        const res = await patch(body);
        expect(res.status).to.equal(200);

        const stored = node_of(await read(), 0);
        const stored_port = (stored.port_instance as Record<string, never>[])[0];
        const attribute = (stored_port.attribute_instances as Record<string, never>[])[0];
        expect(attribute.value as unknown as string).to.equal("edited port attribute");
    });

    it("still creates an object the client has added to the scene", async () => {
        uuids.classInstanceUuids.push(uuidv4());
        uuids.attributeInstanceUuids.push(
            Array.from({length: ATTRS}, () => uuidv4())
        );
        const body = whole_scene();

        const res = await patch(body);
        expect(res.status).to.equal(200);
        expect(node_of(await read(), NODES)).to.exist;
    });
});
