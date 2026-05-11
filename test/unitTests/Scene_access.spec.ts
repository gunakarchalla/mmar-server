import chai from "chai";
import chaiHttp from "chai-http";
import "mocha";
import { PoolClient } from "pg";
import { v4 as uuidv4 } from "uuid";
import { TestEnvironmentSetup } from "./TestEnvironmentSetup";

process.env.NODE_ENV = "test";
chai.use(chaiHttp);
const expect = chai.expect;
const API_URL = "http://localhost:8000";
const TIMEOUT = 30000;
const server = chai.request(API_URL);

describe("Scene instance access management tests", function () {
    this.timeout(TIMEOUT);
    const setup = TestEnvironmentSetup.getInstance(API_URL);

    let token: string;
    let client: PoolClient;

    const uuids = {
        sceneTypeUuid: uuidv4(),
        sceneInstanceUuid: uuidv4(),
        secondUserUuid: uuidv4(),
    };
    const secondUsername = `test_access_user_${uuids.secondUserUuid}`;
    const secondPassword = `pw_${uuids.secondUserUuid}`;
    let secondUserToken: string;
    let adminUuid: string;

    before(async () => {
        ({ client, token } = await setup.setupTestEnvironment());

        // Fetch admin UUID via /users/byUsername/admin
        const adminRes = await server
            .get("/users/byUsername/admin")
            .set("Cookie", "authcookie=" + token);
        adminUuid = adminRes.body.uuid;

        // Create a scene type and scene instance for access tests
        await server
            .post("/metamodel/sceneTypes")
            .set("content-type", "application/json")
            .set("Cookie", "authcookie=" + token)
            .send({
                uuid: uuids.sceneTypeUuid,
                name: "Access test scenetype",
            });

        await server
            .post(`/instances/sceneTypes/${uuids.sceneTypeUuid}/sceneInstances`)
            .set("content-type", "application/json")
            .set("Cookie", "authcookie=" + token)
            .send({
                uuid: uuids.sceneInstanceUuid,
                uuid_scene_type: uuids.sceneTypeUuid,
                name: "Access test scene instance",
            });

        // Create a second user to test 403 (non-delete-owner)
        await server
            .post("/login/signup/")
            .set("content-type", "application/json")
            .set("Cookie", "authcookie=" + token)
            .send({
                uuid: uuids.secondUserUuid,
                name: "Access test user",
                username: secondUsername,
                password: secondPassword,
            });

        const signinRes = await server
            .post("/login/signin/")
            .set("content-type", "application/json")
            .send({ username: secondUsername, password: secondPassword });
        secondUserToken = signinRes.body;
    });

    after(async () => {
        await setup.tearDown(client, [
            uuids.sceneTypeUuid,
            uuids.sceneInstanceUuid,
            uuids.secondUserUuid,
        ]);
    });

    // -------------------------------------------------------------------------
    // 401 — no JWT
    // -------------------------------------------------------------------------

    describe("401 without JWT", () => {
        it("GET /access returns 401 without token", async () => {
            const res = await server.get(
                `/instances/sceneInstances/${uuids.sceneInstanceUuid}/access`
            );
            expect(res.status).to.equal(401);
        });

        it("GET /access/me returns 401 without token", async () => {
            const res = await server.get(
                `/instances/sceneInstances/${uuids.sceneInstanceUuid}/access/me`
            );
            expect(res.status).to.equal(401);
        });

        it("POST /access returns 401 without token", async () => {
            const res = await server
                .post(`/instances/sceneInstances/${uuids.sceneInstanceUuid}/access`)
                .send({ uuid_user: adminUuid, access: "read" });
            expect(res.status).to.equal(401);
        });

        it("PATCH /access/:uuid_user returns 401 without token", async () => {
            const res = await server
                .patch(
                    `/instances/sceneInstances/${uuids.sceneInstanceUuid}/access/${adminUuid}`
                )
                .send({ access: "read" });
            expect(res.status).to.equal(401);
        });

        it("DELETE /access/:uuid_user returns 401 without token", async () => {
            const res = await server.delete(
                `/instances/sceneInstances/${uuids.sceneInstanceUuid}/access/${adminUuid}`
            );
            expect(res.status).to.equal(401);
        });

        it("GET /users/byUsername/:username returns 401 without token", async () => {
            const res = await server.get("/users/byUsername/admin");
            expect(res.status).to.equal(401);
        });
    });

    // -------------------------------------------------------------------------
    // 403 — authenticated but not a delete-owner
    // -------------------------------------------------------------------------

    describe("403 for non-delete-owner", () => {
        it("GET /access returns 403 for non-delete-owner", async () => {
            const res = await server
                .get(
                    `/instances/sceneInstances/${uuids.sceneInstanceUuid}/access`
                )
                .set("Cookie", "authcookie=" + secondUserToken);
            expect(res.status).to.equal(403);
        });

        it("POST /access returns 403 for non-delete-owner", async () => {
            const res = await server
                .post(
                    `/instances/sceneInstances/${uuids.sceneInstanceUuid}/access`
                )
                .set("content-type", "application/json")
                .set("Cookie", "authcookie=" + secondUserToken)
                .send({ uuid_user: uuids.secondUserUuid, access: "read" });
            expect(res.status).to.equal(403);
        });

        it("PATCH /access/:uuid_user returns 403 for non-delete-owner", async () => {
            const res = await server
                .patch(
                    `/instances/sceneInstances/${uuids.sceneInstanceUuid}/access/${adminUuid}`
                )
                .set("content-type", "application/json")
                .set("Cookie", "authcookie=" + secondUserToken)
                .send({ access: "read" });
            expect(res.status).to.equal(403);
        });

        it("DELETE /access/:uuid_user returns 403 for non-delete-owner", async () => {
            const res = await server
                .delete(
                    `/instances/sceneInstances/${uuids.sceneInstanceUuid}/access/${adminUuid}`
                )
                .set("Cookie", "authcookie=" + secondUserToken);
            expect(res.status).to.equal(403);
        });
    });

    // -------------------------------------------------------------------------
    // 200 — delete-owner (admin) happy path
    // -------------------------------------------------------------------------

    describe("200 for delete-owner", () => {
        it("GET /access returns 200 and lists admin as delete-owner", async () => {
            const res = await server
                .get(
                    `/instances/sceneInstances/${uuids.sceneInstanceUuid}/access`
                )
                .set("Cookie", "authcookie=" + token);
            expect(res.status).to.equal(200);
            expect(res.body).to.be.an("array");
            const adminEntry = res.body.find(
                (r: { uuid_user: string }) => r.uuid_user === adminUuid
            );
            expect(adminEntry).to.exist;
            expect(adminEntry.delete_access).to.equal(true);
        });

        it("GET /access/me returns 200 with level=delete for admin", async () => {
            const res = await server
                .get(
                    `/instances/sceneInstances/${uuids.sceneInstanceUuid}/access/me`
                )
                .set("Cookie", "authcookie=" + token);
            expect(res.status).to.equal(200);
            expect(res.body).to.deep.equal({ level: "delete" });
        });

        it("GET /access/me returns 200 with level=null for non-member", async () => {
            const res = await server
                .get(
                    `/instances/sceneInstances/${uuids.sceneInstanceUuid}/access/me`
                )
                .set("Cookie", "authcookie=" + secondUserToken);
            expect(res.status).to.equal(200);
            expect(res.body).to.deep.equal({ level: null });
        });

        it("POST /access grants read access to second user", async () => {
            const res = await server
                .post(
                    `/instances/sceneInstances/${uuids.sceneInstanceUuid}/access`
                )
                .set("content-type", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({ uuid_user: uuids.secondUserUuid, access: "read" });
            expect(res.status).to.equal(200);
            expect(res.body).to.include({
                uuid_user: uuids.secondUserUuid,
                read_access: true,
                edit_access: false,
                delete_access: false,
            });
        });

        it("GET /access/me returns level=read after being granted read", async () => {
            const res = await server
                .get(
                    `/instances/sceneInstances/${uuids.sceneInstanceUuid}/access/me`
                )
                .set("Cookie", "authcookie=" + secondUserToken);
            expect(res.status).to.equal(200);
            expect(res.body).to.deep.equal({ level: "read" });
        });

        it("PATCH /access/:uuid_user upgrades second user to edit", async () => {
            const res = await server
                .patch(
                    `/instances/sceneInstances/${uuids.sceneInstanceUuid}/access/${uuids.secondUserUuid}`
                )
                .set("content-type", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({ access: "edit" });
            expect(res.status).to.equal(200);
            expect(res.body).to.include({
                uuid_user: uuids.secondUserUuid,
                read_access: true,
                edit_access: true,
                delete_access: false,
            });
        });

        it("DELETE /access/:uuid_user removes second user", async () => {
            const res = await server
                .delete(
                    `/instances/sceneInstances/${uuids.sceneInstanceUuid}/access/${uuids.secondUserUuid}`
                )
                .set("Cookie", "authcookie=" + token);
            expect(res.status).to.equal(200);
            expect(res.body).to.deep.equal({
                uuid_user: uuids.secondUserUuid,
            });
        });
    });

    // -------------------------------------------------------------------------
    // 400 — invalid access level
    // -------------------------------------------------------------------------

    describe("400 for invalid access level", () => {
        it("POST /access with invalid level returns 400", async () => {
            const res = await server
                .post(
                    `/instances/sceneInstances/${uuids.sceneInstanceUuid}/access`
                )
                .set("content-type", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({ uuid_user: uuids.secondUserUuid, access: "superadmin" });
            expect(res.status).to.equal(400);
        });
    });

    // -------------------------------------------------------------------------
    // 409 — last delete-owner removal blocked
    // -------------------------------------------------------------------------

    describe("409 on last-delete-owner removal", () => {
        it("DELETE last delete-owner returns 409", async () => {
            const res = await server
                .delete(
                    `/instances/sceneInstances/${uuids.sceneInstanceUuid}/access/${adminUuid}`
                )
                .set("Cookie", "authcookie=" + token);
            expect(res.status).to.equal(409);
        });

        it("PATCH last delete-owner to non-delete returns 409", async () => {
            const res = await server
                .patch(
                    `/instances/sceneInstances/${uuids.sceneInstanceUuid}/access/${adminUuid}`
                )
                .set("content-type", "application/json")
                .set("Cookie", "authcookie=" + token)
                .send({ access: "read" });
            expect(res.status).to.equal(409);
        });
    });

    // -------------------------------------------------------------------------
    // /users/byUsername lookup
    // -------------------------------------------------------------------------

    describe("GET /users/byUsername/:username", () => {
        it("returns user data for an existing username", async () => {
            const res = await server
                .get("/users/byUsername/admin")
                .set("Cookie", "authcookie=" + token);
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property("uuid");
            expect(res.body).to.have.property("username", "admin");
            expect(res.body).to.have.property("displayname");
            expect(res.body).to.not.have.property("password");
            expect(res.body).to.not.have.property("salt");
        });

        it("returns 404 for a non-existent username", async () => {
            const res = await server
                .get("/users/byUsername/no_such_user_xyz_404")
                .set("Cookie", "authcookie=" + token);
            expect(res.status).to.equal(404);
        });
    });
});
