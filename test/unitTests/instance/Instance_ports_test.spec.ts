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

describe("Instance ports tests", function () {
  this.timeout(TIMEOUT);
  const setup = TestEnvironmentSetup.getInstance(API_URL);

  let token: string;

  let client: PoolClient;
  const uuids = {
    classInstanceUuid: uuidv4(),
    sceneInstanceUuid: uuidv4(),
    portInstanceUuid: uuidv4(),
    portInstance2Uuid: uuidv4(),
    sceneInstanceUuid2: uuidv4(),
    classInstanceUuid2: uuidv4(),
    portInstanceUuid2: uuidv4(),
    roleInstanceUuid2: uuidv4(),
    attributeInstanceUuid2: uuidv4(),

    attributeUuid2: uuidv4(),
    scenetypeUuid2: uuidv4(),
    portUuid: uuidv4(),
    port2Uuid: uuidv4(),
    portUuid2: uuidv4(),
    sceneTypeUuid: uuidv4(),
    classUuid: uuidv4(),
    classUuid2: uuidv4(),
    attributeTypeUuid2: uuidv4(),
    roleUuid2: uuidv4(),
  };
  before(async () => {
    ({ client, token } = await setup.setupTestEnvironment());
  });

  after(async () => {
    await setup.tearDown(client, Object.values(uuids));
  });

  describe("POST Instance ports", function () {
    it(`Should post and return minimal port for a scene with uuid ${uuids.sceneTypeUuid}`, async () => {
      // create a meta scene type
      await server
        .post("/metamodel/sceneTypes")
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.sceneTypeUuid,
          name: "Test port scene type",
        });
      // create a instance scene
      await server
        .post(`/instances/sceneTypes/${uuids.sceneTypeUuid}/sceneInstances`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.sceneInstanceUuid,
          uuid_scene_type: uuids.sceneTypeUuid,
          name: "Test port scene instance",
        });
      // create a meta class
      await server
        .post(`/metamodel/classes/${uuids.classUuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.classUuid,
          name: "Test class port",
          is_reusable: true,
          is_abstract: false,
          geometry: "bla bla bla",
        });

      // create a meta port
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

      const res1 = await server
        .post(
          `/instances/sceneInstances/${uuids.sceneInstanceUuid}/portsInstances`
        )
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send([
          {
            uuid: uuids.portInstanceUuid,
            uuid_port: uuids.portUuid,
            name: "Test port instance",
            uuid_scene_instance: uuids.sceneInstanceUuid,
            geometry: "bla bla bla",
          },
        ]);

      expect(res1).to.exist;
      expect(res1.status).to.equal(201);
      expect(res1.body[0]).to.deep.include({
        uuid: uuids.portInstanceUuid,
        uuid_port: uuids.portUuid,
        name: "Test port instance",
        uuid_scene_instance: uuids.sceneInstanceUuid,
      });
    });

    it(`Should post and return minimal port for a class with uuid ${uuids.classUuid}`, async () => {
      // create a meta port for a class
      await server
        .post(`/metamodel/ports/${uuids.port2Uuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.port2Uuid,
          name: "Test port for class",
          uuid_scene_type: uuids.sceneTypeUuid,
          uuid_class: uuids.classUuid,
          geometry: "bla bla bla",
        });
      await server
        .post(`/instances/classesInstances/${uuids.classInstanceUuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.classInstanceUuid,
          name: "Test class instance port",
          uuid_class: uuids.classUuid,
        });

      const res1 = await server
        .post(
          `/instances/sceneInstances/${uuids.sceneInstanceUuid}/portsInstances`
        )
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send([
          {
            uuid: uuids.portInstance2Uuid,
            uuid_port: uuids.port2Uuid,
            name: "Test port instance for class",
            uuid_scene_instance: uuids.sceneInstanceUuid,
            uuid_class_instance: uuids.classInstanceUuid,
            geometry: "bla bla bla",
          },
        ]);
      expect(res1).to.exist;
      expect(res1.status).to.equal(201);
      expect(res1.body[0]).to.deep.include({
        uuid: uuids.portInstance2Uuid,
        uuid_port: uuids.port2Uuid,
        name: "Test port instance for class",
        uuid_scene_instance: uuids.sceneInstanceUuid,
        uuid_class_instance: uuids.classInstanceUuid,
      });
    });
  });

  describe("GET Instance ports", function () {
    it(`Should return minimal port with uuid ${uuids.portInstanceUuid}`, async () => {
      const res1 = await server
        .get(`/instances/portsInstances/${uuids.portInstanceUuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(res1).to.exist;
      expect(res1.status).to.equal(200);
      expect(res1.body).to.deep.include({
        uuid: uuids.portInstanceUuid,
        uuid_port: uuids.portUuid,
        name: "Test port instance",
        uuid_scene_instance: uuids.sceneInstanceUuid,
      });
    });

    it("Should get all the ports for a scene", async () => {
      const res1 = await server
        .get(
          `/instances/sceneInstances/${uuids.sceneInstanceUuid}/portsInstances`
        )
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(res1).to.exist;
      expect(res1.status).to.equal(200);
      expect(res1.body[0]).to.deep.include({
        uuid: uuids.portInstanceUuid,
        uuid_port: uuids.portUuid,
        name: "Test port instance",
        uuid_scene_instance: uuids.sceneInstanceUuid,
      });
    });
  });

  describe("DELETE Instance ports", function () {
    it(`Should delete and return the uuid ${uuids.portInstanceUuid}`, async () => {
      const res1 = await server
        .delete(`/instances/portsInstances/${uuids.portInstanceUuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(res1).to.exist;
      expect(res1.status).to.equal(200);
      expect(res1.body).to.deep.include(uuids.portInstanceUuid);
    });

    it(`Should delete the scene and all ports then return the uuid ${uuids.port2Uuid}`, async () => {
      const res2 = await server
        .delete(`/instances/sceneInstances/${uuids.sceneInstanceUuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(res2).to.exist;
      expect(res2.status).to.equal(200);
      expect(res2.body).to.deep.include(uuids.portInstance2Uuid);
    });

    it(`Should delete the port, the role and the attribute`, async () => {
      const resScene = await server
        .post("/metamodel/sceneTypes")
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.scenetypeUuid2,
          name: "Test scene type",
          classes: [
            {
              uuid: uuids.classUuid2,
              name: "test class",
            },
          ],
        });
      expect(resScene).to.exist;
      expect(resScene.status).to.equal(200);

      const resPort = await server
        .post(`/metamodel/ports/${uuids.portUuid2}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.portUuid2,
          name: "Test port for class",
          uuid_scene_type: uuids.scenetypeUuid2,
          uuid_class: uuids.classUuid2,
          geometry: "bla bla bla",
          attributes: [
            {
              uuid: uuids.attributeUuid2,
              name: "Name",
              description: "Name of the element",
              default_value: "John Doe",
              facets: "facets",
              min: 0,
              max: 1,
              attribute_type: {
                uuid: uuids.attributeTypeUuid2,
                name: "String",
                pre_defined: true,
                regex_value:
                  "^([\\x09\\x0A\\x0D\\x20-\\x7E]|[\\xC2-\\xDF][\\x80-\\xBF]|\\xE0[\\xA0-\\xBF][\\x80-\\xBF]|[\\xE1-\\xEC\\xEE\\xEF][\\x80-\\xBF]{2}|\\xED[\\x80-\\x9F][\\x80-\\xBF]|\\xF0[\\x90-\\xBF][\\x80-\\xBF]{2}|[\\xF1-\\xF3][\\x80-\\xBF]{3}|\\xF4[\\x80-\\x8F][\\x80-\\xBF]{2})*$",
              },
            },
          ],
        });
      expect(resPort).to.exist;
      expect(resPort.status).to.equal(201);

      const resRole = await server
        .post(`/metamodel/sceneTypes/${uuids.scenetypeUuid2}/roles`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send([
          {
            uuid: uuids.roleUuid2,
            name: "role port ref",
            port_references: [
              {
                uuid: uuids.portUuid2,
                min: 1,
                max: 1,
              },
            ],
          },
        ]);
      expect(resRole).to.exist;
      expect(resRole.status).to.equal(201);

      const resSceneInst = await server
        .post(`/instances/sceneTypes/${uuids.scenetypeUuid2}/sceneInstances`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.sceneInstanceUuid2,
          uuid_scene_type: uuids.scenetypeUuid2,
          name: "scene instance test role ref",
          class_instances: [
            {
              uuid: uuids.classInstanceUuid2,
              uuid_class: uuids.classUuid2,
              name: "test class instance",
            },
          ],
        });
      expect(resSceneInst).to.exist;
      expect(resSceneInst.status).to.equal(201);

      const resPortInst = await server
        .post(
          `/instances/sceneInstances/${uuids.sceneInstanceUuid2}/portsInstances`
        )
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send([
          {
            uuid: uuids.portInstanceUuid2,
            uuid_port: uuids.portUuid2,
            name: "Test port instance for class",
            uuid_scene_instance: uuids.sceneInstanceUuid2,
            uuid_class_instance: uuids.classInstanceUuid2,
            geometry: "bla bla bla",
            attribute_instances: [
              {
                uuid: uuids.attributeInstanceUuid2,
                uuid_attribute: uuids.attributeUuid2,
                name: "test attribute instance",
                value: "test",
              },
            ],
          },
        ]);
      expect(resPortInst).to.exist;
      expect(resPortInst.status).to.equal(201);

      const resRoleInst = await server
        .post(`/instances/rolesInstances/${uuids.roleInstanceUuid2}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.roleInstanceUuid2,
          name: "test role instance",
          uuid_role: uuids.roleUuid2,
          uuid_has_reference_port_instance: uuids.portInstanceUuid2,
        });
      expect(resRoleInst).to.exist;
      expect(resRoleInst.status).to.equal(201);

      const resDel = await server
        .delete(`/instances/portsInstances/${uuids.portInstanceUuid2}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(resDel).to.exist;
      expect(resDel.status).to.equal(200);
      expect(resDel.body).to.deep.include(uuids.roleInstanceUuid2);
      expect(resDel.body).to.deep.include(uuids.portInstanceUuid2);
      expect(resDel.body).to.deep.include(uuids.attributeInstanceUuid2);
      expect(resDel.body).to.not.deep.include(uuids.classInstanceUuid2);
      expect(resDel.body).to.not.deep.include(uuids.sceneInstanceUuid2);
    });
  });
});
