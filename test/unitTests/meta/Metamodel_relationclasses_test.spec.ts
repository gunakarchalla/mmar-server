import chai from "chai";
import chaiHttp from "chai-http";
import "mocha";
import {v4 as uuidv4} from "uuid";
import {TestEnvironmentSetup} from "../TestEnvironmentSetup";
import {PoolClient} from "pg";

process.env.NODE_ENV = "test";
chai.use(chaiHttp);
const expect = chai.expect;
const API_URL = "http://localhost:8000";
const TIMEOUT = 30000;
const server = chai.request(API_URL);

describe("Metamodel relationClasses tests", function () {
    this.timeout(TIMEOUT);
    const setup = TestEnvironmentSetup.getInstance(API_URL);

    let token: string;
    let client: PoolClient;

    const uuids = {
        relationClassUuid: uuidv4(),
        portUuid: uuidv4(),
        sceneTypeUuid: uuidv4(),
        sceneTypeUuid2: uuidv4(),
        relationClassUuid2: uuidv4(),
        roleUuid: uuidv4(),
        roleUuidFrom: uuidv4(),
        roleUuidFrom2: uuidv4(),
        roleUuidTo: uuidv4(),
        roleUuidTo2: uuidv4(),
        attributeUuid: uuidv4(),
        attributeTypeUuid: uuidv4(),
        relationclassInstanceUuid: uuidv4(),
        roleFromInstanceUuid: uuidv4(),
        roleToInstanceUuid: uuidv4(),
    };

    before(async () => {
        ({client, token} = await setup.setupTestEnvironment());
    });

    after(async () => {
        await setup.tearDown(client, Object.values(uuids));
    });
    describe("POST Metamodel relationClasses", function () {
        it(`Should post and return the relationclass with uuid ${uuids.relationClassUuid} `, async () => {
            await server
                .post("/metamodel/sceneTypes")
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.sceneTypeUuid,
                    name: "BPMN Diagram",
                    description: "This is a BPMN metamodel",
                });
            await server
                .post(`/metamodel/ports/${uuids.portUuid}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.portUuid,
                    name: "Port_for_Task",
                    uuid_scene_type: uuids.sceneTypeUuid,
                    geometry:
                        "function vizRep(gc) {gc.graphic_cube(0.1, 0.1, 0.02, 'red');gc.graphic_text(-0.2, 0, 0.05, 0.05, 0.1, 'port'); return gc.drawVizRepPort()}",
                });
            const res1 = await server
                .post(`/metamodel/relationClasses/${uuids.relationClassUuid}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    name: "test_relationclass",
                    attributes: [
                        {
                            uuid: uuids.attributeUuid,
                            name: "Name",
                            description: "Name of the element",
                            attribute_type: {
                                uuid: uuids.attributeTypeUuid,
                                name: "String",
                                pre_defined: true,
                                default_value: "This is a string",
                                regex_value:
                                    "^([\\x09\\x0A\\x0D\\x20-\\x7E]|[\\xC2-\\xDF][\\x80-\\xBF]|\\xE0[\\xA0-\\xBF][\\x80-\\xBF]|[\\xE1-\\xEC\\xEE\\xEF][\\x80-\\xBF]{2}|\\xED[\\x80-\\x9F][\\x80-\\xBF]|\\xF0[\\x90-\\xBF][\\x80-\\xBF]{2}|[\\xF1-\\xF3][\\x80-\\xBF]{3}|\\xF4[\\x80-\\x8F][\\x80-\\xBF]{2})*$",
                            },
                        },
                    ],
                    role_from: {
                        uuid: uuids.roleUuidFrom,
                        name: "subsequent_role",
                        port_references: [
                            {
                                uuid: uuids.portUuid,
                                min: 1,
                                max: 2,
                            },
                        ],
                    },
                    role_to: {
                        uuid: uuids.roleUuidTo,
                        name: "subsequent_role",
                        port_references: [
                            {
                                uuid: uuids.portUuid,
                                min: 1,
                                max: 2,
                            },
                        ],
                    },
                    geometry: "function vizRep(gc) {}",
                });
            expect(res1).to.exist;
            expect(res1.status).to.equal(201);
            expect(res1.body).to.deep.include({
                uuid: uuids.relationClassUuid,
                name: "test_relationclass",
                geometry: "function vizRep(gc) {}",
                uuid_metaobject: uuids.relationClassUuid,
                uuid_class: uuids.relationClassUuid,
            });
            expect(res1.body.attributes[0]).to.deep.include({
                uuid: uuids.attributeUuid,
            });
            expect(res1.body.attributes[0].attribute_type).to.deep.include({
                uuid: uuids.attributeTypeUuid,
            });
            expect(res1.body.role_from).to.deep.include({
                uuid: uuids.roleUuidFrom,
            });
            expect(res1.body.role_to).to.deep.include({
                uuid: uuids.roleUuidTo,
            });
        });
    });

    describe("GET Metamodel relationClasses", function () {
        it(`Should return the relationclass of uuid ${uuids.relationClassUuid}`, async () => {
            const res1 = await server
                .get(`/metamodel/relationClasses/${uuids.relationClassUuid}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);
            expect(res1).to.exist;
            expect(res1.status).to.equal(200);
            expect(res1.body).to.deep.include({
                uuid: uuids.relationClassUuid,
                name: "test_relationclass",
                geometry: "function vizRep(gc) {}",
                uuid_metaobject: uuids.relationClassUuid,
                uuid_class: uuids.relationClassUuid,
            });
            expect(res1.body.attributes[0]).to.deep.include({
                uuid: uuids.attributeUuid,
            });
            expect(res1.body.attributes[0].attribute_type).to.deep.include({
                uuid: uuids.attributeTypeUuid,
            });
            expect(res1.body.role_from).to.deep.include({
                uuid: uuids.roleUuidFrom,
            });
            expect(res1.body.role_to).to.deep.include({
                uuid: uuids.roleUuidTo,
            });
        });
    });

    describe("DELETE Metamodel relationClasses", function () {
        it(`Should delete and return the uuid ${uuids.relationClassUuid}, ${uuids.roleUuidFrom}, and ${uuids.roleUuidTo}`, async () => {
            const res1 = await server
                .delete(`/metamodel/relationClasses/${uuids.relationClassUuid}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);
            expect(res1).to.exist;
            expect(res1.status).to.equal(200);
            expect(res1.body).to.deep.include(uuids.relationClassUuid);
            expect(res1.body).to.not.deep.include(uuids.attributeUuid);
            expect(res1.body).to.deep.include(uuids.roleUuidFrom);
            expect(res1.body).to.deep.include(uuids.roleUuidTo);
        });

        it(`Should restrict the the deletion if the relationclass have relationclass instances`, async () => {
            const relaclassPost = await server
                .post(`/metamodel/relationClasses/${uuids.relationClassUuid}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    name: "test_relationclass",
                    role_from: {
                        uuid: uuids.roleUuidFrom,
                        name: "subsequent_role",
                        port_references: [
                            {
                                uuid: uuids.portUuid,
                                min: 1,
                                max: 2,
                            },
                        ],
                    },
                    role_to: {
                        uuid: uuids.roleUuidTo,
                        name: "subsequent_role",
                        port_references: [
                            {
                                uuid: uuids.portUuid,
                                min: 1,
                                max: 2,
                            },
                        ],
                    },
                });

            expect(relaclassPost).to.exist;
            expect(relaclassPost.status).to.equal(201);

            const relaInstancePost = await server
                .post(
                    `/instances/relationclassesInstances/${uuids.relationclassInstanceUuid}`
                )
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.relationclassInstanceUuid,
                    uuid_relationclass: uuids.relationClassUuid,
                    name: "test relationclass instance",
                    uuid_role_instance_from: uuids.roleFromInstanceUuid,
                    uuid_role_instance_to: uuids.roleToInstanceUuid,
                    role_instance_from: {
                        uuid: uuids.roleFromInstanceUuid,
                        uuid_role: uuids.roleUuidFrom,
                        uuid_relationclass: uuids.relationClassUuid,
                    },
                    role_instance_to: {
                        uuid: uuids.roleToInstanceUuid,
                        uuid_role: uuids.roleUuidTo,
                        uuid_relationclass: uuids.relationClassUuid,
                    },
                });

            expect(relaInstancePost).to.exist;
            expect(relaInstancePost.status).to.equal(201);

            const res1 = await server
                .delete(`/metamodel/relationClasses/${uuids.relationClassUuid}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);

            expect(res1).to.exist;
            expect(res1.status).to.equal(409);
            expect(res1.text).to.contain(uuids.relationclassInstanceUuid);
        });

        it(`Should restrict the deletion and return the uuid ${uuids.roleUuid}`, async () => {
            await server
                .post("/metamodel/sceneTypes")
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.sceneTypeUuid2,
                    name: "BPMN Diagram",
                    description: "This is a BPMN metamodel",
                });
            await server
                .post(`/metamodel/relationClasses/${uuids.relationClassUuid2}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    name: "test relationclass",
                    description: "This is a test relationclass",
                    role_from: {
                        uuid: uuids.roleUuidFrom2,
                        name: "test_role_from",
                    },
                    role_to: {
                        uuid: uuids.roleUuidTo2,
                        name: "test_role_to",
                    },
                });
            await server
                .post(`/metamodel/relationClasses/${uuids.relationClassUuid2}/roles`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send([
                    {
                        uuid: uuids.roleUuid,
                        name: "role_to_test",
                        relationclass_references: [
                            {
                                uuid: uuids.relationClassUuid2,
                                min: 1,
                                max: 1,
                            },
                        ],
                    },
                ]);

            const res1 = await server
                .delete(`/metamodel/relationClasses/${uuids.relationClassUuid2}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);

            expect(res1).to.exist;
            expect(res1.status).to.equal(409);
            expect(res1.text).to.contain(uuids.roleUuid);
        });
    });
});
