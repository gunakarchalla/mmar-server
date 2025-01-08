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

describe("Metamodel userGroups tests", function () {
    const server = chai.request(API_URL);
    const setup = TestEnvironmentSetup.getInstance(API_URL);

    this.timeout(TIMEOUT);
    let token: string;
    let client: PoolClient;

    const uuids = {
        userUuid: uuidv4(),
        userGroupUuid: uuidv4(),
        classUuid: uuidv4(),
        userGroupUuid2: uuidv4(),
        userGroupUuid3: uuidv4(),
        userGroupUuid4: uuidv4(),
        userGroupUuid5: uuidv4(),
        sceneTypeUuid5: uuidv4(),
        sceneInstanceUuid5: uuidv4(),
        sceneInstanceUuid5_1: uuidv4(),
    };
    before(async () => {
        ({client, token} = await setup.setupTestEnvironment());
    });

    after(async () => {
        await setup.tearDown(client, Object.values(uuids));
    });

    describe("POST Metamodel userGroup", function () {
        it(`Should create the usergroup with uuid ${uuids.userGroupUuid}`, async () => {
            const res1 = await server
                .post(`/userGroups`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.userGroupUuid,
                    name: "Test usergroup",
                });
            expect(res1).to.exist;
            expect(res1.status).to.equal(201);
        });

        it(`Should link the usergroup to the user test_user_${uuids.userUuid}`, async () => {
            await server
                .post(`/login/signup/`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.userUuid,
                    name: "Test user",
                    username: `test_user_${uuids.userUuid}`,
                    password: `test_user_${uuids.userUuid}`,
                });
            const res1 = await server
                .post(`/userGroups/${uuids.userGroupUuid}/users/${uuids.userUuid}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);

            expect(res1).to.exist;
            expect(res1.status).to.equal(200);
            expect(res1.body).to.have.property("uuid", uuids.userGroupUuid);
        });
        it(`Should link the metaobject to the usergroup`, async () => {
            await server
                .post(`/metamodel/classes/${uuids.classUuid}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.classUuid,
                    name: "Gateway",
                    is_reusable: true,
                    is_abstract: false,
                    geometry: "function vizRep(gc) {}",
                });

            const res1 = await server
                .post(
                    `/userGroups/${uuids.userGroupUuid}/metaObjects/${uuids.classUuid}`
                )
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    has_read_right: true,
                    has_write_right: true,
                    has_delete_right: true,
                });
            expect(res1).to.exist;
            expect(res1.status).to.equal(200);
            expect(res1.body).to.have.property("uuid", uuids.userGroupUuid);
            expect(res1.body.read_right).to.deep.includes(uuids.classUuid);
            expect(res1.body.write_right).to.deep.includes(uuids.classUuid);
            expect(res1.body.delete_right).to.deep.includes(uuids.classUuid);
        });
    });

    describe("GET Metamodel userGroup", function () {
        it("should get all the usergroups", async () => {
            const res1 = await server
                .get(`/userGroups`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);

            expect(res1).to.exist;
            expect(res1.status).to.equal(200);
            for (const usergroup of res1.body) {
                if (usergroup.uuid == uuids.userGroupUuid) {
                    expect(usergroup).to.have.property("uuid", uuids.userGroupUuid);
                    expect(usergroup).to.have.property("name", "Test usergroup");
                }
            }
        });

        it("should get the usergroup for the user", async () => {
            const res1 = await server
                .get(`/userGroups/users/${uuids.userUuid}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);

            expect(res1).to.exist;
            expect(res1.status).to.equal(200);
            expect(res1.body[0]).to.have.property("uuid", uuids.userGroupUuid);
        });

        it("should get the usergroup by uuid", async () => {
            const res1 = await server
                .get(`/userGroups/${uuids.userGroupUuid}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);

            expect(res1).to.exist;
            expect(res1.status).to.equal(200);
            expect(res1.body).to.have.property("uuid", uuids.userGroupUuid);
        });
    });

    describe("PATCH Metamodel userGroup", function () {
        it("should edit the usergroup by uuid", async () => {
            const res1 = await server
                .patch(`/userGroups/${uuids.userGroupUuid}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    name: "Test usergroup updated",
                });

            expect(res1).to.exist;
            expect(res1.status).to.equal(200);
            expect(res1.body).to.have.property("uuid", uuids.userGroupUuid);
            expect(res1.body).to.have.property("name", "Test usergroup updated");
        });
    });

    describe("DELETE Metamodel userGroup", function () {
        it("should unlink the metaobject from the unsergroup", async () => {
            const res1 = await server
                .delete(
                    `/userGroups/${uuids.userGroupUuid}/metaObjects/${uuids.classUuid}`
                )
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);

            expect(res1).to.exist;
            expect(res1.status).to.equal(200);
            expect(res1.body.uuid).to.deep.equal(uuids.userGroupUuid);
            expect(res1.body.read_right).not.to.deep.include(uuids.classUuid);
            expect(res1.body.write_right).not.to.deep.include(uuids.classUuid);
            expect(res1.body.delete_right).not.to.deep.include(uuids.classUuid);
        });

        it("should unlink the user from the usergroup", async () => {
            const res1 = await server
                .delete(`/userGroups/${uuids.userGroupUuid}/users/${uuids.userUuid}`)
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);

            expect(res1).to.exist;
            expect(res1.status).to.equal(200);
            expect(res1.body.uuid).to.deep.equal(uuids.userGroupUuid);
        });
        it("should delete the usegroup", async () => {
            const res1 = await server
                .delete(`/userGroups/${uuids.userGroupUuid}`)
                .set("Cookie", "authcookie=" + token);

            expect(res1).to.exist;
            expect(res1.status).to.equal(200);
            expect(res1.body).to.deep.includes(uuids.userGroupUuid);
        });

        it("should restrict deletion of the usegroup and return the uuid of the user", async () => {
            await server
                .post(`/userGroups/`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.userGroupUuid2,
                    name: "Test usergroup",
                });
            await server
                .post(`/userGroups/${uuids.userGroupUuid2}/users/${uuids.userUuid}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);

            const res1 = await server
                .delete(`/userGroups/${uuids.userGroupUuid2}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);

            expect(res1).to.exist;
            expect(res1.status).to.equal(409);
            expect(res1.text).to.includes(uuids.userUuid);
        });

        it("should delete the usegroup but not the metaobject", async () => {
            await server
                .post(`/userGroups/`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.userGroupUuid3,
                    name: "Test usergroup",
                });
            await server
                .post(
                    `/userGroups/${uuids.userGroupUuid3}/metaObjects/${uuids.classUuid}`
                )
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);

            const res1 = await server
                .delete(`/userGroups/${uuids.userGroupUuid3}`)
                .set("Cookie", "authcookie=" + token);

            expect(res1).to.exist;
            expect(res1.status).to.equal(200);
            expect(res1.body).to.deep.includes(uuids.userGroupUuid3);
            expect(res1.body).not.to.deep.includes(uuids.classUuid);
        });

        it("should delete the metaobject but not the userGroup", async () => {
            await server
                .post(`/userGroups/`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.userGroupUuid4,
                    name: "Test usergroup",
                });
            await server
                .post(
                    `/userGroups/${uuids.userGroupUuid4}/metaObjects/${uuids.classUuid}`
                )
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);

            const res1 = await server
                .delete(`/metamodel/classes/${uuids.classUuid}`)
                .set("Cookie", "authcookie=" + token);

            expect(res1).to.exist;
            expect(res1.status).to.equal(200);
            expect(res1.body).to.deep.includes(uuids.classUuid);
            expect(res1.body).not.to.deep.includes(uuids.userGroupUuid4);
        });

        it("should delete the instance object but not the userGroup", async () => {
            await server
                .post(`/userGroups/`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.userGroupUuid5,
                    name: "Test usergroup",
                });
            await server
                .post("/metamodel/sceneTypes")
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.sceneTypeUuid5,
                    name: "BPMN Diagram",
                    description: "This is a BPMN metamodel",
                });
            const res1 = await server
                .post(`/instances/sceneTypes/${uuids.sceneTypeUuid5}/sceneInstances`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.sceneInstanceUuid5,
                    uuid_scene_type: uuids.sceneTypeUuid5,
                    name: "BPMN Diagram - test instance",
                });
            expect(res1).to.exist;
            expect(res1.status).to.equal(201);
            const res2 = await server
                .post(`/instances/sceneTypes/${uuids.sceneTypeUuid5}/sceneInstances`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.sceneInstanceUuid5_1,
                    uuid_scene_type: uuids.sceneTypeUuid5,
                    name: "BPMN Diagram - test instance",
                });
            expect(res2).to.exist;
            expect(res2.status).to.equal(201);

            await server
                .post(
                    `/userGroups/${uuids.userGroupUuid5}/instanceObjects/${uuids.sceneInstanceUuid5}`
                )
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);

            const resDel = await server
                .delete(`/instances/sceneInstances/${uuids.sceneInstanceUuid5}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);

            expect(resDel).to.exist;
            expect(resDel.status).to.equal(200);
            expect(resDel.body).to.deep.includes(uuids.sceneInstanceUuid5);
            expect(resDel.body).not.to.deep.includes(uuids.userGroupUuid5);

            const resDelUsrGrp = await server
                .delete(`/userGroups/${uuids.userGroupUuid5}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);

            expect(resDelUsrGrp).to.exist;
            expect(resDelUsrGrp.status).to.equal(200);
            expect(resDelUsrGrp.body).to.deep.includes(uuids.userGroupUuid5);
        });
    });
});
