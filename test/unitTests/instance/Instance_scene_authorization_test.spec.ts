import chai from "chai";
import chaiHttp from "chai-http";
import "mocha";
import { PoolClient } from "pg";
import { v4 as uuidv4 } from "uuid";
import { TestEnvironmentSetup } from "../TestEnvironmentSetup";

process.env.NODE_ENV = "test";
chai.use(chaiHttp);
const expect = chai.expect;
const API_URL = "http://localhost:8000";
const TIMEOUT = 30000;
const server = chai.request(API_URL);

/**
 * @description - Authorization is scene-instance-level only. A user's rights over
 * a class instance, attribute instance or port follow from their access to the
 * scene instance that contains it, so addressing one of those objects by its own
 * uuid must be no way around the scene boundary.
 *
 * The objects below all belong to one scene owned by the administrator. An
 * outsider, who has no entry at all in scene_instance_user_access for it, must be
 * refused every verb; a reader, who has read access and nothing more, must be able
 * to GET them and nothing more.
 */
describe("Scene instance authorization tests", function () {
    this.timeout(TIMEOUT);
    const setup = TestEnvironmentSetup.getInstance(API_URL);

    let token: string;
    let client: PoolClient;

    const uuids = {
        sceneTypeUuid: uuidv4(),
        attributeUuid: uuidv4(),
        attributeTypeUuid: uuidv4(),
        classUuid: uuidv4(),
        portUuid: uuidv4(),

        sceneInstanceUuid: uuidv4(),
        classInstanceUuid: uuidv4(),
        portInstanceUuid: uuidv4(),
        attributeInstanceUuid: uuidv4(),

        outsiderUuid: uuidv4(),
        readerUuid: uuidv4(),
    };

    const CLASS_INSTANCE_NAME = "Authz test class instance";
    const PORT_INSTANCE_NAME = "Authz test port instance";
    const ATTRIBUTE_INSTANCE_VALUE = "Authz";

    const outsiderName = `test_authz_outsider_${uuids.outsiderUuid}`;
    const readerName = `test_authz_reader_${uuids.readerUuid}`;
    let outsiderToken: string;
    let readerToken: string;

    /**
     * @description - The objects of the scene that the tests address by their own
     * uuid, each with a PATCH body the rule engine accepts.
     *
     * The body matters. An incomplete one — a bare { name } — is refused by
     * verif_*_instance_body with a 403 of its own, before authorization is ever
     * consulted, which would make every one of these tests pass whether the scene
     * boundary were enforced or not.
     *
     * `original` is the value the fixture already holds, so that the positive
     * control can exercise the write path without changing anything.
     * @returns - The three targets.
     */
    const targets = () => [
        {
            what: "class instance",
            path: `/instances/classesInstances/${uuids.classInstanceUuid}`,
            original: CLASS_INSTANCE_NAME,
            patch: (value: string) => ({
                uuid: uuids.classInstanceUuid,
                uuid_class: uuids.classUuid,
                name: value,
            }),
        },
        {
            what: "attribute instance",
            path: `/instances/attributesInstances/${uuids.attributeInstanceUuid}`,
            original: ATTRIBUTE_INSTANCE_VALUE,
            patch: (value: string) => ({
                uuid: uuids.attributeInstanceUuid,
                uuid_attribute: uuids.attributeUuid,
                value: value,
            }),
        },
        {
            what: "port instance",
            path: `/instances/portsInstances/${uuids.portInstanceUuid}`,
            original: PORT_INSTANCE_NAME,
            patch: (value: string) => ({
                uuid: uuids.portInstanceUuid,
                uuid_port: uuids.portUuid,
                name: value,
                uuid_scene_instance: uuids.sceneInstanceUuid,
            }),
        },
    ];

    /**
     * @description - Create a user and sign in as them.
     * @param {string} uuid - The uuid to give the new user.
     * @param {string} username - The login to give the new user.
     * @returns {Promise<string>} - Their authentication token.
     */
    async function create_user(uuid: string, username: string): Promise<string> {
        const password = `pw_${uuid}`;
        await server
            .post("/login/signup/")
            .set("content-type", "application/json")
            .set("Cookie", "authcookie=" + token)
            .send({ uuid: uuid, name: username, username: username, password: password });

        const signin = await server
            .post("/login/signin/")
            .set("content-type", "application/json")
            .send({ username: username, password: password });
        return signin.body;
    }

    before(async () => {
        ({ client, token } = await setup.setupTestEnvironment());

        // The metamodel: a scene type carrying one attribute, one class and one port.
        await server
            .post("/metamodel/sceneTypes")
            .set("content-type", "application/json")
            .set("Cookie", "authcookie=" + token)
            .send({
                uuid: uuids.sceneTypeUuid,
                name: "Authz test scenetype",
                attributes: [
                    {
                        uuid: uuids.attributeUuid,
                        name: "authz test attribute",
                        attribute_type: {
                            uuid: uuids.attributeTypeUuid,
                            name: "Authz_String",
                            pre_defined: false,
                            default_value: "",
                            regex_value: "",
                        },
                    },
                ],
            });

        await server
            .post(`/metamodel/classes/${uuids.classUuid}`)
            .set("content-type", "application/json")
            .set("Cookie", "authcookie=" + token)
            .send({
                uuid: uuids.classUuid,
                name: "Authz test class",
                is_reusable: true,
                is_abstract: false,
                uuid_scene_type: uuids.sceneTypeUuid,
                attributes: [
                    {
                        uuid: uuids.attributeUuid,
                        name: "authz test attribute",
                        attribute_type: { uuid: uuids.attributeTypeUuid },
                    },
                ],
            });

        await server
            .post(`/metamodel/ports/${uuids.portUuid}`)
            .set("content-type", "application/json")
            .set("Cookie", "authcookie=" + token)
            .send({
                uuid: uuids.portUuid,
                name: "Authz test port",
                uuid_scene_type: uuids.sceneTypeUuid,
                geometry: "authz",
            });

        // The scene instance, owned by the administrator who creates it, and the
        // three objects inside it that the tests address directly.
        await server
            .post(`/instances/sceneTypes/${uuids.sceneTypeUuid}/sceneInstances`)
            .set("content-type", "application/json")
            .set("Cookie", "authcookie=" + token)
            .send({
                uuid: uuids.sceneInstanceUuid,
                uuid_scene_type: uuids.sceneTypeUuid,
                name: "Authz test scene instance",
            });

        await server
            .post(`/instances/sceneInstances/${uuids.sceneInstanceUuid}/classesInstances`)
            .set("content-type", "application/json")
            .set("Cookie", "authcookie=" + token)
            .send({
                uuid: uuids.classInstanceUuid,
                uuid_class: uuids.classUuid,
                name: CLASS_INSTANCE_NAME,
            });

        await server
            .post(`/instances/sceneInstances/${uuids.sceneInstanceUuid}/portsInstances`)
            .set("content-type", "application/json")
            .set("Cookie", "authcookie=" + token)
            .send([
                {
                    uuid: uuids.portInstanceUuid,
                    uuid_port: uuids.portUuid,
                    name: PORT_INSTANCE_NAME,
                    uuid_scene_instance: uuids.sceneInstanceUuid,
                },
            ]);

        await server
            .post(`/instances/classesInstances/${uuids.classInstanceUuid}/attributesInstances`)
            .set("content-type", "application/json")
            .set("Cookie", "authcookie=" + token)
            .send([
                {
                    uuid: uuids.attributeInstanceUuid,
                    uuid_attribute: uuids.attributeUuid,
                    value: ATTRIBUTE_INSTANCE_VALUE,
                },
            ]);

        outsiderToken = await create_user(uuids.outsiderUuid, outsiderName);
        readerToken = await create_user(uuids.readerUuid, readerName);

        await server
            .post(`/instances/sceneInstances/${uuids.sceneInstanceUuid}/access`)
            .set("content-type", "application/json")
            .set("Cookie", "authcookie=" + token)
            .send({ uuid_user: uuids.readerUuid, access: "read" });
    });

    after(async () => {
        await setup.tearDown(client, Object.values(uuids));
    });

    // -------------------------------------------------------------------------
    // The positive control. Without it a 403 below could equally mean the object
    // was never created, or that the request was malformed.
    // -------------------------------------------------------------------------

    describe("The fixture", function () {
        it("belongs to the scene it was created in", async () => {
            const res = await server
                .get(`/instances/sceneInstances/${uuids.sceneInstanceUuid}`)
                .set("Cookie", "authcookie=" + token);

            expect(res.status).to.equal(200);
            expect(res.body.class_instances.map((c: { uuid: string }) => c.uuid))
                .to.include(uuids.classInstanceUuid);
            expect(res.body.port_instances.map((p: { uuid: string }) => p.uuid))
                .to.include(uuids.portInstanceUuid);
        });

        it("is readable by its owner through the direct routes", async () => {
            for (const { what, path } of targets()) {
                const res = await server
                    .get(path)
                    .set("Cookie", "authcookie=" + token);
                expect(res.status, what).to.equal(200);
            }
        });

        it("is writable by its owner, so a later 403 is the authorization", async () => {
            for (const { what, path, patch, original } of targets()) {
                const res = await server
                    .patch(path)
                    .set("content-type", "application/json")
                    .set("Cookie", "authcookie=" + token)
                    .send(patch(original));
                // Not "equal 200": PATCH of an attribute instance answers 500 for
                // everyone, its owner included, which is a defect of the attribute
                // update path and nothing to do with rights. What has to hold here
                // is only that the owner is not the one being refused.
                expect(res.status, what).to.not.equal(403);
            }
        });

        it("accepts a PATCH of a class and a port from its owner", async () => {
            for (const { what, path, patch, original } of targets()) {
                if (what === "attribute instance") continue;
                const res = await server
                    .patch(path)
                    .set("content-type", "application/json")
                    .set("Cookie", "authcookie=" + token)
                    .send(patch(original));
                expect(res.status, what).to.equal(200);
            }
        });
    });

    // -------------------------------------------------------------------------
    // A user with no access to the scene at all.
    // -------------------------------------------------------------------------

    describe("A user with no access to the scene", function () {
        for (const { what, path, patch } of targets()) {
            it(`cannot GET the ${what} by uuid`, async () => {
                const res = await server
                    .get(path)
                    .set("Cookie", "authcookie=" + outsiderToken);
                expect(res.status).to.equal(403);
            });

            it(`cannot PATCH the ${what} by uuid`, async () => {
                const res = await server
                    .patch(path)
                    .set("content-type", "application/json")
                    .set("Cookie", "authcookie=" + outsiderToken)
                    .send(patch("taken over by the outsider"));
                expect(res.status).to.equal(403);
            });

            it(`cannot DELETE the ${what} by uuid`, async () => {
                const res = await server
                    .delete(path)
                    .set("Cookie", "authcookie=" + outsiderToken);
                expect(res.status).to.equal(403);
            });
        }

        it("cannot reach the contents of the scene through its child routes", async () => {
            for (const path of [
                `/instances/sceneInstances/${uuids.sceneInstanceUuid}/classesInstances`,
                `/instances/sceneInstances/${uuids.sceneInstanceUuid}/portsInstances`,
                `/instances/sceneInstances/${uuids.sceneInstanceUuid}/attributesInstances`,
            ]) {
                const res = await server
                    .get(path)
                    .set("Cookie", "authcookie=" + outsiderToken);
                expect(res.status, path).to.equal(403);
            }
        });

        it("cannot reach the attributes of a class of the scene", async () => {
            const res = await server
                .get(`/instances/classesInstances/${uuids.classInstanceUuid}/attributesInstances`)
                .set("Cookie", "authcookie=" + outsiderToken);
            expect(res.status).to.equal(403);
        });
    });

    // -------------------------------------------------------------------------
    // A user with read access and nothing more.
    // -------------------------------------------------------------------------

    describe("A user with read access to the scene", function () {
        for (const { what, path, patch } of targets()) {
            it(`can GET the ${what} but not PATCH it`, async () => {
                const read = await server
                    .get(path)
                    .set("Cookie", "authcookie=" + readerToken);
                expect(read.status).to.equal(200);

                const write = await server
                    .patch(path)
                    .set("content-type", "application/json")
                    .set("Cookie", "authcookie=" + readerToken)
                    .send(patch("rewritten by the reader"));
                expect(write.status).to.equal(403);
            });
        }

        it("can read the contents of the scene through its child routes", async () => {
            const res = await server
                .get(`/instances/sceneInstances/${uuids.sceneInstanceUuid}/classesInstances`)
                .set("Cookie", "authcookie=" + readerToken);
            expect(res.status).to.equal(200);
        });

        it("cannot DELETE what it can read", async () => {
            const res = await server
                .delete(`/instances/classesInstances/${uuids.classInstanceUuid}`)
                .set("Cookie", "authcookie=" + readerToken);
            expect(res.status).to.equal(403);
        });
    });

    // -------------------------------------------------------------------------
    // Nothing that was refused may have been carried out anyway.
    // -------------------------------------------------------------------------

    describe("After every refusal", function () {
        it("the objects are still there, and unchanged", async () => {
            const cls = await server
                .get(`/instances/classesInstances/${uuids.classInstanceUuid}`)
                .set("Cookie", "authcookie=" + token);
            expect(cls.status).to.equal(200);
            expect(cls.body.name).to.equal(CLASS_INSTANCE_NAME);

            const port = await server
                .get(`/instances/portsInstances/${uuids.portInstanceUuid}`)
                .set("Cookie", "authcookie=" + token);
            expect(port.status).to.equal(200);
            expect(port.body.name).to.equal(PORT_INSTANCE_NAME);

            const attr = await server
                .get(`/instances/attributesInstances/${uuids.attributeInstanceUuid}`)
                .set("Cookie", "authcookie=" + token);
            expect(attr.status).to.equal(200);
            expect(attr.body.value).to.equal(ATTRIBUTE_INSTANCE_VALUE);
        });
    });

    // -------------------------------------------------------------------------
    // An object that belongs to no scene has no scene boundary to be authorized
    // against, and must not start answering 403 to everyone.
    // -------------------------------------------------------------------------

    describe("An object outside any scene", function () {
        it("is not refused for want of an owning scene", async () => {
            const res = await server
                .get(`/instances/classesInstances/${uuidv4()}`)
                .set("Cookie", "authcookie=" + outsiderToken);
            expect(res.status).to.not.equal(403);
        });
    });
});
