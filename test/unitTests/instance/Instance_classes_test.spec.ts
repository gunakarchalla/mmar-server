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

describe("Instance classes tests", function () {
    this.timeout(TIMEOUT);
    const setup = TestEnvironmentSetup.getInstance(API_URL);

    let token: string;
    let client: PoolClient;

    const uuids = {
        sceneInstanceUuid: uuidv4(),
        sceneInstanceUuid2: uuidv4(),
        sceneInstanceUuid3: uuidv4(),
        sceneInstanceUuid4: uuidv4(),
        classInstanceUuid: uuidv4(),
        classInstanceUuid2: uuidv4(),
        classInstanceUuid3: uuidv4(),
        classInstanceUuid4: uuidv4(),
        classInstanceUuid5: uuidv4(),
        classInstanceUuid6: uuidv4(),
        classFromInstanceUuid: uuidv4(),
        classToInstanceUuid: uuidv4(),
        relationclassInstanceUuid: uuidv4(),
        portInstance2Uuid: uuidv4(),
        roleFromInstanceUuid: uuidv4(),
        roleToInstanceUuid: uuidv4(),
        roleInstanceFromUuid: uuidv4(),
        attributeInstanceUuid: uuidv4(),

        sceneTypeUuid: uuidv4(),
        sceneTypeUuid2: uuidv4(),
        attributeUuid: uuidv4(),
        attributeTypeUuid: uuidv4(),
        port2Uuid: uuidv4(),
        relationclassUuid: uuidv4(),
        relationclassUuid2: uuidv4(),
        classUuid: uuidv4(),
        classFromUuid: uuidv4(),
        roleFromUuid: uuidv4(),
        roleFromUuid2: uuidv4(),
        roleToUuid: uuidv4(),
        classToUuid: uuidv4(),
        connectedClassUuid: uuidv4(),
    };
    before(async () => {
        ({client, token} = await setup.setupTestEnvironment());
    });

    after(async () => {
        await setup.tearDown(client, Object.values(uuids));
    });

    describe("POST Instance classes", function () {
        it(`Should post and return minimal class with uuid ${uuids.classInstanceUuid}`, async () => {
            await server
                .post("/metamodel/sceneTypes")
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.sceneTypeUuid,
                    name: "BPMN Diagram",
                    description: "This is a BPMN metamodel",
                    classes: [
                        {
                            uuid: uuids.classUuid,
                            name: "BPMN Diagram - test meta class",
                            is_reusable: true,
                            is_abstract: false,
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
                            geometry: "",
                        },
                    ],
                    relationclasses: [
                        {
                            uuid: uuids.relationclassUuid,
                            bendpoint: uuids.classUuid,
                            name: "test relationclass",
                            role_from: {
                                uuid: uuids.roleFromUuid2,
                                name: "role_from",
                                class_references: [
                                    {
                                        uuid: uuids.classUuid,
                                        min: 1,
                                        max: 1,
                                    },
                                ],
                            },
                            role_to: {
                                uuid: uuids.roleFromUuid2,
                                name: "role_from",
                                class_references: [
                                    {
                                        uuid: uuids.classUuid,
                                        min: 1,
                                        max: 1,
                                    },
                                ],
                            },
                        },
                    ],
                });
            await server
                .post(`/instances/sceneTypes/${uuids.sceneTypeUuid}/sceneInstances`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.sceneInstanceUuid,
                    uuid_scene_type: uuids.sceneTypeUuid,
                    name: "BPMN Diagram - test scene",
                });
            const res1 = await server
                .post(`/instances/classesInstances/${uuids.classInstanceUuid}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.classInstanceUuid,
                    name: "BPMN Diagram - test class",
                    coordinates_2d: {
                        x: -1.2,
                        y: 4.4,
                        z: -3,
                    },
                    rotation: {
                        x: 10,
                        y: 10,
                        z: 10,
                        w: 10,
                    },
                    uuid_class: uuids.classUuid,
                });
            expect(res1).to.exist;
            expect(res1.status).to.equal(201);
            expect(res1.body).to.deep.include({
                uuid: uuids.classInstanceUuid,
                name: "BPMN Diagram - test class",
                uuid_class: uuids.classUuid,
                rotation: {
                    x: 10,
                    y: 10,
                    z: 10,
                    w: 10,
                },
            });
        });

        it(`Should post and return minimal class with uuid ${uuids.connectedClassUuid} associated to a scene instance`, async () => {
            const res1 = await server
                .post(
                    `/instances/sceneInstances/${uuids.sceneInstanceUuid}/classesInstances`
                )
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.connectedClassUuid,
                    name: "BPMN Diagram - test class with scene",
                    coordinates_2d: {
                        x: -1.2,
                        y: 4.4,
                        z: -3,
                    },
                    rotation: {
                        x: 10,
                        y: 10,
                        z: 10,
                        w: 10,
                    },
                    uuid_class: uuids.classUuid,
                });
            expect(res1).to.exist;
            expect(res1.status).to.equal(201);
            expect(res1.body[0]).to.deep.include({
                uuid: uuids.connectedClassUuid,
                name: "BPMN Diagram - test class with scene",
                coordinates_2d: {
                    x: -1.2,
                    y: 4.4,
                    z: -3,
                },
                rotation: {
                    x: 10,
                    y: 10,
                    z: 10,
                    w: 10,
                },
                uuid_class: uuids.classUuid,
            });
        });
    });

    describe("GET Instance classes", function () {
        it(`Should return minimal class with uuid ${uuids.classInstanceUuid}`, async () => {
            const res1 = await server
                .get(`/instances/classesInstances/${uuids.classInstanceUuid}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);
            expect(res1).to.exist;
            expect(res1.status).to.equal(200);
            expect(res1.body).to.deep.include({
                uuid: uuids.classInstanceUuid,
                name: "BPMN Diagram - test class",
                uuid_class: uuids.classUuid,
            });
        });

        it("Should get all the classes", async () => {
            const res1 = await server
                .get(
                    `/instances/sceneInstances/${uuids.sceneInstanceUuid}/classesInstances`
                )
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);
            expect(res1).to.exist;
            expect(res1.status).to.equal(200);
            expect(res1.body[0]).to.deep.include({
                uuid: uuids.connectedClassUuid,
                name: "BPMN Diagram - test class with scene",
                coordinates_2d: {
                    x: -1.2,
                    y: 4.4,
                    z: -3,
                },
                rotation: {
                    x: 10,
                    y: 10,
                    z: 10,
                    w: 10,
                },
                uuid_class: uuids.classUuid,
            });
        });
    });

    describe("DELETE Instance classes", function () {
        it(`Should delete and return the uuid ${uuids.classInstanceUuid}`, async () => {
            const res1 = await server
                .delete(`/instances/classesInstances/${uuids.classInstanceUuid}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);
            expect(res1).to.exist;
            expect(res1.status).to.equal(200);
            expect(res1.body).to.deep.include(uuids.classInstanceUuid);
        });

        it(`Should delete all classes and return the uuid ${uuids.connectedClassUuid}`, async () => {
            const res2 = await server
                .delete(
                    `/instances/sceneInstances/${uuids.sceneInstanceUuid}/classesInstances`
                )
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);
            expect(res2).to.exist;
            expect(res2.status).to.equal(200);
            expect(res2.body).to.deep.include(uuids.connectedClassUuid);
        });

        it(`Should delete the class but not the scenetype`, async () => {
            await server
                .post(`/instances/sceneTypes/${uuids.sceneTypeUuid}/sceneInstances`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.sceneInstanceUuid2,
                    uuid_scene_type: uuids.sceneTypeUuid,
                    name: "test scene - class deletion",
                    class_instances: [
                        {
                            uuid: uuids.classInstanceUuid2,
                            name: "test class - class deletion",
                            coordinates_2d: {
                                x: -1.2,
                                y: 4.4,
                                z: -3,
                            },
                            rotation: {
                                x: 10,
                                y: 10,
                                z: 10,
                                w: 10,
                            },
                            uuid_class: uuids.classUuid,
                        },
                    ],
                });

            const res1 = await server
                .delete(`/instances/classesInstances/${uuids.classInstanceUuid2}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);
            expect(res1).to.exist;
            expect(res1.status).to.equal(200);
            expect(res1.body).to.deep.include(uuids.classInstanceUuid2);
            expect(res1.body).to.not.deep.include(uuids.sceneTypeUuid);
        });

        it(`Should delete the class and the attribute instance`, async () => {
            const test = await server
                .post(`/instances/sceneTypes/${uuids.sceneTypeUuid}/sceneInstances`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.sceneInstanceUuid3,
                    uuid_scene_type: uuids.sceneTypeUuid,
                    name: "test scene - class deletion",
                    class_instances: [
                        {
                            uuid: uuids.classInstanceUuid6,
                            name: "test class - class deletion",
                            coordinates_2d: {
                                x: -1.2,
                                y: 4.4,
                                z: -3,
                            },
                            rotation: {
                                x: 10,
                                y: 10,
                                z: 10,
                                w: 10,
                            },
                            uuid_class: uuids.classUuid,
                            attribute_instance: [
                                {
                                    uuid: uuids.attributeInstanceUuid,
                                    uuid_attribute: uuids.attributeUuid,
                                    value: "Start",
                                },
                            ],
                        },
                    ],
                });

            const res1 = await server
                .delete(`/instances/classesInstances/${uuids.classInstanceUuid6}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);
            expect(res1).to.exist;
            expect(res1.status).to.equal(200);
            expect(res1.body).to.deep.include(uuids.classInstanceUuid6);
            expect(res1.body).to.deep.include(uuids.attributeInstanceUuid);
            expect(res1.body).to.not.deep.include(uuids.sceneTypeUuid);
        });

        it(`Should delete the class and the port`, async () => {
            // create a meta port for a class
            await server
                .post(`/metamodel/ports/${uuids.port2Uuid}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.port2Uuid,
                    name: "Test port for class",
                    uuid_scene_type: uuids.sceneTypeUuid,
                    uuid_class: uuids.classUuid,
                    geometry: "bla bla bla",
                });
            await server
                .post(`/instances/classesInstances/${uuids.classInstanceUuid3}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.classInstanceUuid3,
                    name: "Test class instance port",
                    uuid_class: uuids.classUuid,
                });

            const test = await server
                .post(
                    `/instances/sceneInstances/${uuids.sceneInstanceUuid}/portsInstances`
                )
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send([
                    {
                        uuid: uuids.portInstance2Uuid,
                        uuid_port: uuids.port2Uuid,
                        name: "Test port instance for class",
                        uuid_scene_instance: uuids.sceneInstanceUuid,
                        uuid_class_instance: uuids.classInstanceUuid3,
                        geometry: "bla bla bla",
                    },
                ]);

            const res2 = await server
                .delete(`/instances/classesInstances/${uuids.classInstanceUuid3}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);
            expect(res2).to.exist;
            expect(res2.status).to.equal(200);
            expect(res2.body).to.deep.include(uuids.classInstanceUuid3);
            expect(res2.body).to.deep.include(uuids.portInstance2Uuid);
        });

        it(`Should delete the class (is bendpoint) and the but not the relationclass`, async () => {
            const postClassBendpoint = await server
                .post(`/instances/classesInstances/${uuids.classInstanceUuid4}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.classInstanceUuid4,
                    name: "Test class bendpoint",
                    uuid_class: uuids.classUuid,
                });
            expect(postClassBendpoint).to.exist;
            expect(postClassBendpoint.status).to.equal(
                201,
                "Error creating class bendpoint instance"
            );

            const postClassFromTo = await server
                .post(`/instances/classesInstances/${uuids.classInstanceUuid5}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.classInstanceUuid5,
                    name: "Test class from to",
                    uuid_class: uuids.classUuid,
                });
            expect(postClassFromTo).to.exist;
            expect(postClassFromTo.status).to.equal(
                201,
                "Error creating class instance"
            );

            const resRelClass = await server
                .post(
                    `/instances/sceneInstances/${uuids.sceneInstanceUuid}/relationclassesInstances`
                )
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send([
                    {
                        uuid: uuids.relationclassInstanceUuid,
                        uuid_relationclass: uuids.relationclassUuid,
                        name: "test relationclass instance",
                        line_points: [
                            {
                                uuid: uuids.roleFromInstanceUuid,
                                x: 1,
                                y: 1,
                                z: 1,
                            },
                            {
                                uuid: uuids.classInstanceUuid4,
                                x: 2,
                                y: 2,
                                z: 2,
                            },
                            {
                                uuid: uuids.roleToInstanceUuid,
                                x: 2,
                                y: 2,
                                z: 2,
                            },
                        ],
                        uuid_role_instance_from: uuids.roleFromInstanceUuid,
                        uuid_role_instance_to: uuids.roleToInstanceUuid,
                        role_instance_from: {
                            uuid: uuids.roleFromInstanceUuid,
                            uuid_role: uuids.roleFromUuid2,
                            uuid_relationclass: uuids.relationclassUuid,
                            uuid_has_reference_class_instance: uuids.classInstanceUuid5,
                        },
                        role_instance_to: {
                            uuid: uuids.roleToInstanceUuid,
                            uuid_role: uuids.roleFromUuid2,
                            uuid_relationclass: uuids.relationclassUuid,
                            uuid_has_reference_class_instance: uuids.classInstanceUuid5,
                        },
                    },
                ]);

            expect(resRelClass).to.exist;
            expect(resRelClass.status).to.equal(
                201,
                "Error creating relationclass instance"
            );

            const res2 = await server
                .delete(`/instances/classesInstances/${uuids.classInstanceUuid4}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);
            expect(res2).to.exist;
            expect(res2.status).to.equal(200);
            expect(res2.body).to.deep.include(
                uuids.classInstanceUuid4,
                "Class instance should be deleted"
            );
            expect(res2.body).not.to.deep.include(
                uuids.relationclassInstanceUuid,
                "Relationclass instance should not be deleted"
            );
        });

        it("should delete the relationclass with the class deletion endpoint", async () => {
            const res2 = await server
                .delete(
                    `/instances/classesInstances/${uuids.relationclassInstanceUuid}`
                )
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);
            expect(res2).to.exist;
            expect(res2.status).to.equal(200);
            expect(res2.body).to.deep.include(uuids.relationclassInstanceUuid);
        });

        it(`Should delete the class and the role`, async () => {
            // create meta scene type
            await server
                .post("/metamodel/sceneTypes")
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.sceneTypeUuid2,
                    name: "BPMN Diagram",
                    classes: [
                        {
                            uuid: uuids.classFromUuid,
                            name: "test class from",
                            is_reusable: true,
                            is_abstract: false,
                        },
                        {
                            uuid: uuids.classToUuid,
                            name: "test class to",
                            is_reusable: true,
                            is_abstract: false,
                        },
                    ],
                    relationclasses: [
                        {
                            uuid: uuids.relationclassUuid2,
                            name: "relationclass test",
                            role_from: {
                                uuid: uuids.roleFromUuid,
                                name: "role_from",
                                class_references: [
                                    {
                                        uuid: uuids.classFromUuid,
                                        min: 1,
                                        max: 1,
                                    },
                                ],
                            },
                            role_to: {
                                uuid: uuids.roleToUuid,
                                name: "role_to",
                                class_references: [
                                    {
                                        uuid: uuids.classToUuid,
                                        min: 1,
                                        max: 1,
                                    },
                                ],
                            },
                        },
                    ],
                });

            // create scene instance
            await server
                .post(`/instances/sceneTypes/${uuids.sceneTypeUuid2}/sceneInstances`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.sceneInstanceUuid4,
                    uuid_scene_type: uuids.sceneTypeUuid2,
                    name: "test scene instance",
                    class_instances: [
                        {
                            uuid: uuids.classFromInstanceUuid,
                            uuid_class: uuids.classFromUuid,
                            name: "test class from",
                        },
                        {
                            uuid: uuids.classToInstanceUuid,
                            uuid_class: uuids.classToUuid,
                            name: "test class to",
                        },
                    ],
                });

            await server
                .post(`/instances/rolesInstances/${uuids.roleInstanceFromUuid}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    name: "test role instance",
                    uuid: uuids.roleInstanceFromUuid,
                    uuid_role: uuids.roleFromUuid,
                    uuid_has_reference_class_instance: uuids.classFromInstanceUuid,
                });

            const res1 = await server
                .delete(`/instances/classesInstances/${uuids.classFromInstanceUuid}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);

            expect(res1).to.exist;
            expect(res1.status).to.equal(200);
            expect(res1.body).to.deep.include(uuids.classFromInstanceUuid);
            expect(res1.body).to.deep.include(uuids.roleInstanceFromUuid);
        });
    });
});
