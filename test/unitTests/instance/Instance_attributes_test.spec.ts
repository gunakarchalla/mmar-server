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

describe("Instance attributes tests", function () {
    const server = chai.request(API_URL);
    const setup = TestEnvironmentSetup.getInstance(API_URL);

    this.timeout(TIMEOUT);
    let token: string;
    let client: PoolClient;

    before(async () => {
        ({client, token} = await setup.setupTestEnvironment());
    });

    const uuids = {
        sceneInstanceUuid: uuidv4(),
        sceneInstanceUuid2: uuidv4(),
        sceneInstanceUuid3: uuidv4(),

        classInstanceUuid: uuidv4(),
        classInstanceUuid2: uuidv4(),
        attributeInstanceUuid: uuidv4(),
        attributeInstanceUuid2: uuidv4(),
        attributeInstanceUuid3: uuidv4(),
        attributeInstance2Uuid: uuidv4(),
        attributeInstance3Uuid: uuidv4(),
        attributeInstanceUuid4: uuidv4(),
        attributeInstanceUuid5: uuidv4(),
        attributeRoleInstanceUuid: uuidv4(),
        portInstanceUuid: uuidv4(),
        roleInstanceUuid: uuidv4(),

        attributeUuid: uuidv4(),
        attributeTableUuid: uuidv4(),
        attributeColumn1Uuid: uuidv4(),
        attributeTypeColumn1Uuid: uuidv4(),
        attributeColumn2Uuid: uuidv4(),
        attributeTypeColumn2Uuid: uuidv4(),
        attributeColumn3Uuid: uuidv4(),
        attributeTypeColumn3Uuid: uuidv4(),
        attributeTypeUuid: uuidv4(),
        attributeTypeTableUuid: uuidv4(),
        portUuid: uuidv4(),
        attribureRoleUuid: uuidv4(),
        attributeRoleTypeUuid: uuidv4(),
        classUuid: uuidv4(),
        roleUuid: uuidv4(),
        sceneTypeUuid: uuidv4(),

        row1col1Uuid: uuidv4(),
        row1col2Uuid: uuidv4(),
        row1col3Uuid: uuidv4(),
        row2col1Uuid: uuidv4(),
        row2col2Uuid: uuidv4(),
        row2col3Uuid: uuidv4(),
        row3col1Uuid: uuidv4(),
        row3col2Uuid: uuidv4(),
        row3col3Uuid: uuidv4(),
    };
    after(async () => {
        await setup.tearDown(client, Object.values(uuids));
    });

    describe("POST Instance attributes", function () {
        it(`Should post and return minimal attribute for a scene with uuid ${uuids.sceneTypeUuid}`, async function () {
            //this is the query to create the base test metamodel
            await server
                .post("/metamodel/sceneTypes")
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.sceneTypeUuid,
                    name: "Test attribute",
                    attributes: [
                        {
                            uuid: uuids.attributeUuid,
                            name: "test attribute",
                            attribute_type: {
                                uuid: uuids.attributeTypeUuid,
                                name: "String",
                                pre_defined: true,
                                default_value: "This is a string",
                                regex_value:
                                    "^([\\x09\\x0A\\x0D\\x20-\\x7E]|[\\xC2-\\xDF][\\x80-\\xBF]|\\xE0[\\xA0-\\xBF][\\x80-\\xBF]|[\\xE1-\\xEC\\xEE\\xEF][\\x80-\\xBF]{2}|\\xED[\\x80-\\x9F][\\x80-\\xBF]|\\xF0[\\x90-\\xBF][\\x80-\\xBF]{2}|[\\xF1-\\xF3][\\x80-\\xBF]{3}|\\xF4[\\x80-\\x8F][\\x80-\\xBF]{2})*$",
                            },
                        },
                        {
                            uuid: uuids.attributeTableUuid,
                            name: "table attribute",
                            attribute_type: {
                                uuid: uuids.attributeTypeTableUuid,
                                name: "Table_test",
                                has_table_attribute: [
                                    {
                                        attribute: {
                                            uuid: uuids.attributeColumn1Uuid,
                                            name: "column1",
                                            description: "column 1 of the table",
                                            attribute_type: {
                                                uuid: uuids.attributeTypeColumn1Uuid,
                                                name: "column1_type",
                                                pre_defined: false,
                                                default_value: "",
                                                regex_value: "",
                                            },
                                        },
                                        sequence: 1,
                                    },
                                    {
                                        attribute: {
                                            uuid: uuids.attributeColumn2Uuid,
                                            name: "column2",
                                            description: "column 2 of the table",
                                            attribute_type: {
                                                uuid: uuids.attributeTypeColumn2Uuid,
                                                name: "column2_type",
                                                pre_defined: false,
                                                default_value: "",
                                                regex_value: "",
                                            },
                                        },
                                        sequence: 2,
                                    },
                                    {
                                        attribute: {
                                            uuid: uuids.attributeColumn3Uuid,
                                            name: "column3",
                                            description: "column 3 of the table",
                                            attribute_type: {
                                                uuid: uuids.attributeTypeColumn3Uuid,
                                                name: "column3_type",
                                                pre_defined: false,
                                                default_value: "",
                                                regex_value: "",
                                            },
                                        },
                                        sequence: 3,
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
                    name: "Test Scene instance",
                });

            await server
                .post(`/metamodel/classes/${uuids.classUuid}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.classUuid,
                    name: "Test meta class",
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
                        {
                            uuid: uuids.attribureRoleUuid,
                            name: "Augmentation_Reference",
                            attribute_type_uuid: uuids.attributeRoleTypeUuid,
                            attribute_type: {
                                uuid: uuids.attributeRoleTypeUuid,
                                name: "Augmentation_Reference",
                                pre_defined: true,
                                regex_value:
                                    "^([\\x09\\x0A\\x0D\\x20-\\x7E]|[\\xC2-\\xDF][\\x80-\\xBF]|\\xE0[\\xA0-\\xBF][\\x80-\\xBF]|[\\xE1-\\xEC\\xEE\\xEF][\\x80-\\xBF]{2}|\\xED[\\x80-\\x9F][\\x80-\\xBF]|\\xF0[\\x90-\\xBF][\\x80-\\xBF]{2}|[\\xF1-\\xF3][\\x80-\\xBF]{3}|\\xF4[\\x80-\\x8F][\\x80-\\xBF]{2})*$",
                                default_value: "",
                                role:
                                    {
                                        uuid: uuids.roleUuid,
                                        name: "Augmentation_Reference_Role",
                                        scenetype_references: [
                                            {
                                                uuid: uuids.sceneTypeUuid,
                                                min: 1,
                                                max: 1,
                                            },
                                        ],
                                    }

                            },
                        },
                    ],
                });
            await server
                .post(`/instances/classesInstances/${uuids.classInstanceUuid}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.classInstanceUuid,
                    name: "Test class instance",
                    coordinates_2d: {
                        x: -1.2,
                        y: 4.4,
                        z: -3,
                    },
                    uuid_class: uuids.classUuid,
                });
            const res1 = await server
                .post(
                    `/instances/classesInstances/${uuids.classInstanceUuid}/attributesInstances`
                )
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send([
                    {
                        uuid: uuids.attributeInstanceUuid,
                        uuid_attribute: uuids.attributeUuid,
                        value: "Start",
                    },
                ]);
            expect(res1).to.exist;
            expect(res1.status).to.equal(201);
            expect(res1.body[0]).to.deep.include({
                uuid: uuids.attributeInstanceUuid,
                uuid_attribute: uuids.attributeUuid,
                value: "Start",
            });
        });

        it(`Should post and return minimal attribute for a scene with uuid ${uuids.sceneInstanceUuid}`, async function () {
            const res1 = await server
                .post(
                    `/instances/sceneInstances/${uuids.sceneInstanceUuid}/attributesInstances`
                )
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send([
                    {
                        uuid: uuids.attributeInstance2Uuid,
                        uuid_attribute: uuids.attributeUuid,
                        value: "test attribute value",
                    },
                ]);
            expect(res1).to.exist;
            expect(res1.status).to.equal(201);
            expect(res1.body[0]).to.deep.include({
                uuid: uuids.attributeInstance2Uuid,
                uuid_attribute: uuids.attributeUuid,
                value: "test attribute value",
            });
        });

        it("should post and return an attribute with a role reference", async function () {
            //get the class attribureRoleUuid
            await server
                .get(`/metamodel/attributes/${uuids.attribureRoleUuid}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);


            const res1 = await server
                .post(
                    `/instances/classesInstances/${uuids.classInstanceUuid}/attributesInstances`
                )
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send([
                    {
                        uuid: uuids.attributeRoleInstanceUuid,
                        uuid_attribute: uuids.attribureRoleUuid,
                        value: "Test role reference",
                        role_instance_from: {
                            uuid: uuids.roleInstanceUuid,
                            uuid_role: uuids.roleUuid,
                            name: "Augmentation_Reference_Role_instance",
                            uuid_has_reference_scene_instance: uuids.sceneInstanceUuid,
                        },
                    },
                ]);
            expect(res1).to.exist;
            expect(res1.status).to.equal(201);
            expect(res1.body[0]).to.deep.include({
                uuid: uuids.attributeRoleInstanceUuid,
                uuid_attribute: uuids.attribureRoleUuid,
                value: "Test role reference",
            });
            expect(res1.body[0].role_instance_from).to.deep.include({
                uuid: uuids.roleInstanceUuid,
                uuid_role: uuids.roleUuid,
                name: "Augmentation_Reference_Role_instance",
            });
        });

        it(`Should post and return attribute table for a scene with uuid ${uuids.sceneInstanceUuid}`, async function () {
            const res1 = await server
                .post(
                    `/instances/sceneInstances/${uuids.sceneInstanceUuid}/attributesInstances`
                )
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send([
                    {
                        uuid: uuids.attributeInstance3Uuid,
                        uuid_attribute: uuids.attributeTableUuid,
                        value: "test attribute table for scene",
                        table_attributes: [
                            {
                                uuid: uuids.row1col1Uuid,
                                uuid_attribute: uuids.attributeColumn1Uuid,
                                value: "value row1 col1",
                                table_row: 1,
                            },
                            {
                                uuid: uuids.row1col2Uuid,
                                uuid_attribute: uuids.attributeColumn2Uuid,
                                value: "value row1 col2",
                                table_row: 1,
                            },
                            {
                                uuid: uuids.row1col3Uuid,
                                uuid_attribute: uuids.attributeColumn3Uuid,
                                value: "value row1 col3",
                                table_row: 1,
                            },
                            {
                                uuid: uuids.row2col1Uuid,
                                uuid_attribute: uuids.attributeColumn1Uuid,
                                value: "value row2 col1",
                                table_row: 2,
                            },
                            {
                                uuid: uuids.row2col2Uuid,
                                uuid_attribute: uuids.attributeColumn2Uuid,
                                value: "value row2 col2",
                                table_row: 2,
                            },
                            {
                                uuid: uuids.row2col3Uuid,
                                uuid_attribute: uuids.attributeColumn3Uuid,
                                value: "value row2 col3",
                                table_row: 2,
                            },
                            {
                                uuid: uuids.row3col1Uuid,
                                uuid_attribute: uuids.attributeColumn1Uuid,
                                value: "value row3 col1",
                                table_row: 3,
                            },
                            {
                                uuid: uuids.row3col2Uuid,
                                uuid_attribute: uuids.attributeColumn2Uuid,
                                value: "value row3 col2",
                                table_row: 3,
                            },
                            {
                                uuid: uuids.row3col3Uuid,
                                uuid_attribute: uuids.attributeColumn3Uuid,
                                value: "value row3 col3",
                                table_row: 3,
                            },
                        ],
                    },
                ]);
            expect(res1).to.exist;
            expect(res1.status).to.equal(201);
            expect(res1.body[0].table_attributes.length).to.be.equal(9);
            expect(res1.body[0].table_attributes[0]).to.deep.include({
                uuid: uuids.row1col1Uuid,
            });
            expect(res1.body[0].table_attributes[1]).to.deep.include({
                uuid: uuids.row1col2Uuid,
            });
            expect(res1.body[0].table_attributes[2]).to.deep.include({
                uuid: uuids.row1col3Uuid,
            });
            expect(res1.body[0].table_attributes[3]).to.deep.include({
                uuid: uuids.row2col1Uuid,
            });
            expect(res1.body[0].table_attributes[4]).to.deep.include({
                uuid: uuids.row2col2Uuid,
            });
            expect(res1.body[0].table_attributes[5]).to.deep.include({
                uuid: uuids.row2col3Uuid,
            });
            expect(res1.body[0].table_attributes[6]).to.deep.include({
                uuid: uuids.row3col1Uuid,
            });
            expect(res1.body[0].table_attributes[7]).to.deep.include({
                uuid: uuids.row3col2Uuid,
            });
            expect(res1.body[0].table_attributes[8]).to.deep.include({
                uuid: uuids.row3col3Uuid,
            });
        });
    });

    describe("GET Instance attributes", function () {
        it(`Should return minimal attribute with uuid ${uuids.attributeInstanceUuid}`, async function () {
            const res1 = await server
                .get(`/instances/attributesInstances/${uuids.attributeInstanceUuid}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);
            expect(res1).to.exist;
            expect(res1.status).to.equal(200);
            expect(res1.body).to.deep.include({
                uuid: uuids.attributeInstanceUuid,
                uuid_attribute: uuids.attributeUuid,
                value: "Start",
            });
        });

        it(`Should get all the attributes for a scene with uuid ${uuids.sceneInstanceUuid}`, async function () {
            const res1 = await server
                .get(
                    `/instances/sceneInstances/${uuids.sceneInstanceUuid}/attributesInstances`
                )
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);
            expect(res1).to.exist;
            expect(res1.status).to.equal(200);
            expect(res1.body.length).to.be.equal(2);
            expect(res1.body[0]).to.deep.include({
                uuid: uuids.attributeInstance2Uuid,
                uuid_attribute: uuids.attributeUuid,
                value: "test attribute value",
            });
        });

        it(`Should return attribute table for a scene with uuid ${uuids.sceneInstanceUuid}`, async function () {
            const res1 = await server
                .get(`/instances/attributesInstances/${uuids.attributeInstance3Uuid}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);
            expect(res1).to.exist;
            expect(res1.status).to.equal(200);
            expect(res1.body.table_attributes.length).to.be.equal(9);
            expect(res1.body.table_attributes[0]).to.deep.include({
                uuid: uuids.row1col1Uuid,
            });
            expect(res1.body.table_attributes[1]).to.deep.include({
                uuid: uuids.row1col2Uuid,
            });
            expect(res1.body.table_attributes[2]).to.deep.include({
                uuid: uuids.row1col3Uuid,
            });
            expect(res1.body.table_attributes[3]).to.deep.include({
                uuid: uuids.row2col1Uuid,
            });
            expect(res1.body.table_attributes[4]).to.deep.include({
                uuid: uuids.row2col2Uuid,
            });
            expect(res1.body.table_attributes[5]).to.deep.include({
                uuid: uuids.row2col3Uuid,
            });
            expect(res1.body.table_attributes[6]).to.deep.include({
                uuid: uuids.row3col1Uuid,
            });
            expect(res1.body.table_attributes[7]).to.deep.include({
                uuid: uuids.row3col2Uuid,
            });
            expect(res1.body.table_attributes[8]).to.deep.include({
                uuid: uuids.row3col3Uuid,
            });
        });
    });

    describe("DELETE Instance attributes", function () {
        it(`Should delete and return the uuid ${uuids.attributeInstanceUuid}`, async function () {
            const res1 = await server
                .delete(`/instances/attributesInstances/${uuids.attributeInstanceUuid}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);
            expect(res1).to.exist;
            expect(res1.status).to.equal(200);
            expect(res1.body).to.deep.include(uuids.attributeInstanceUuid);
        });

        it("Should delete all attributes related to a table then return the list of all uuids", async function () {
            const res2 = await server
                .delete(
                    `/instances/attributesInstances/${uuids.attributeInstance3Uuid}`
                )
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);
            expect(res2).to.exist;
            expect(res2.status).to.equal(200);
            expect(res2.body).to.include.deep.members([
                uuids.row1col1Uuid,
                uuids.row1col2Uuid,
                uuids.row1col3Uuid,
                uuids.row2col1Uuid,
                uuids.row2col2Uuid,
                uuids.row2col3Uuid,
                uuids.row3col1Uuid,
                uuids.row3col2Uuid,
                uuids.row3col3Uuid,
            ]);
        });

        it("Should delete the scene and all attributes then return the uuids", async function () {
            const res2 = await server
                .delete(`/instances/sceneInstances/${uuids.sceneInstanceUuid}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);
            expect(res2).to.exist;
            expect(res2.status).to.equal(200);
            expect(res2.body).to.deep.include(uuids.attributeInstance2Uuid);
            expect(res2.body).to.deep.include(uuids.sceneInstanceUuid);
        });

        it("Should delete the attribute but not scenetype", async function () {
            await server
                .post(`/instances/sceneTypes/${uuids.sceneTypeUuid}/sceneInstances`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.sceneInstanceUuid2,
                    uuid_scene_type: uuids.sceneTypeUuid,
                    name: "Test Scene instance",
                    attribute_instances: [
                        {
                            uuid: uuids.attributeInstanceUuid2,
                            uuid_attribute: uuids.attributeUuid,
                            value: "Start",
                        },
                    ],
                });

            const res1 = await server
                .delete(
                    `/instances/attributesInstances/${uuids.attributeInstanceUuid2}`
                )
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);

            expect(res1).to.exist;
            expect(res1.status).to.equal(200);
            expect(res1.body).to.deep.include(uuids.attributeInstanceUuid2);
            expect(res1.body).to.not.deep.include(uuids.sceneTypeUuid);
        });

        it("Should delete the attribute but not role", async function () {
            const res1 = await server
                .delete(
                    `/instances/attributesInstances/${uuids.attributeRoleInstanceUuid}`
                )
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);

            expect(res1).to.exist;
            expect(res1.status).to.equal(200);
            expect(res1.body).to.deep.include(uuids.attributeRoleInstanceUuid);
            expect(res1.body).not.to.deep.include(uuids.roleInstanceUuid);
        });

        it("should delete the attribute but not the class", async function () {
            const resultPost = await server
                .post(`/instances/classesInstances/${uuids.classInstanceUuid2}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.classInstanceUuid2,
                    name: "Test class instance",
                    uuid_class: uuids.classUuid,
                    attribute_instance: [
                        {
                            uuid: uuids.attributeInstanceUuid3,
                            uuid_attribute: uuids.attributeUuid,
                            value: "Start",
                        },
                    ],
                });
            expect(resultPost).to.exist;
            expect(resultPost.status).to.equal(201);

            const res1 = await server
                .delete(
                    `/instances/attributesInstances/${uuids.attributeInstanceUuid3}`
                )
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);

            expect(res1).to.exist;
            expect(res1.status).to.equal(200);
            expect(res1.body).to.deep.include(uuids.attributeInstanceUuid3);
            expect(res1.body).to.not.deep.include(uuids.classInstanceUuid2);
        });

        it("should delete the attribute but not the port", async function () {
            await server
                .post(`/metamodel/ports/${uuids.portUuid}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.portUuid,
                    name: "Test meta port",
                    uuid_scene_type: uuids.sceneTypeUuid,
                    geometry: "bla bla bla",
                });

            await server
                .post(`/instances/sceneTypes/${uuids.sceneTypeUuid}/sceneInstances`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.sceneInstanceUuid3,
                    uuid_scene_type: uuids.sceneTypeUuid,
                    name: "Test Scene instance",
                    attribute_instances: [
                        {
                            uuid: uuids.attributeInstanceUuid5,
                            uuid_attribute: uuids.attributeUuid,
                            value: "Start",
                        },
                    ],
                });

            await server
                .post(
                    `/instances/sceneInstances/${uuids.sceneInstanceUuid3}/portsInstances`
                )
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send([
                    {
                        uuid: uuids.portInstanceUuid,
                        uuid_port: uuids.portUuid,
                        name: "Test port instance",
                        uuid_scene_instance: uuids.sceneInstanceUuid3,
                        geometry: "bla bla bla",
                    },
                ]);

            const res1 = await server
                .delete(
                    `/instances/attributesInstances/${uuids.attributeInstanceUuid5}`
                )
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);

            expect(res1).to.exist;
            expect(res1.status).to.equal(200);
            expect(res1.body).to.deep.include(uuids.attributeInstanceUuid5);
            expect(res1.body).to.not.deep.include(uuids.portInstanceUuid);
        });
    });
});
