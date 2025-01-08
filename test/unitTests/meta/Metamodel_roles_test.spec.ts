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
const server = chai.request(API_URL);

describe("Metamodel roles tests", function () {
  this.timeout(TIMEOUT);
  const setup = TestEnvironmentSetup.getInstance(API_URL);

  let token: string;

  let client: PoolClient;

  const uuids = {
    roleUuid: uuidv4(),
    portUuid: uuidv4(),
    sceneTypeUuid: uuidv4(),
    roleUuid2: uuidv4(),
    sceneTypeUuid2: uuidv4(),
    roleUuid3: uuidv4(),
    portUuid3: uuidv4(),
    relationClassUuid: uuidv4(),
    roleUuid4: uuidv4(),
    classUuid5: uuidv4(),
    relationClassUuid3: uuidv4(),
    roleUuid5: uuidv4(),
    roleUuid6: uuidv4(),
    relationClassUuid2: uuidv4(),
    roleUuid7: uuidv4(),
    roleUuid8: uuidv4(),
    relationClassUuid4: uuidv4(),
    roleUuid9: uuidv4(),
    roleUuid10: uuidv4(),
    classUuid6: uuidv4(),
    relationClassUuid5: uuidv4(),
    roleInstanceUuid: uuidv4(),
    roleUuid11: uuidv4(),
    attributeTypeUuid: uuidv4(),
    classUuidRoleRel: uuidv4(),
    roleUuidRoleRel: uuidv4(),
  };

  before(async () => {
    ({ client, token } = await setup.setupTestEnvironment());
  });

  after(async () => {
    await setup.tearDown(client, Object.values(uuids));
  });

  describe("POST Metamodel roles", () => {
    it(`Should post and return the role of uuid ${uuids.roleUuid}`, async () => {
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
      await server
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
      const res1 = await server
        .post(`/metamodel/roles/${uuids.roleUuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.roleUuid,
          name: "subsequent_from_port",
          port_references: [
            {
              uuid: uuids.portUuid,
              min: 1,
              max: 1,
            },
          ],
        });
      expect(res1).to.exist;
      expect(res1.status).to.equal(201);
      expect(res1.body).to.deep.include({
        uuid: uuids.roleUuid,
        name: "subsequent_from_port",
        port_references: [
          {
            uuid: uuids.portUuid,
            min: 1,
            max: 1,
          },
        ],
      });
    });
  });

  describe("GET Metamodel roles", () => {
    it(`Should return the role of uuid ${uuids.roleUuid}`, async () => {
      const res1 = await server
        .get(`/metamodel/roles/${uuids.roleUuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(res1).to.exist;
      expect(res1.status).to.equal(200);
      expect(res1.body).to.deep.include({
        uuid: uuids.roleUuid,
        name: "subsequent_from_port",
        port_references: [
          {
            uuid: uuids.portUuid,
            min: 1,
            max: 1,
          },
        ],
      });
    });
  });

  describe("DELETE Metamodel roles", () => {
    it(`Should delete the role ${uuids.roleUuid2} but not the scenetype`, async () => {
      await server
        .post("/metamodel/sceneTypes")
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.sceneTypeUuid2,
          name: "BPMN Diagram",
          description: "This is a BPMN metamodel",
        });
      await server
        .post(`/metamodel/sceneTypes/${uuids.sceneTypeUuid2}/roles`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.roleUuid2,
          name: "subsequent_from_port",
          scenetype_references: [
            {
              uuid: uuids.sceneTypeUuid2,
              min: 1,
              max: 1,
            },
          ],
        });

      const res1 = await server
        .delete(`/metamodel/roles/${uuids.roleUuid2}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);

      expect(res1).to.exist;
      expect(res1.status).to.equal(200);
      expect(res1.body).to.contain(uuids.roleUuid2);
    });

    it(`Should restrict the deletion of the scenetype ${uuids.sceneTypeUuid2} because of the attribute type reference`, async () => {
      const res1 = await server
        .post(`/metamodel/attributeTypes/${uuids.attributeTypeUuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.attributeTypeUuid,
          name: "String",
          pre_defined: true,
          role: {
            uuid: uuids.roleUuid11,
            name: "role_to_scene",
            scenetype_references: [
              {
                uuid: uuids.sceneTypeUuid2,
                min: 1,
                max: 1,
              },
            ],
          },
          regex_value:
            "^([\\x09\\x0A\\x0D\\x20-\\x7E]|[\\xC2-\\xDF][\\x80-\\xBF]|\\xE0[\\xA0-\\xBF][\\x80-\\xBF]|[\\xE1-\\xEC\\xEE\\xEF][\\x80-\\xBF]{2}|\\xED[\\x80-\\x9F][\\x80-\\xBF]|\\xF0[\\x90-\\xBF][\\x80-\\xBF]{2}|[\\xF1-\\xF3][\\x80-\\xBF]{3}|\\xF4[\\x80-\\x8F][\\x80-\\xBF]{2})*$",
        });
      expect(res1).to.exist;
      expect(res1.status).to.equal(201);

      const resDel = await server
        .delete(`/metamodel/sceneTypes/${uuids.sceneTypeUuid2}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);

      expect(resDel).to.exist;
      expect(resDel.status).to.equal(409);
      expect(resDel.body).to.contain(uuids.roleUuid11);
    });

    it(`Should delete the role ${uuids.roleUuid3} but not the port`, async () => {
      await server
        .post(`/metamodel/ports/${uuids.portUuid3}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.portUuid3,
          name: "test port",
        });
      await server
        .post(`/metamodel/relationClasses/${uuids.relationClassUuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          name: "test relationclass",
          uuid: uuids.relationClassUuid,
          description: "This is a test relationclass",
          role_from: {
            uuid: uuids.roleUuid2,
            name: "test_role_from",
          },
          role_to: {
            uuid: uuids.roleUuid2,
          },
        });

      await server
        .post(`/metamodel/relationClasses/${uuids.relationClassUuid}/roles`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send([
          {
            uuid: uuids.roleUuid3,
            name: "role_to_test",
            port_references: [
              {
                uuid: uuids.portUuid3,
                min: 1,
                max: 1,
              },
            ],
          },
        ]);

      const res1 = await server
        .delete(`/metamodel/roles/${uuids.roleUuid3}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);

      expect(res1).to.exist;
      expect(res1.status).to.equal(200);
      expect(res1.body).to.contain(uuids.roleUuid3);
      expect(res1.body).to.not.contain(uuids.portUuid3);
    });

    it(`Should delete the role ${uuids.roleUuid4} but not the class`, async () => {
      await server
        .post(`/metamodel/classes/${uuids.classUuid5}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.classUuid5,
          name: "test class",
          is_reusable: true,
          is_abstract: false,
        });
      await server
        .post(`/metamodel/classes/${uuids.classUuidRoleRel}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.classUuid5,
          name: "test class",
          is_reusable: true,
          is_abstract: false,
        });
      await server
        .post(`/metamodel/relationClasses/${uuids.relationClassUuid3}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          name: "test relationclass",
          description: "This is a test relationclass",
          role_from: {
            uuid: uuids.roleUuid4,
            name: "test_role_from",
          },
          role_to: {
            uuid: uuids.roleUuid4,
          },
        });

      await server
        .post(`/metamodel/relationClasses/${uuids.relationClassUuid}/roles`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send([
          {
            uuid: uuids.roleUuidRoleRel,
            name: "role_to_test",
            class_references: [
              {
                uuid: uuids.classUuidRoleRel,
                min: 1,
                max: 1,
              },
            ],
          },
        ]);

      const res1 = await server
        .delete(`/metamodel/roles/${uuids.roleUuidRoleRel}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);

      expect(res1).to.exist;
      expect(res1.status).to.equal(200);
      expect(res1.body).to.contain(uuids.roleUuidRoleRel);
      expect(res1.body).to.not.contain(uuids.classUuid5);
    });

    it(`Should delete the role ${uuids.roleUuid6} but not the relationclass`, async () => {
      await server
        .post("/metamodel/sceneTypes")
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.sceneTypeUuid2,
          name: "BPMN Diagram",
          description: "This is a BPMN metamodel",
        });
      await server
        .post(`/metamodel/relationClasses/${uuids.relationClassUuid2}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          name: "test relationclass",
          description: "This is a test relationclass",
          role_from: {
            uuid: uuids.roleUuid5,
            name: "test_role_from",
          },
          role_to: {
            uuid: uuids.roleUuid5,
            name: "test_role_to",
          },
        });
      await server
        .post(`/metamodel/relationClasses/${uuids.relationClassUuid2}/roles`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send([
          {
            uuid: uuids.roleUuid6,
            name: "role_to_test",
            relationclass_references: [
              {
                uuid: uuids.relationClassUuid2,
                min: 1,
                max: 1,
              },
            ],
          },
        ]);

      const res1 = await server
        .delete(`/metamodel/roles/${uuids.roleUuid6}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);

      expect(res1).to.exist;
      expect(res1.status).to.equal(200);
      expect(res1.body).to.contain(uuids.roleUuid6);
      expect(res1.body).to.not.contain(uuids.relationClassUuid2);
    });

    it(`Should restrict the deletion and return the instance uuid ${uuids.roleInstanceUuid}`, async () => {
      await server
        .post(`/metamodel/classes/${uuids.classUuid6}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.classUuid6,
          name: "test class",
          is_reusable: true,
          is_abstract: false,
        });
      await server
        .post(`/metamodel/relationClasses/${uuids.relationClassUuid5}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          name: "test relationclass",
          description: "This is a test relationclass",
          role_from: {
            uuid: uuids.roleUuid9,
            name: "test_role_from",
          },
          role_to: {
            uuid: uuids.roleUuid9,
          },
        });
      await server
        .post(`/metamodel/relationClasses/${uuids.relationClassUuid5}/roles`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send([
          {
            uuid: uuids.roleUuid10,
            name: "role_to_test",
            class_references: [
              {
                uuid: uuids.classUuid6,
                min: 1,
                max: 1,
              },
            ],
          },
        ]);

      await server
        .post(`/instances/rolesInstances/${uuids.roleInstanceUuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          name: "test role instance",
          uuid: uuids.roleInstanceUuid,
          uuid_role: uuids.roleUuid10,
        });

      const res1 = await server
        .delete(`/metamodel/roles/${uuids.roleUuid10}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);

      expect(res1).to.exist;
      expect(res1.status).to.equal(409);
      expect(res1.text).to.contain(uuids.roleInstanceUuid);
    });

    it(`Should delete and return the uuid ${uuids.roleUuid}`, async () => {
      const res1 = await server
        .delete(`/metamodel/roles/${uuids.roleUuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(res1).to.exist;
      expect(res1.status).to.equal(200);
      expect(res1.body).to.deep.include(
        uuids.roleUuid,
        "Should return the uuid of the deleted role",
      );
    });
  });
});
