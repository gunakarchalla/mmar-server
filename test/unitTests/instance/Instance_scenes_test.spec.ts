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

describe("Instance sceneInstance tests", function () {
    this.timeout(TIMEOUT);
    const setup = TestEnvironmentSetup.getInstance(API_URL);

    let token: string;

    let client: PoolClient;

    const uuids = {
        sceneTypeUuid: uuidv4(),
        sceneInstanceUuid: uuidv4(),
        sceneTypeUuid2: uuidv4(),
        sceneInstanceUuid2: uuidv4(),
        classUuid2: uuidv4(),
        classInstanceUuid2: uuidv4(),
        sceneTypeUuid3: uuidv4(),
        sceneInstanceUuid3: uuidv4(),
        attributeUuid3: uuidv4(),
        attributeInstanceUuid3: uuidv4(),
        attributeTypeUuid3: uuidv4(),
        sceneTypeUuid4: uuidv4(),
        sceneInstanceUuid4: uuidv4(),
        portUuid4: uuidv4(),
        portInstanceUuid4: uuidv4(),
        scenetypeUuid5: uuidv4(),
        roleUuid5: uuidv4(),
        roleInstanceUuid5: uuidv4(),
        sceneInstanceUuid5: uuidv4(),
    };

    before(async () => {
        ({client, token} = await setup.setupTestEnvironment());
    });


    after(async function () {
        await setup.tearDown(client, Object.values(uuids));
    });

    describe("POST Instance scene", function () {
        it(`Should post and return minimal scene with uuid ${uuids.sceneInstanceUuid}`, async () => {
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
            const res1 = await server
                .post(`/instances/sceneTypes/${uuids.sceneTypeUuid}/sceneInstances`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.sceneInstanceUuid,
                    uuid_scene_type: uuids.sceneTypeUuid,
                    name: "BPMN Diagram - test instance",
                });

            expect(res1).to.exist;
            expect(res1.status).to.equal(201);
            expect(res1.body).to.deep.include({
                uuid: uuids.sceneInstanceUuid,
                uuid_scene_type: uuids.sceneTypeUuid,
                name: "BPMN Diagram - test instance",
                uuid_instance_object: uuids.sceneInstanceUuid,
            });
        });
    });

    describe("GET Instance scene", function () {
        it(`Should return the scene type with uuid ${uuids.sceneInstanceUuid}`, async () => {
            const res1 = await server
                .get(`/instances/sceneInstances/${uuids.sceneInstanceUuid}`)

                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);
            expect(res1).to.exist;
            expect(res1.status).to.equal(200);
            expect(res1.body).to.deep.include({
                uuid: uuids.sceneInstanceUuid,
                uuid_scene_type: uuids.sceneTypeUuid,
                name: "BPMN Diagram - test instance",
                uuid_instance_object: uuids.sceneInstanceUuid,
            });
        });

        it("Should all the scene types", async () => {
            const res1 = await server
                .get(`/instances/sceneTypes/${uuids.sceneTypeUuid}/sceneInstances`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);
            expect(res1).to.exist;
            expect(res1.status).to.equal(200);
            expect(res1.body[0]).to.deep.include({
                uuid: uuids.sceneInstanceUuid,
                uuid_scene_type: uuids.sceneTypeUuid,
                name: "BPMN Diagram - test instance",
                uuid_instance_object: uuids.sceneInstanceUuid,
            });
        });
    });

    describe("PATCH Instance scene", function () {
        it(`Should patch and return the uuid ${uuids.sceneInstanceUuid}`, async () => {
            const res1 = await server
                .patch(`/instances/sceneInstances/${uuids.sceneInstanceUuid}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.sceneInstanceUuid,
                    uuid_scene_type: uuids.sceneTypeUuid,
                    name: "BPMN Diagram - test instance - updated",
                });

            expect(res1).to.exist;
            expect(res1.status).to.equal(200);
            expect(res1.body).to.deep.include({
                uuid: uuids.sceneInstanceUuid,
                uuid_scene_type: uuids.sceneTypeUuid,
                name: "BPMN Diagram - test instance - updated",
                uuid_instance_object: uuids.sceneInstanceUuid,
            });
        });
    });

    describe("DELETE Instance scene", function () {
        it(`Should delete and return the uuid ${uuids.sceneInstanceUuid}`, async () => {
            const res1 = await server
                .delete(`/instances/sceneInstances/${uuids.sceneInstanceUuid}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);
            expect(res1).to.exist;
            expect(res1.status).to.equal(200);
            expect(res1.body).to.deep.include(uuids.sceneInstanceUuid);
        });

        it("should delete the scene and unlink the class", async () => {
            const resScene = await server
                .post("/metamodel/sceneTypes")
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.sceneTypeUuid2,
                    name: "Test scenetype delete classes",
                    description: "This is a scenetype to test delete classes",
                    classes: [
                        {
                            uuid: uuids.classUuid2,
                            name: "test meta class",
                            is_reusable: true,
                            is_abstract: false,
                            geometry: "",
                        },
                    ],
                });
            expect(resScene).to.exist;
            expect(resScene.status).to.equal(200);

            const res1 = await server
                .post(`/instances/sceneTypes/${uuids.sceneTypeUuid2}/sceneInstances`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.sceneInstanceUuid2,
                    uuid_scene_type: uuids.sceneTypeUuid2,
                    name: "BPMN Diagram - test instance",
                    class_instances: [
                        {
                            uuid: uuids.classInstanceUuid2,
                            uuid_class: uuids.classUuid2,
                            name: "test class from",
                        },
                    ],
                });

            expect(res1).to.exist;
            expect(res1.status).to.equal(201);

            const res2 = await server
                .delete(`/instances/sceneInstances/${uuids.sceneInstanceUuid2}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);

            expect(res2).to.exist;
            expect(res2.status).to.equal(200);
            expect(res2.body).to.deep.include(uuids.sceneInstanceUuid2);
            expect(res2.body).to.not.deep.include(uuids.classInstanceUuid2);
        });

        it("should delete the scene and the attribute", async () => {
            const resScene = await server
                .post("/metamodel/sceneTypes")
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.sceneTypeUuid3,
                    name: "Test scenetype delete classes",
                    description: "This is a scenetype to test delete classes",
                    attributes: [
                        {
                            uuid: uuids.attributeUuid3,
                            name: "Name",
                            description: "Name of the element",
                            attribute_type: {
                                uuid: uuids.attributeTypeUuid3,
                                name: "String",
                                pre_defined: true,
                                default_value: "This is a string",
                                regex_value:
                                    "^([\\x09\\x0A\\x0D\\x20-\\x7E]|[\\xC2-\\xDF][\\x80-\\xBF]|\\xE0[\\xA0-\\xBF][\\x80-\\xBF]|[\\xE1-\\xEC\\xEE\\xEF][\\x80-\\xBF]{2}|\\xED[\\x80-\\x9F][\\x80-\\xBF]|\\xF0[\\x90-\\xBF][\\x80-\\xBF]{2}|[\\xF1-\\xF3][\\x80-\\xBF]{3}|\\xF4[\\x80-\\x8F][\\x80-\\xBF]{2})*$",
                            },
                        },
                    ],
                });
            expect(resScene).to.exist;
            expect(resScene.status).to.equal(200);

            const res1 = await server
                .post(`/instances/sceneTypes/${uuids.sceneTypeUuid3}/sceneInstances`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.sceneInstanceUuid3,
                    uuid_scene_type: uuids.sceneTypeUuid3,
                    name: "BPMN Diagram - test instance",
                    attribute_instances: [
                        {
                            uuid: uuids.attributeInstanceUuid3,
                            uuid_attribute: uuids.attributeUuid3,
                            value: "Start",
                        },
                    ],
                });

            expect(res1).to.exist;
            expect(res1.status).to.equal(201);
            expect(res1.body.attribute_instances[0]).to.deep.include({
                uuid: uuids.attributeInstanceUuid3,
                uuid_attribute: uuids.attributeUuid3,
                value: "Start",
            });

            const res2 = await server
                .delete(`/instances/sceneInstances/${uuids.sceneInstanceUuid3}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);

            expect(res2).to.exist;
            expect(res2.status).to.equal(200);
            expect(res2.body).to.deep.include(uuids.sceneInstanceUuid3);
            expect(res2.body).to.deep.include(uuids.attributeInstanceUuid3);
        });

        it("should delete the scene and the role", async () => {
            const resScene = await server
                .post("/metamodel/sceneTypes")
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.sceneTypeUuid4,
                    name: "Test scenetype delete classes",
                    description: "This is a scenetype to test delete classes",
                });
            expect(resScene).to.exist;
            expect(resScene.status).to.equal(200);

            await server
                .post(`/metamodel/ports/${uuids.portUuid4}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.portUuid4,
                    name: "Test port for class",
                    uuid_scene_type: uuids.sceneTypeUuid4,
                    geometry: "bla bla bla",
                });

            const res1 = await server
                .post(`/instances/sceneTypes/${uuids.sceneTypeUuid4}/sceneInstances`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.sceneInstanceUuid4,
                    uuid_scene_type: uuids.sceneTypeUuid4,
                    name: "BPMN Diagram - test instance",
                });
            expect(res1).to.exist;
            expect(res1.status).to.equal(201);

            const res2 = await server
                .post(`/instances/sceneInstances/${uuids.sceneInstanceUuid4}/portsInstances`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send([
                    {
                        uuid: uuids.portInstanceUuid4,
                        uuid_port: uuids.portUuid4,
                        name: "Test port instance for class",
                        uuid_scene_instance: uuids.sceneInstanceUuid4,
                        geometry: "bla bla bla",
                    },
                ]);
            expect(res2).to.exist;
            expect(res2.status).to.equal(201);

            const res3 = await server
                .delete(`/instances/sceneInstances/${uuids.sceneInstanceUuid4}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);

            expect(res3).to.exist;
            expect(res3.status).to.equal(200);
            expect(res3.body).to.deep.include(uuids.sceneInstanceUuid4);
            expect(res3.body).to.deep.include(uuids.portInstanceUuid4);
        });

        it(`Should delete scene and the role`, async () => {
            const resScene = await server
                .post("/metamodel/sceneTypes")
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.scenetypeUuid5,
                    name: "Test scene type",
                });
            expect(resScene).to.exist;
            expect(resScene.status).to.equal(200);

            const resRole = await server
                .post(`/metamodel/sceneTypes/${uuids.scenetypeUuid5}/roles`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send([
                    {
                        uuid: uuids.roleUuid5,
                        name: "role scene type ref",
                        scenetype_references: [
                            {
                                uuid: uuids.scenetypeUuid5,
                                min: 1,
                                max: 1,
                            },
                        ],
                    },
                ]);
            expect(resRole).to.exist;
            expect(resRole.status).to.equal(201);

            const resSceneInst = await server
                .post(`/instances/sceneTypes/${uuids.scenetypeUuid5}/sceneInstances`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.sceneInstanceUuid5,
                    uuid_scene_type: uuids.scenetypeUuid5,
                    name: "scene instance test role ref",
                });
            expect(resSceneInst).to.exist;
            expect(resSceneInst.status).to.equal(201);

            const resRoleInst = await server
                .post(`/instances/rolesInstances/${uuids.roleInstanceUuid5}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.roleInstanceUuid5,
                    name: "test role instance",
                    uuid_role: uuids.roleUuid5,
                    uuid_has_reference_scene_instance: uuids.sceneInstanceUuid5,
                });
            expect(resRoleInst).to.exist;
            expect(resRoleInst.status).to.equal(201);

            const resDel = await server
                .delete(`/instances/sceneInstances/${uuids.sceneInstanceUuid5}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);
            expect(resDel).to.exist;
            expect(resDel.status).to.equal(200);
            expect(resDel.body).to.deep.include(uuids.roleInstanceUuid5);
            expect(resDel.body).to.deep.include(uuids.sceneInstanceUuid5);
        });
    });
});
