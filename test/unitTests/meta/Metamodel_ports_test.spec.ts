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

describe("Metamodel ports tests", function () {
  this.timeout(TIMEOUT);
  const server = chai.request(API_URL);
  const setup = TestEnvironmentSetup.getInstance(API_URL);
  let token: string;
  let client: PoolClient;

  const uuids = {
    portUuid: uuidv4(),
    portUuid2: uuidv4(),
    portUuid3: uuidv4(),
    portUuid4: uuidv4(),
    portUuid5: uuidv4(),
    portUuid6: uuidv4(),
    classUuid: uuidv4(),
    attributeUuid: uuidv4(),
    portInstanceUuid: uuidv4(),
    sceneTypeUuid: uuidv4(),
    attributeTypeUuid: uuidv4(),
    relationClassUuid: uuidv4(),
    roleUuid: uuidv4(),
    roleUuidTo: uuidv4(),
    sceneTypeUuid2: uuidv4(),
    portUuid7: uuidv4(),
    sceneInstanceUuid: uuidv4(),
    classUuid2: uuidv4(),
  };
  before(async () => {
    ({ client, token } = await setup.setupTestEnvironment());
  });

  after(async () => {
    await setup.tearDown(client, Object.values(uuids));
  });

  describe("POST Metamodel ports", function () {
    it(`Should post and return the port of uuid ${uuids.portUuid}`, async () => {
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
        .post(`/metamodel/ports/${uuids.portUuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.portUuid,
          name: "Port_for_Task",
          uuid_scene_type: uuids.sceneTypeUuid,
          geometry:
            "function vizRep(gc) {gc.graphic_cube(0.1, 0.1, 0.02, 'red');gc.graphic_text(-0.2, 0, 0.05, 0.05, 0.1, 'port'); return gc.drawVizRepPort()}",
        });
      expect(res1).to.exist;
      expect(res1.status).to.equal(201);
      expect(res1.body).to.deep.include({
        uuid: uuids.portUuid,
        name: "Port_for_Task",
        uuid_scene_type: uuids.sceneTypeUuid,
        geometry:
          "function vizRep(gc) {gc.graphic_cube(0.1, 0.1, 0.02, 'red');gc.graphic_text(-0.2, 0, 0.05, 0.05, 0.1, 'port'); return gc.drawVizRepPort()}",
      });
    });
  });
  describe("GET Metamodel ports", function () {
    it(`Should return the port of uuid ${uuids.portUuid}`, async () => {
      const res1 = await server
        .get(`/metamodel/ports/${uuids.portUuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(res1).to.exist;
      expect(res1.status).to.equal(200);
      expect(res1.body).to.deep.include({
        uuid: uuids.portUuid,
        name: "Port_for_Task",
        uuid_scene_type: uuids.sceneTypeUuid,
        geometry:
          "function vizRep(gc) {gc.graphic_cube(0.1, 0.1, 0.02, 'red');gc.graphic_text(-0.2, 0, 0.05, 0.05, 0.1, 'port'); return gc.drawVizRepPort()}",
      });
    });
  });
  describe("DELETE Metamodel ports", () => {
    it(`Should delete and return the uuid ${uuids.portUuid}`, async () => {
      const res1 = await server
        .delete(`/metamodel/ports/${uuids.portUuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(res1).to.exist;
      expect(res1.status).to.equal(200);
      expect(res1.body).to.deep.include(uuids.portUuid);
      expect(res1.body).not.to.deep.include(uuids.sceneTypeUuid);
    });

    it(`should delete the port ${uuids.portUuid2}`, async () => {
      await server
        .post(`/metamodel/classes/${uuids.classUuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.classUuid,
          name: "test Class",
          description: "This is test class",
        });
      await server
        .post(`/metamodel/ports/${uuids.portUuid2}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.portUuid2,
          name: "port test",
          uuid_class: uuids.classUuid,
        });
      const res1 = await server
        .delete(`/metamodel/ports/${uuids.portUuid2}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(res1).to.exist;
      expect(res1.status).to.equal(200);
      expect(res1.body).to.deep.include(uuids.portUuid2);
      expect(res1.body).not.to.deep.include(uuids.classUuid);
    });

    it(`should delete the port ${uuids.portUuid3} but not the attribute ${uuids.attributeUuid}`, async () => {
      await server
        .post(`/metamodel/classes/${uuids.classUuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.classUuid,
          name: "test Class",
          description: "This is test class",
        });
      await server
        .post(`/metamodel/ports/${uuids.portUuid3}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.portUuid3,
          name: "port test",
          uuid_class: uuids.classUuid,
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
        });
      const res1 = await server
        .delete(`/metamodel/ports/${uuids.portUuid3}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(res1).to.exist;
      expect(res1.status).to.equal(200);
      expect(res1.body).to.deep.include(uuids.portUuid3);
      expect(res1.body).not.to.deep.include(uuids.attributeUuid);
    });

    it(`should restrict the deletion of the port ${uuids.portUuid4}`, async () => {
      const restPort = await server
        .post(`/metamodel/ports/${uuids.portUuid4}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.portUuid4,
          name: "test port",
        });

      expect(restPort).to.exist;
      expect(restPort.status).to.equal(201, "Port was not created");

      const restRel = await server
        .post(`/metamodel/relationClasses/${uuids.relationClassUuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          name: "test relationclass",
          uuid: uuids.relationClassUuid,
          description: "This is a test relationclass",
          role_from: {
            uuid: uuids.roleUuid,
            name: "test_role_from",
            port_references: [
              {
                uuid: uuids.portUuid4,
                min: 1,
                max: 2,
              },
            ],
          },
          role_to: {
            uuid: uuids.roleUuidTo,
            name: "test_role_to",
            port_references: [
              {
                uuid: uuids.portUuid4,
                min: 1,
                max: 2,
              },
            ],
          },
        });

      expect(restRel).to.exist;
      expect(restRel.status).to.equal(201, "RelationClass was not created");

      const res1 = await server
        .delete(`/metamodel/ports/${uuids.portUuid4}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);

      expect(res1).to.exist;
      expect(res1.status).to.equal(409);
      expect(res1.text).to.include(uuids.roleUuid);
      expect(res1.text).to.include(uuids.roleUuidTo);
    });

    it(`Should restrict the deletion and return the uuid ${uuids.portInstanceUuid}`, async () => {
      await server
        .post("/metamodel/sceneTypes")
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.sceneTypeUuid2,
          name: "Test port scene type",
        });
      // create a instance scene
      await server
        .post(`/instances/sceneTypes/${uuids.sceneTypeUuid2}/sceneInstances`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.sceneInstanceUuid,
          uuid_scene_type: uuids.sceneTypeUuid2,
          name: "Test port scene instance",
        });
      // create a meta class
      await server
        .post(`/metamodel/classes/${uuids.classUuid2}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.classUuid2,
          name: "Test class port",
          is_reusable: true,
          is_abstract: false,
          geometry: "bla bla bla",
        });

      // create a meta port
      await server
        .post(`/metamodel/ports/${uuids.portUuid5}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.portUuid5,
          name: "Test meta port",
          uuid_scene_type: uuids.sceneTypeUuid2,
          geometry: "bla bla bla",
        });

      await server
        .post(
          `/instances/sceneInstances/${uuids.sceneInstanceUuid}/portsInstances`,
        )
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send([
          {
            uuid: uuids.portInstanceUuid,
            uuid_port: uuids.portUuid5,
            name: "Test port instance",
            uuid_scene_instance: uuids.sceneInstanceUuid,
            geometry: "bla bla bla",
          },
        ]);

      const res1 = await server
        .delete(`/metamodel/ports/${uuids.portUuid5}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);

      expect(res1).to.exist;
      expect(res1.status).to.equal(409);
      expect(res1.text).to.include(uuids.portInstanceUuid);
    });
  });
});
