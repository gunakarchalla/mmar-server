import chai from "chai";
import chaiHttp from "chai-http";
import "mocha";
import { v4 as uuidv4 } from "uuid";
import { TestEnvironmentSetup } from "./TestEnvironmentSetup";
import { PoolClient } from "pg";

process.env.NODE_ENV = "test";

chai.use(chaiHttp);
const expect = chai.expect;
const TIMEOUT = 30000;
const API_URL = "http://localhost:8000";
describe("Instance custom rule tests", function () {
  const server = chai.request(API_URL);
  const setup = TestEnvironmentSetup.getInstance(API_URL);
  this.timeout(TIMEOUT);
  let token: string;
  let client: PoolClient;

  const uuids = {
    sceneTypeUuid: uuidv4(),
    ruleUuid: uuidv4(),
    testUserUuid: uuidv4(),
  };
  before(async () => {
    ({ client, token } = await setup.setupTestEnvironment());
  });

  after(async () => {
    await setup.tearDown(client, Object.values(uuids));
  });

  describe("Scene instance custom rules", function () {
    it("Should return an error 403", async () => {
      await server
        .post(`/login/signup/`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          name: "Test user rights",
          username: `test_user_3_${uuids.testUserUuid}`,
          password: `test_user_3_${uuids.testUserUuid}`,
        });
      token = await server
        .post("/login/signin")
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .send({
          username: `test_user_3_${uuids.testUserUuid}`,
          password: `test_user_3_${uuids.testUserUuid}`,
        })
        .then((res) => {
          return res.body;
        });
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
      expect(res1.status).to.equal(403);
    });
  });

  describe("metaobject generic constraint rules", () => {
    it("Should get the constraint", async () => {
      token = await server
        .post("/login/signin")
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .send({
          username: "admin",
          password: "admin",
        })
        .then((res) => {
          return res.body;
        });
      const respost = await server
        .post("/metamodel/sceneTypes")
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.sceneTypeUuid,
          name: "BPMN Diagram",
          description: "This is a BPMN metamodel",
        });
      expect(respost).to.exist;
      expect(respost.status).to.equal(200);

      const test = await server
        .post(`/metamodel/rules/${uuids.ruleUuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          name: "test rule",
          value: "test value",
          uuid: uuids.ruleUuid,
          assigned_uuid_metaobject: uuids.sceneTypeUuid,
        });
      expect(test).to.exist;
      expect(test.status).to.equal(200);

      const res1 = await server
        .get(`/metamodel/rules/${uuids.ruleUuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);

      expect(res1).to.exist;
      expect(res1.status).to.equal(200);
    });

    it("Should delete the constraint", async () => {
      const res1 = await server
        .get(`/metamodel/rules/${uuids.ruleUuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);

      expect(res1).to.exist;
      expect(res1.status).to.equal(200);
    });
  });
});
