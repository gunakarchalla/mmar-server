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
const server = chai.request(API_URL);

describe("Metamodel sceneTypes tests", function () {
    this.timeout(TIMEOUT);
    const setup = TestEnvironmentSetup.getInstance(API_URL);

    let token: string;
    let client: PoolClient;

    const uuids = {
        sceneTypeUuid: uuidv4(),
        sceneTypeUuid2: uuidv4(),
        sceneTypeUuid3: uuidv4(),
        sceneTypeUuid4: uuidv4(),
        sceneTypeUuid5: uuidv4(),
        sceneTypeUuid6: uuidv4(),
        sceneTypeUuid7: uuidv4(),
        sceneInstanceUuid: uuidv4(),
        portUuid: uuidv4(),
        portUuid2: uuidv4(),
        classUuid: uuidv4(),
        classUuid2: uuidv4(),
        relationClassUuid: uuidv4(),
        roleUuid: uuidv4(),
        roleFromUuid: uuidv4(),
        roleToUuid: uuidv4(),
        attributeUuid: uuidv4(),
        attributeTypeUuid: uuidv4(),
    };

    before(async () => {
        ({client, token} = await setup.setupTestEnvironment());
    });

    after(async () => {
        await setup.tearDown(client, Object.values(uuids));
    });

    describe("POST Metamodel scenetypes", function () {
        it(`Should post and return minimal scene type with uuid ${uuids.sceneTypeUuid}`, async () => {
            const res1 = await server
                .post("/metamodel/sceneTypes")
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.sceneTypeUuid,
                    name: "BPMN Diagram",
                    description: "This is a BPMN metamodel",
                });
            expect(res1).to.exist;
            expect(res1.status).to.equal(200);
            expect(res1.body).to.deep.include({
                uuid: uuids.sceneTypeUuid,
                name: "BPMN Diagram",
                description: "This is a BPMN metamodel",
                uuid_metaobject: uuids.sceneTypeUuid,
            });
        });

        it(`Should post and return full scene type with uuid ${uuids.sceneTypeUuid2}`, async () => {
            const res1 = await server
                .post("/metamodel/sceneTypes")
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.sceneTypeUuid2,
                    name: "BPMN Diagram",
                    description: "This is a BPMN metamodel",
                    classes: [
                        {
                            uuid: uuids.classUuid,
                            name: "Start",
                        },
                    ],
                    relationclasses: [
                        {
                            uuid: uuids.relationClassUuid,
                            name: "test_rel_class",
                            role_from: {
                                uuid: uuids.roleFromUuid,
                                name: "test_role_from",
                                class_references: [
                                    {
                                        uuid: uuids.classUuid,
                                    },
                                ],
                            },
                            role_to: {
                                uuid: uuids.roleToUuid,
                                name: "test_role_to",
                                class_references: [
                                    {
                                        uuid: uuids.classUuid,
                                    },
                                ],
                            },
                        },
                    ],
                });
            expect(res1).to.exist;
            expect(res1.status).to.equal(200);
            expect(res1.body).to.deep.include({
                uuid: uuids.sceneTypeUuid2,
                name: "BPMN Diagram",
                description: "This is a BPMN metamodel",
            });
            expect(res1.body.classes[0].uuid).to.equal(uuids.classUuid);
            expect(res1.body.relationclasses[0].uuid).to.equal(
                uuids.relationClassUuid
            );
        });
    });

    describe("GET Metamodel scenetypes", function () {
        it(`Should return the scene type with uuid ${uuids.sceneTypeUuid}`, async () => {
            const res1 = await server
                .get(`/metamodel/sceneTypes/${uuids.sceneTypeUuid}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);
            expect(res1).to.exist;
            expect(res1.status).to.equal(200);
            expect(res1.body).to.deep.include({
                uuid: uuids.sceneTypeUuid,
                name: "BPMN Diagram",
                description: "This is a BPMN metamodel",
            });
        });

        it("Should get all the scene types", async () => {
            const res1 = await server
                .get("/metamodel/sceneTypes")
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);
            expect(res1).to.exist;
            expect(res1.status).to.equal(200);
            expect(res1.body).to.have.property("sceneTypes");
            expect(res1.body.sceneTypes).to.be.an("array");

            const sceneType1 = res1.body.sceneTypes.find(
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                (sceneType) => sceneType.uuid === uuids.sceneTypeUuid
            );
            const sceneType2 = res1.body.sceneTypes.find(
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                (sceneType) => sceneType.uuid === uuids.sceneTypeUuid2
            );
            expect(sceneType1).to.exist;
            expect(sceneType1).to.include({
                uuid: uuids.sceneTypeUuid,
                name: "BPMN Diagram",
                description: "This is a BPMN metamodel",
            });

            expect(sceneType2).to.exist;
            expect(sceneType2).to.include({
                uuid: uuids.sceneTypeUuid2,
                name: "BPMN Diagram",
                description: "This is a BPMN metamodel",
            });
        });
    });

    describe("DELETE Metamodel scenetypes", function () {
        it(`Should delete and return the uuid ${uuids.sceneTypeUuid}`, async () => {
            const res1 = await server
                .delete(`/metamodel/sceneTypes/${uuids.sceneTypeUuid}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);
            expect(res1).to.exist;
            expect(res1.status).to.equal(200);
            expect(res1.body).to.deep.include(uuids.sceneTypeUuid);
        });

        it(`Should delete only the scenetype but not the attribute and return the uuid ${uuids.sceneTypeUuid3}`, async () => {
            await server
                .post("/metamodel/sceneTypes")
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.sceneTypeUuid3,
                    name: "BPMN Diagram",
                    description: "This is a BPMN metamodel",
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
                });

            const res1 = await server
                .delete(`/metamodel/sceneTypes/${uuids.sceneTypeUuid3}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);
            expect(res1).to.exist;
            expect(res1.status).to.equal(200);
            expect(res1.body).to.deep.include(uuids.sceneTypeUuid3);
            expect(res1.body).to.not.deep.include(uuids.attributeUuid);
        });


        it(`Should delete only the scenetype but not the attribute and return the uuid ${uuids.sceneTypeUuid4}`, async () => {
            await server
                .post("/metamodel/sceneTypes")
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.sceneTypeUuid4,
                    name: "BPMN Diagram",
                    description: "This is a BPMN metamodel",
                    classes: [
                        {
                            uuid: uuids.classUuid2,
                            name: "Start",
                        },
                    ],
                });

            const res1 = await server
                .delete(`/metamodel/sceneTypes/${uuids.sceneTypeUuid4}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);
            expect(res1).to.exist;
            expect(res1.status).to.equal(200);
            expect(res1.body).to.deep.include(uuids.sceneTypeUuid4);
            expect(res1.body).to.not.deep.include(uuids.classUuid2);
        });

        it(`Should delete the sceneType and the linked port and return the uuid ${uuids.sceneTypeUuid5}`, async () => {
            await server
                .post("/metamodel/sceneTypes")
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.sceneTypeUuid5,
                    name: "BPMN Diagram",
                    description: "This is a BPMN metamodel",
                    ports: [
                        {
                            uuid: uuids.portUuid,
                            name: "Port_for_Task",
                        },
                    ],
                });

            const res1 = await server
                .delete(`/metamodel/sceneTypes/${uuids.sceneTypeUuid5}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);

            expect(res1).to.exist;
            expect(res1.status).to.equal(200);
            expect(res1.body).to.deep.include(uuids.sceneTypeUuid5);
            expect(res1.body).to.deep.include(uuids.portUuid);
        });

        it(`Should restrict the deletion and return the uuid ${uuids.roleUuid}`, async () => {
            await server
                .post("/metamodel/sceneTypes")
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.sceneTypeUuid6,
                    name: "BPMN Diagram",
                    description: "This is a BPMN metamodel",
                });
            await server
                .post(`/metamodel/sceneTypes/${uuids.sceneTypeUuid6}/roles`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.roleUuid,
                    name: "subsequent_from_port",
                    scenetype_references: [
                        {
                            uuid: uuids.sceneTypeUuid6,
                            min: 1,
                            max: 1,
                        },
                    ],
                });

            const res1 = await server
                .delete(`/metamodel/sceneTypes/${uuids.sceneTypeUuid6}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);

            expect(res1).to.exist;
            expect(res1.status).to.equal(409);
            expect(res1.body).to.contain(uuids.roleUuid);
        });

        it(`Should restrict the deletion and return the uuid ${uuids.sceneInstanceUuid}`, async () => {
            await server
                .post("/metamodel/sceneTypes")
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.sceneTypeUuid7,
                    name: "Test Scene Instance",
                    description: "This is a test metamodel",
                });
            await server
                .post(`/instances/sceneTypes/${uuids.sceneTypeUuid7}/sceneInstances`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.sceneInstanceUuid,
                    name: "subsequent_from_port",
                    uuid_metaobject: uuids.sceneTypeUuid7,
                });

            const res1 = await server
                .delete(`/metamodel/sceneTypes/${uuids.sceneTypeUuid7}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);

            expect(res1).to.exist;
            expect(res1.status).to.equal(409);
            expect(res1.body).to.contain(uuids.sceneInstanceUuid);
        });
    });
});
