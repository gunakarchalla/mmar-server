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

describe("Metamodel users tests", function () {
    const server = chai.request(API_URL);
    const setup = TestEnvironmentSetup.getInstance(API_URL);

    this.timeout(TIMEOUT);
    let token: string;

    let client: PoolClient;

    const uuids = {
        userUuid: uuidv4(),
        userGroupUuid: uuidv4(),
        classUuid: uuidv4(),
        classUuid2: uuidv4(),
        userUuid2: uuidv4(),
        userGroupUuid2: uuidv4(),
    }
    before(async () => {
        ({client, token} = await setup.setupTestEnvironment());
    });


    after(async () => {
        await setup.tearDown(client, Object.values(uuids));
    });

    describe("POST Metamodel user", () => {
        it(`Should signup the user of uuid ${uuids.userUuid}`, async () => {
            const res1 = await server
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
            expect(res1).to.exist;
            expect(res1.status).to.equal(201);
        });
    });

    describe("General user behavior", () => {
        it(`Should retrieve the user of uuid ${uuids.userUuid}`, async () => {
            const res = await server
                .get(`/users/username/test_user_${uuids.userUuid}`)
                .set("Cookie", "authcookie=" + token);
            expect(res).to.exist;
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property("uuid", uuids.userUuid);
        });

        it(`Should signin the user of uuid ${uuids.userUuid}`, async () => {
            const res1 = await server
                .post(`/login/signin/`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    username: `test_user_${uuids.userUuid}`,
                    password: `test_user_${uuids.userUuid}`,
                });
            expect(res1).to.exist;
            expect(res1.status).to.equal(200);
        });

        it(`Should signout the user of uuid ${uuids.userUuid}`, async () => {
            const res1 = await server
                .get(`/login/signout/`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);
            expect(res1).to.exist;
            expect(res1.status).to.equal(200);
        });
    });

    describe("PATCH users", () => {
        it(`Should patch the user with uuid ${uuids.userUuid}`, async () => {
            const res = await server
                .patch(`/users/${uuids.userUuid}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    username: `test_user_${uuids.userUuid}_updated`,
                    password: `test_user_${uuids.userUuid}`,
                });
            expect(res).to.exist;
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property("uuid", uuids.userUuid);
            expect(res.body).to.have.property(
                "username",
                `test_user_${uuids.userUuid}_updated`
            );
        });
    });

    describe("DELETE Metamodel user", () => {
        it(`Should delete the user of uuid ${uuids.userUuid}`, async () => {
            const res = await server
                .delete(`/users/${uuids.userUuid}`)
                .set("Cookie", "authcookie=" + token);
            expect(res).to.exist;
            expect(res.status).to.equal(200);
            expect(res.body).to.deep.includes(uuids.userUuid);
        });
        it(`Should delete the user of uuid ${uuids.userUuid2} but not the usergroup`, async () => {
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
                .post(`/login/signup/`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: uuids.userUuid2,
                    name: "Test user",
                    username: `test_user_2_${uuids.userUuid2}`,
                    password: `test_user_2_${uuids.userUuid2}`,
                });

            await server
                .post(`/userGroups/${uuids.userGroupUuid2}/users/${uuids.userUuid2}`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token);

            const res = await server
                .delete(`/users/${uuids.userUuid2}`)
                .set("Cookie", "authcookie=" + token);
            expect(res).to.exist;
            expect(res.status).to.equal(200);
            expect(res.body).to.deep.includes(uuids.userUuid2);
            expect(res.body).not.to.deep.includes(uuids.userGroupUuid2);
        });
    });
})
