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
 * @description - The scene read used to fan out one query per relation, two more
 * for that relation's two ends, and two more for every port and every role of the
 * scene. Those are batched now, and the only thing that matters about a batched
 * read is that it still returns the same document.
 *
 * test/read_equivalence is the gate for that, but its fixture carries no ports or
 * roles hanging off the scene itself, so two of the three batched paths were
 * invisible to it. These cover them, and cover the relations by the strongest
 * comparison available: the batched read of the whole scene against the
 * single-object read of each relation, which is the code the batch replaced.
 */
describe("Instance sceneInstance batched read", function () {
    this.timeout(TIMEOUT);
    const setup = TestEnvironmentSetup.getInstance(API_URL);

    let token: string;
    let client: PoolClient;

    const NODES = 6;
    const RELATIONS = 3;
    const SCENE_PORTS = 2;

    const uuids = {
        sceneTypeUuid: uuidv4(),
        sceneInstanceUuid: uuidv4(),
        classUuid: uuidv4(),
        scenePortUuid: uuidv4(),
        sceneRoleUuid: uuidv4(),
        relationclassUuid: uuidv4(),
        roleFromUuid: uuidv4(),
        roleToUuid: uuidv4(),
        attributeUuid: uuidv4(),
        attributeTypeUuid: uuidv4(),
        classInstanceUuids: Array.from({length: NODES}, () => uuidv4()),
        relationInstanceUuids: Array.from({length: RELATIONS}, () => uuidv4()),
        roleInstanceFromUuids: Array.from({length: RELATIONS}, () => uuidv4()),
        roleInstanceToUuids: Array.from({length: RELATIONS}, () => uuidv4()),
        relationAttributeUuids: Array.from({length: RELATIONS}, () => uuidv4()),
        scenePortInstanceUuids: Array.from({length: SCENE_PORTS}, () => uuidv4()),
        scenePortAttributeUuids: Array.from({length: SCENE_PORTS}, () => uuidv4()),
        sceneRoleInstanceUuid: uuidv4(),
        classRoleInstanceUuid: uuidv4(),
    };

    const auth = <T extends {set: (k: string, v: string) => T}>(request: T): T =>
        request
            .set("content-type", "application/json")
            .set("accept", "application/json")
            .set("Cookie", "authcookie=" + token);

    const read_scene = async () =>
        (await auth(server.get(`/instances/sceneInstances/${uuids.sceneInstanceUuid}`)))
            .body as Record<string, never>;

    const relations_of = (scene: Record<string, never>) =>
        (scene.relationclasses_instances ?? []) as unknown as Record<string, never>[];

    before(async () => {
        ({client, token} = await setup.setupTestEnvironment());

        const meta = await auth(server.post("/metamodel/sceneTypes")).send({
            uuid: uuids.sceneTypeUuid,
            name: "Batched read scene type",
            classes: [
                {
                    uuid: uuids.classUuid,
                    name: "Node",
                    is_reusable: true,
                    is_abstract: false,
                    geometry: "",
                },
            ],
            relationclasses: [
                {
                    uuid: uuids.relationclassUuid,
                    name: "Edge",
                    is_reusable: true,
                    is_abstract: false,
                    attributes: [
                        {
                            uuid: uuids.attributeUuid,
                            name: "label",
                            attribute_type: {
                                uuid: uuids.attributeTypeUuid,
                                name: "String label",
                                pre_defined: true,
                                default_value: "",
                            },
                        },
                    ],
                    role_from: {
                        uuid: uuids.roleFromUuid,
                        name: "edge_from",
                        class_references: [{uuid: uuids.classUuid, min: 1, max: 1}],
                    },
                    role_to: {
                        uuid: uuids.roleToUuid,
                        name: "edge_to",
                        class_references: [{uuid: uuids.classUuid, min: 1, max: 1}],
                    },
                },
            ],
        });
        expect(meta.status, "seeding the metamodel").to.equal(201);

        // A port and a role that hang off the scene type itself rather than off a
        // class. These are the two shapes the read-equivalence fixture lacks.
        const metaPort = await auth(
            server.post(`/metamodel/ports/${uuids.scenePortUuid}`)
        ).send({
            uuid: uuids.scenePortUuid,
            name: "Scene port",
            uuid_scene_type: uuids.sceneTypeUuid,
            geometry: "",
        });
        expect(metaPort.status, "seeding the meta port").to.be.oneOf([200, 201]);

        const metaRole = await auth(
            server.post(`/metamodel/sceneTypes/${uuids.sceneTypeUuid}/roles`)
        ).send([
            {
                uuid: uuids.sceneRoleUuid,
                name: "scene role",
                scenetype_references: [{uuid: uuids.sceneTypeUuid, min: 1, max: 1}],
                class_references: [{uuid: uuids.classUuid, min: 1, max: 1}],
            },
        ]);
        expect(metaRole.status, "seeding the meta role").to.equal(201);

        const created = await auth(
            server.post(`/instances/sceneTypes/${uuids.sceneTypeUuid}/sceneInstances`)
        ).send({
            uuid: uuids.sceneInstanceUuid,
            uuid_scene_type: uuids.sceneTypeUuid,
            name: "batched read scene",
            class_instances: uuids.classInstanceUuids.map((classInstanceUuid, n) => ({
                uuid: classInstanceUuid,
                uuid_class: uuids.classUuid,
                name: `node ${n}`,
                geometry: "",
                coordinates_2d: {x: n, y: n, z: 0},
            })),
            relationclasses_instances: uuids.relationInstanceUuids.map((relationUuid, r) => ({
                uuid: relationUuid,
                uuid_class: uuids.relationclassUuid,
                uuid_relationclass: uuids.relationclassUuid,
                name: `edge ${r}`,
                geometry: "",
                // Bendpoints live only here, as a text[] of JSON strings.
                line_points: [
                    {x: r, y: r, z: 0},
                    {x: r + 1, y: r * 2, z: 0},
                ],
                attribute_instance: [
                    {
                        uuid: uuids.relationAttributeUuids[r],
                        uuid_attribute: uuids.attributeUuid,
                        assigned_uuid_class_instance: relationUuid,
                        value: `edge ${r} label`,
                    },
                ],
                uuid_role_instance_from: uuids.roleInstanceFromUuids[r],
                uuid_role_instance_to: uuids.roleInstanceToUuids[r],
                role_instance_from: {
                    uuid: uuids.roleInstanceFromUuids[r],
                    uuid_role: uuids.roleFromUuid,
                    uuid_relationclass: uuids.relationclassUuid,
                    uuid_has_reference_class_instance: uuids.classInstanceUuids[r],
                },
                role_instance_to: {
                    uuid: uuids.roleInstanceToUuids[r],
                    uuid_role: uuids.roleToUuid,
                    uuid_relationclass: uuids.relationclassUuid,
                    uuid_has_reference_class_instance:
                    uuids.classInstanceUuids[r + RELATIONS],
                },
            })),
        });
        expect(created.status, "seeding the scene instance").to.equal(201);

        const ports = await auth(
            server.post(
                `/instances/sceneInstances/${uuids.sceneInstanceUuid}/portsInstances`
            )
        ).send(
            uuids.scenePortInstanceUuids.map((portInstanceUuid, p) => ({
                uuid: portInstanceUuid,
                uuid_port: uuids.scenePortUuid,
                name: `scene port ${p}`,
                uuid_scene_instance: uuids.sceneInstanceUuid,
                geometry: "",
            }))
        );
        expect(ports.status, "seeding the scene ports").to.equal(201);

        // A role that references the scene, and one that references a class
        // instance: the two parents Instance_roles.getAllByParentUuid is asked for.
        const sceneRole = await auth(
            server.post(`/instances/rolesInstances/${uuids.sceneRoleInstanceUuid}`)
        ).send({
            uuid: uuids.sceneRoleInstanceUuid,
            name: "role on the scene",
            uuid_role: uuids.sceneRoleUuid,
            uuid_has_reference_scene_instance: uuids.sceneInstanceUuid,
        });
        expect(sceneRole.status, "seeding the scene role").to.equal(201);

        const classRole = await auth(
            server.post(`/instances/rolesInstances/${uuids.classRoleInstanceUuid}`)
        ).send({
            uuid: uuids.classRoleInstanceUuid,
            name: "role on a node",
            uuid_role: uuids.sceneRoleUuid,
            uuid_has_reference_class_instance: uuids.classInstanceUuids[0],
        });
        expect(classRole.status, "seeding the class role").to.equal(201);
    });

    after(async function () {
        await setup.tearDown(client, [
            ...uuids.relationAttributeUuids,
            ...uuids.roleInstanceFromUuids,
            ...uuids.roleInstanceToUuids,
            ...uuids.relationInstanceUuids,
            ...uuids.scenePortAttributeUuids,
            ...uuids.scenePortInstanceUuids,
            uuids.sceneRoleInstanceUuid,
            uuids.classRoleInstanceUuid,
            ...uuids.classInstanceUuids,
            uuids.sceneInstanceUuid,
            uuids.sceneTypeUuid,
            uuids.classUuid,
            uuids.relationclassUuid,
            uuids.scenePortUuid,
            uuids.sceneRoleUuid,
            uuids.roleFromUuid,
            uuids.roleToUuid,
            uuids.attributeUuid,
            uuids.attributeTypeUuid,
        ]);
    });

    it("returns each relation of the scene exactly as reading that relation on its own does", async () => {
        const relations = relations_of(await read_scene());
        expect(relations.length, "every relation of the scene").to.equal(RELATIONS);

        // The batched read against the per-object read it replaced. Anything the
        // join dropped, duplicated or leaked shows up here as a difference in the
        // document, which is the only question a read change has to answer.
        for (const relationUuid of uuids.relationInstanceUuids) {
            const batched = relations.find(
                (relation) => (relation.uuid as unknown as string) === relationUuid
            );
            expect(batched, `relation ${relationUuid} in the scene read`).to.exist;

            const single = (
                await auth(
                    server.get(`/instances/relationclassesInstances/${relationUuid}`)
                )
            ).body;
            expect(single.uuid).to.equal(relationUuid);
            expect(JSON.parse(JSON.stringify(batched))).to.deep.equal(single);
        }
    });

    it("returns both ends, the attributes and the bendpoints of every relation", async () => {
        const relations = relations_of(await read_scene());

        uuids.relationInstanceUuids.forEach((relationUuid, r) => {
            const relation = relations.find(
                (candidate) => (candidate.uuid as unknown as string) === relationUuid
            ) as Record<string, never>;

            expect(
                (relation.role_instance_from as Record<string, never>)?.uuid as unknown as string,
                `role_instance_from of edge ${r}`
            ).to.equal(uuids.roleInstanceFromUuids[r]);
            expect(
                (relation.role_instance_to as Record<string, never>)?.uuid as unknown as string,
                `role_instance_to of edge ${r}`
            ).to.equal(uuids.roleInstanceToUuids[r]);

            // The two ends must not be confused with one another: they are read
            // together now, out of one map keyed by uuid.
            expect(
                (relation.role_instance_from as Record<string, never>)
                    ?.uuid_has_reference_class_instance as unknown as string
            ).to.equal(uuids.classInstanceUuids[r]);
            expect(
                (relation.role_instance_to as Record<string, never>)
                    ?.uuid_has_reference_class_instance as unknown as string
            ).to.equal(uuids.classInstanceUuids[r + RELATIONS]);

            const attributes = (relation.attribute_instance ??
                []) as unknown as Record<string, never>[];
            expect(attributes.length, `attributes of edge ${r}`).to.equal(1);
            expect(attributes[0].value as unknown as string).to.equal(`edge ${r} label`);

            expect(
                (relation.line_points as unknown as unknown[]).length,
                `bendpoints of edge ${r}`
            ).to.equal(2);
        });
    });

    it("returns the ports that hang off the scene itself", async () => {
        const scene = await read_scene();
        const ports = (scene.port_instances ?? []) as unknown as Record<string, never>[];

        expect(ports.length, "the ports of the scene").to.equal(SCENE_PORTS);
        for (const portInstanceUuid of uuids.scenePortInstanceUuids) {
            const port = ports.find(
                (candidate) => (candidate.uuid as unknown as string) === portInstanceUuid
            );
            expect(port, `port ${portInstanceUuid} in the scene read`).to.exist;
            expect(
                (port as Record<string, never>).uuid_scene_instance as unknown as string
            ).to.equal(uuids.sceneInstanceUuid);
        }
    });

    it("returns the roles that reference the scene", async () => {
        // This never worked. The listing queries selected from role_instance,
        // which has no uuid column, so the getByUuid the loop fed was handed
        // undefined and a scene has always read back with role_instances: [].
        const scene = await read_scene();
        const roles = (scene.role_instances ?? []) as unknown as Record<string, never>[];

        expect(roles.length, "the roles of the scene").to.equal(1);
        expect(roles[0].uuid as unknown as string).to.equal(uuids.sceneRoleInstanceUuid);
        expect(roles[0].name as unknown as string).to.equal("role on the scene");
        expect(
            roles[0].uuid_has_reference_scene_instance as unknown as string
        ).to.equal(uuids.sceneInstanceUuid);
    });

    it("returns the roles of a scene on the route that asks for them directly", async () => {
        // The same loader as the scene read above, reached the other way: through
        // the route rather than through Instance_scenes.getByUuid. It answered
        // [] for every scene before this phase, for the reason above.
        const res = await auth(
            server.get(
                `/instances/sceneInstances/${uuids.sceneInstanceUuid}/rolesInstances`
            )
        );
        expect(res.status).to.equal(200);
        expect(res.body.length, "the roles of the scene").to.equal(1);
        expect(res.body[0].uuid).to.equal(uuids.sceneRoleInstanceUuid);
        expect(res.body[0].uuid_has_reference_scene_instance).to.equal(
            uuids.sceneInstanceUuid
        );
    });
});
