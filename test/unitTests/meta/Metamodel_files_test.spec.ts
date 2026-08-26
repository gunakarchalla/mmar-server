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
const TIMEOUT = 60000;
const server = chai.request(API_URL);

/**
 * @description - No test covered any file endpoint before this, which is how
 * Metamodel_files.connection could go on opening and committing transactions on
 * the client its caller handed it: the inner COMMIT ended the controller's
 * transaction early, so nothing the handler did afterwards was covered by it and
 * a later failure could not roll the write back. Removing that is invisible to
 * every other spec.
 *
 * These cover the round trip - upload, read the bytes back, patch, list, delete -
 * and the two responses that changed shape with it.
 */
describe("Metamodel files", function () {
    this.timeout(TIMEOUT);
    const setup = TestEnvironmentSetup.getInstance(API_URL);

    let token: string;
    let client: PoolClient;

    const uuids = {
        fileUuid: uuidv4(),
        generatedFileUuid: "",
    };

    // A one pixel PNG, so the payload is a real binary body rather than text.
    const PNG = Buffer.from(
        "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489" +
        "0000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082",
        "hex"
    );

    const auth = <T extends { set: (k: string, v: string) => T }>(request: T): T =>
        request.set("Cookie", "authcookie=" + token);

    before(async () => {
        ({ client, token } = await setup.setupTestEnvironment());
    });

    it("uploads a file at a chosen uuid and answers 201", async () => {
        const res = await auth(server.post(`/metamodel/files/${uuids.fileUuid}`))
            .attach("file", PNG, "pixel.png");

        expect(res.status).to.equal(201);
        expect(res.body).to.have.property("url");
        expect(res.body.url).to.contain(uuids.fileUuid);
    });

    it("reads the bytes back under the uploaded content type", async () => {
        const res = await auth(server.get(`/metamodel/files/${uuids.fileUuid}`))
            .buffer()
            .parse((r, cb) => {
                const chunks: Buffer[] = [];
                r.on("data", (c: Buffer) => chunks.push(c));
                r.on("end", () => cb(null, Buffer.concat(chunks)));
            });

        expect(res.status).to.equal(200);
        expect(res.header["content-type"]).to.contain("image/png");
        // The handler writes the response itself; what matters is that the bytes
        // survive the round trip rather than being JSON-encoded on the way out.
        expect(Buffer.compare(res.body as Buffer, PNG)).to.equal(0);
    });

    it("lists the uploaded file among all files and among all uuids", async () => {
        const all = await auth(server.get("/metamodel/files"));
        expect(all.status).to.equal(200);
        expect(all.body).to.be.an("array");
        expect(all.body.map((f: { uuid: string }) => f.uuid)).to.contain(uuids.fileUuid);

        const allUuids = await auth(server.get("/metamodel/files/alluuids"));
        expect(allUuids.status).to.equal(200);
        expect(allUuids.body.uuids).to.contain(uuids.fileUuid);
    });

    it("patches the file and keeps the same uuid", async () => {
        const OTHER = Buffer.from("hello mmar", "utf8");
        const res = await auth(server.patch(`/metamodel/files/${uuids.fileUuid}`))
            .attach("file", OTHER, "note.txt");

        expect(res.status).to.equal(200);
        expect(res.body.url).to.contain(uuids.fileUuid);

        const read = await auth(server.get(`/metamodel/files/${uuids.fileUuid}`))
            .buffer()
            .parse((r, cb) => {
                const chunks: Buffer[] = [];
                r.on("data", (c: Buffer) => chunks.push(c));
                r.on("end", () => cb(null, Buffer.concat(chunks)));
            });
        expect(Buffer.compare(read.body as Buffer, OTHER)).to.equal(0);
    });

    it("uploads without a uuid and answers 201 with the one it generated", async () => {
        const res = await auth(server.post("/metamodel/files"))
            .attach("file", PNG, "pixel.png");

        expect(res.status).to.equal(201);
        expect(res.body).to.have.property("uuid");
        expect(res.body.url).to.contain(res.body.uuid);
        uuids.generatedFileUuid = res.body.uuid;
    });

    it("deletes a file and answers with the uuids it deleted", async () => {
        const res = await auth(server.delete(`/metamodel/files/${uuids.generatedFileUuid}`));

        expect(res.status).to.equal(200);
        // Every other delete in the API answers with the uuids it removed; this
        // one used to answer a prose confirmation as text/plain.
        expect(res.body).to.be.an("array");
        expect(res.body).to.contain(uuids.generatedFileUuid);

        const gone = await auth(server.get("/metamodel/files/alluuids"));
        expect(gone.body.uuids).to.not.contain(uuids.generatedFileUuid);
    });

    it("refuses a patch carrying no content and creates nothing", async () => {
        // Note what this does NOT prove. The data layer used to open and commit
        // its own transaction on the client the controller handed it, so one
        // upload issued four BEGINs and four COMMITs and the controller's
        // rollback could not undo what the inner commit had already made
        // durable. That is fixed, but no request on this surface writes and then
        // fails, so no black box test can show it. It was measured instead, with
        // test/read_equivalence/pg_query_log.js: the same upload issues one BEGIN
        // and one COMMIT now. See state.json, phase 6.
        const absent = uuidv4();
        const res = await auth(server.patch(`/metamodel/files/${absent}`))
            .set("content-type", "application/json")
            .send({});

        expect(res.status).to.be.oneOf([400, 403, 404, 500]);

        const allUuids = await auth(server.get("/metamodel/files/alluuids"));
        expect(allUuids.body.uuids).to.not.contain(absent);
    });

    after(async function () {
        await setup.tearDown(client, [uuids.fileUuid, uuids.generatedFileUuid].filter(Boolean));
    });
});
