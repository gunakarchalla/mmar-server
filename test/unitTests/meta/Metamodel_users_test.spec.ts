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
        // Filled in by the password tests, which need a non-administrator caller.
        plainUserUuid: "",
    }
    before(async () => {
        ({client, token} = await setup.setupTestEnvironment());
    });


    after(async () => {
        await setup.tearDown(client, Object.values(uuids).filter((uuid) => uuid !== ""));
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

    describe("POST user password", () => {
        const newPassword = "a_new_password";

        it(`Should refuse a request that carries no password`, async () => {
            const res = await server
                .post(`/users/${uuids.userUuid}/password`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({});
            expect(res).to.exist;
            expect(res.status).to.equal(400);
        });

        it(`Should refuse an empty password`, async () => {
            const res = await server
                .post(`/users/${uuids.userUuid}/password`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({password: ""});
            expect(res).to.exist;
            expect(res.status).to.equal(400);
        });

        it(`Should refuse a password longer than bcrypt hashes`, async () => {
            const res = await server
                .post(`/users/${uuids.userUuid}/password`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({password: "x".repeat(73)});
            expect(res).to.exist;
            expect(res.status).to.equal(400);
        });

        it(`Should set the password of the user of uuid ${uuids.userUuid}`, async () => {
            const res = await server
                .post(`/users/${uuids.userUuid}/password`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({password: newPassword});
            expect(res).to.exist;
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property("uuid", uuids.userUuid);
            // The hash must never travel back out with the user.
            expect(res.body).to.not.have.property("password");
        });

        it(`Should sign in with the password that was just set`, async () => {
            const res = await server
                .post(`/login/signin/`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                // The username was changed by the PATCH above.
                .send({
                    username: `test_user_${uuids.userUuid}_updated`,
                    password: newPassword,
                });
            expect(res).to.exist;
            expect(res.status).to.equal(200);
        });

        it(`Should no longer sign in with the password it replaced`, async () => {
            const res = await server
                .post(`/login/signin/`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .send({
                    username: `test_user_${uuids.userUuid}_updated`,
                    password: `test_user_${uuids.userUuid}`,
                });
            expect(res).to.exist;
            expect(res.status).to.equal(401);
        });

        it(`Should refuse a caller who is not an administrator`, async () => {
            // A user of no group at all: whatever rights the fixtures hand out,
            // being an administrator is not among them.
            const plainUuid = uuidv4();
            uuids.plainUserUuid = plainUuid;
            await server
                .post(`/login/signup/`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({
                    uuid: plainUuid,
                    name: "Plain user",
                    username: `plain_user_${plainUuid}`,
                    password: `plain_user_${plainUuid}`,
                });

            const signin = await server
                .post(`/login/signin/`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .send({
                    username: `plain_user_${plainUuid}`,
                    password: `plain_user_${plainUuid}`,
                });
            expect(signin.status).to.equal(200);

            const res = await server
                .post(`/users/${uuids.userUuid}/password`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + signin.body)
                .send({password: "should_not_be_set"});
            expect(res).to.exist;
            expect(res.status).to.equal(403);
        });

        it(`Should refuse to set the password of a user that does not exist`, async () => {
            const res = await server
                .post(`/users/${uuidv4()}/password`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({password: newPassword});
            expect(res).to.exist;
            expect(res.status).to.equal(404);
        });
    });

    describe("POST own password reset", () => {
        // The password the admin-only endpoint above left in force.
        const currentPassword = "a_new_password";
        const resetPassword = "a_reset_password";
        const login = `test_user_${uuids.userUuid}_updated`;

        it(`Should refuse a reset with the wrong current password`, async () => {
            const res = await server
                .post(`/login/password`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .send({
                    username: login,
                    current_password: "not_the_current_password",
                    new_password: resetPassword,
                });
            expect(res).to.exist;
            expect(res.status).to.equal(401);
        });

        it(`Should answer an unknown username exactly as a wrong password`, async () => {
            const res = await server
                .post(`/login/password`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .send({
                    username: `no_such_user_${uuidv4()}`,
                    current_password: currentPassword,
                    new_password: resetPassword,
                });
            expect(res).to.exist;
            // Same status and same message, or this endpoint becomes a way to
            // find out which accounts exist.
            expect(res.status).to.equal(401);
            expect(res.body).to.have.property("error", "Wrong password or username");
        });

        it(`Should refuse a reset that carries no new password`, async () => {
            const res = await server
                .post(`/login/password`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .send({username: login, current_password: currentPassword});
            expect(res).to.exist;
            expect(res.status).to.equal(400);
        });

        it(`Should refuse a reset that carries no username`, async () => {
            const res = await server
                .post(`/login/password`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .send({current_password: currentPassword, new_password: resetPassword});
            expect(res).to.exist;
            expect(res.status).to.equal(400);
        });

        it(`Should reset the password without any token at all`, async () => {
            const res = await server
                .post(`/login/password`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .send({
                    username: login,
                    current_password: currentPassword,
                    new_password: resetPassword,
                });
            expect(res).to.exist;
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property("uuid", uuids.userUuid);
            expect(res.body).to.not.have.property("password");
        });

        it(`Should sign in with the password the reset put in force`, async () => {
            const res = await server
                .post(`/login/signin/`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .send({username: login, password: resetPassword});
            expect(res).to.exist;
            expect(res.status).to.equal(200);
        });

        it(`Should no longer sign in with the password the reset replaced`, async () => {
            const res = await server
                .post(`/login/signin/`)
                .set("content-type", "application/json")
                .set("accept", "application/json")
                .send({username: login, password: currentPassword});
            expect(res).to.exist;
            expect(res.status).to.equal(401);
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
