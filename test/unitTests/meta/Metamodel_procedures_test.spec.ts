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
const TIMEOUT = 30000;

describe("Metamodel procedures tests", function () {
  const server = chai.request(API_URL);
  const setup = TestEnvironmentSetup.getInstance(API_URL);

  this.timeout(TIMEOUT);
  let token: string;

  let client: PoolClient;

  const uuids = {
    procedureUuid: uuidv4(),
    procedureUuid2: uuidv4(),
    sceneTypeUuid: uuidv4(),
  };
  before(async () => {
    ({ client, token } = await setup.setupTestEnvironment());
  });

  after(async () => {
    await setup.tearDown(client, Object.values(uuids));
  });

  describe("POST Metamodel procedure", function () {
    it(`Should post and return the procedure of uuid ${uuids.procedureUuid}`, async () => {
      const res1 = await server
        .post(`/metamodel/procedures/${uuids.procedureUuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.procedureUuid,
          name: "Procedure_test",
          description: "This is a test procedure",
          definition: "test algorithm",
          geometry: "function vizRep(gc) {}",
        });
      expect(res1).to.exist;
      expect(res1.status).to.equal(201);
      expect(res1.body).to.deep.includes({
        uuid: uuids.procedureUuid,
        name: "Procedure_test",
        description: "This is a test procedure",
        definition: "test algorithm",
        geometry: "function vizRep(gc) {}",
      });
    });
    it(`Should post and return the procedure of uuid ${uuids.procedureUuid2} for the sceneType ${uuids.sceneTypeUuid}`, async () => {
      await server
        .post("/metamodel/sceneTypes")
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.sceneTypeUuid,
          name: "Test sceneType",
          description: "This is a test metamodel",
        });
      const res1 = await server
        .post(`/metamodel/sceneTypes/${uuids.sceneTypeUuid}/procedures`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.procedureUuid2,
          name: "Procedure_test2",
          description: "This is a test procedure2",
          definition: "test algorithm2",
          geometry: "function vizRep(gc) {}",
        });
      expect(res1).to.exist;
      expect(res1.status).to.equal(201);
      expect(res1.body.pop()).to.deep.includes({
        uuid: uuids.procedureUuid2,
        name: "Procedure_test2",
        description: "This is a test procedure2",
        definition: "test algorithm2",
        geometry: "function vizRep(gc) {}",
      });
    });
  });

  describe("GET Metamodel procedure", function () {
    it(`Should return the procedure of uuid ${uuids.procedureUuid}`, async () => {
      const res1 = await server
        .get(`/metamodel/procedures/${uuids.procedureUuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(res1).to.exist;
      expect(res1.status).to.equal(200);
      expect(res1.body).to.deep.includes({
        uuid: uuids.procedureUuid,
        name: "Procedure_test",
        description: "This is a test procedure",
        definition: "test algorithm",
        geometry: "function vizRep(gc) {}",
      });
    });

    it(`Should return the procedure of uuid ${uuids.procedureUuid2} for the sceneType ${uuids.sceneTypeUuid}`, async () => {
      const res1 = await server
        .get(`/metamodel/sceneTypes/${uuids.sceneTypeUuid}/procedures/`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(res1).to.exist;
      expect(res1.status).to.equal(200);
      expect(res1.body.pop()).to.deep.includes({
        uuid: uuids.procedureUuid2,
        name: "Procedure_test2",
        description: "This is a test procedure2",
        definition: "test algorithm2",
        geometry: "function vizRep(gc) {}",
      });
    });
  });

  describe("DELETE Metamodel procedure", function () {
    it(`Should delete and return the uuid ${uuids.procedureUuid}`, async () => {
      const res1 = await server
        .delete(`/metamodel/procedures/${uuids.procedureUuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(res1).to.exist;
      expect(res1.status).to.equal(200);
      expect(res1.body).to.deep.include(uuids.procedureUuid);
    });
  });
});
