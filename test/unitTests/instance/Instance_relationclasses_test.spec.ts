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

describe("Instance relationclasses tests", function () {
  this.timeout(TIMEOUT);
  let token: string;
  const setup = TestEnvironmentSetup.getInstance(API_URL);

  let client: PoolClient;

  const uuids = {
    sceneInstanceUuid: uuidv4(),
    classFromInstanceUuid: uuidv4(),
    classToInstanceUuid: uuidv4(),
    relationclassInstanceUuid: uuidv4(),
    roleFromInstanceUuid: uuidv4(),
    roleToInstanceUuid: uuidv4(),
    sceneInstanceUuid2: uuidv4(),
    classFromInstanceUuid2: uuidv4(),
    classToInstanceUuid2: uuidv4(),
    relationclassInstanceUuid2: uuidv4(),
    roleFromInstanceUuid2: uuidv4(),
    roleToInstanceUuid2: uuidv4(),
    classBendpointInstanceUuid: uuidv4(),
    relationclassInstanceUuid3: uuidv4(),
    roleFromInstanceUuid3: uuidv4(),
    roleToInstanceUuid3: uuidv4(),
    relationclassInstanceUuid4: uuidv4(),
    roleFromInstanceUuid4: uuidv4(),
    roleToInstanceUuid4: uuidv4(),

    relationclassUuid2: uuidv4(),
    relationclassUuid: uuidv4(),
    scenetypeUuid: uuidv4(),
    classToUuid: uuidv4(),
    classFromUuid: uuidv4(),
    classBendpointUuid: uuidv4(),
    roleFromUuid: uuidv4(),
    roleToUuid: uuidv4(),
    roleFromUuid2: uuidv4(),
    roleToUuid2: uuidv4(),
  };

  before(async () => {
    ({ client, token } = await setup.setupTestEnvironment());
  });

  after(async () => {
    await setup.tearDown(client, Object.values(uuids));
  });

  describe("POST Instance relationclasses", function () {
    it(`Should post and return minimal relationclass with uuid ${uuids.relationclassInstanceUuid}`, async () => {
      // create meta scene type
      await server
        .post("/metamodel/sceneTypes")
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.scenetypeUuid,
          name: "Test scene type",
          classes: [
            {
              uuid: uuids.classFromUuid,
              name: "test class from",
              is_reusable: true,
              is_abstract: false,
            },
            {
              uuid: uuids.classBendpointUuid,
              name: "test class bendpoint",
              is_reusable: true,
              is_abstract: false,
            },
            {
              uuid: uuids.classToUuid,
              name: "test class to",
              is_reusable: true,
              is_abstract: false,
            },
          ],
          relationclasses: [
            {
              uuid: uuids.relationclassUuid,
              bendpoint: uuids.classBendpointUuid,
              name: "test relationclass",
              role_from: {
                uuid: uuids.roleFromUuid,
                name: "role_from",
                class_references: [
                  {
                    uuid: uuids.classFromUuid,
                    min: 1,
                    max: 1,
                  },
                ],
              },
              role_to: {
                uuid: uuids.roleToUuid,
                name: "role_to",
                class_references: [
                  {
                    uuid: uuids.classToUuid,
                    min: 1,
                    max: 1,
                  },
                ],
              },
            },
            {
              uuid: uuids.relationclassUuid2,
              bendpoint: uuids.classBendpointUuid,
              name: "test relationclass _ 2",
              role_from: {
                uuid: uuids.roleFromUuid2,
                name: "role_from",
                relationclass_refences: [
                  {
                    uuid: uuids.relationclassUuid,
                    min: 1,
                    max: 1,
                  },
                ],
              },
              role_to: {
                uuid: uuids.roleToUuid2,
                name: "role_to",
                relationclass_refences: [
                  {
                    uuid: uuids.relationclassUuid,
                    min: 1,
                    max: 1,
                  },
                ],
              },
            },
          ],
        });

      // create scene instance
      await server
        .post(`/instances/sceneTypes/${uuids.scenetypeUuid}/sceneInstances`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.sceneInstanceUuid,
          uuid_scene_type: uuids.scenetypeUuid,
          name: "test scene instance",
          class_instances: [
            {
              uuid: uuids.classFromInstanceUuid,
              uuid_class: uuids.classFromUuid,
              name: "test class from",
            },
            {
              uuid: uuids.classToInstanceUuid,
              uuid_class: uuids.classToUuid,
              name: "test class to",
            },
          ],
        });

      // create relationclass instance
      const res1 = await server
        .post(
          `/instances/sceneInstances/${uuids.sceneInstanceUuid}/relationclassesInstances`
        )
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send([
          {
            uuid: uuids.relationclassInstanceUuid,
            uuid_relationclass: uuids.relationclassUuid,
            name: "test relationclass instance",
            uuid_role_instance_from: uuids.roleFromInstanceUuid,
            uuid_role_instance_to: uuids.roleToInstanceUuid,
            role_instance_from: {
              uuid: uuids.roleFromInstanceUuid,
              uuid_role: uuids.roleFromUuid,
              uuid_relationclass: uuids.relationclassUuid,
              uuid_has_reference_class_instance: uuids.classFromInstanceUuid,
            },
            role_instance_to: {
              uuid: uuids.roleToInstanceUuid,
              uuid_role: uuids.roleToUuid,
              uuid_relationclass: uuids.relationclassUuid,
              uuid_has_reference_class_instance: uuids.classToInstanceUuid,
            },
          },
        ]);
      expect(res1).to.exist;
      expect(res1.status).to.equal(201);
      expect(res1.body[0]).to.deep.include({
        uuid: uuids.relationclassInstanceUuid,
        name: "test relationclass instance",
        uuid_class: uuids.relationclassUuid,
        uuid_role_instance_from: uuids.roleFromInstanceUuid,
        uuid_role_instance_to: uuids.roleToInstanceUuid,
        uuid_instance_object: uuids.relationclassInstanceUuid,
        uuid_relationclass: uuids.relationclassUuid,
      });
      expect(res1.body[0].role_instance_from).to.deep.include({
        uuid: uuids.roleFromInstanceUuid,
        uuid_role: uuids.roleFromUuid,
        uuid_has_reference_class_instance: uuids.classFromInstanceUuid,
      });
      expect(res1.body[0].role_instance_to).to.deep.include({
        uuid: uuids.roleToInstanceUuid,
        uuid_role: uuids.roleToUuid,
        uuid_instance_object: uuids.roleToInstanceUuid,
        uuid_has_reference_class_instance: uuids.classToInstanceUuid,
      });
    });
  });

  describe("GET Instance relationclasses", function () {
    it(`Should return minimal relationclass with uuid ${uuids.relationclassInstanceUuid}`, async () => {
      const res1 = await server
        .get(
          `/instances/relationclassesInstances/${uuids.relationclassInstanceUuid}`
        )
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(res1).to.exist;
      expect(res1.status).to.equal(200);
      expect(res1.body).to.deep.include({
        uuid: uuids.relationclassInstanceUuid,
        name: "test relationclass instance",
        uuid_class: uuids.relationclassUuid,
        uuid_role_instance_from: uuids.roleFromInstanceUuid,
        uuid_role_instance_to: uuids.roleToInstanceUuid,
        uuid_instance_object: uuids.relationclassInstanceUuid,
        uuid_relationclass: uuids.relationclassUuid,
      });
      expect(res1.body.role_instance_from).to.deep.include({
        uuid: uuids.roleFromInstanceUuid,
        uuid_role: uuids.roleFromUuid,
        uuid_has_reference_class_instance: uuids.classFromInstanceUuid,
      });
      expect(res1.body.role_instance_to).to.deep.include({
        uuid: uuids.roleToInstanceUuid,
        uuid_role: uuids.roleToUuid,
        uuid_instance_object: uuids.roleToInstanceUuid,
        uuid_has_reference_class_instance: uuids.classToInstanceUuid,
      });

      it("Should get all the relationclasses", async () => {
        const res1 = await server
          .get(
            `/instances/sceneInstances/${uuids.sceneInstanceUuid}/relationclassesInstances`
          )
          .set("content-type", "application/json")
          .set("accept", "application/json")
          .set("Cookie", "authcookie=" + token);
        expect(res1).to.exist;
        expect(res1.status).to.equal(200);
        expect(res1.body[0]).to.deep.include({
          uuid: uuids.relationclassInstanceUuid,
          name: "test relationclass instance",
          uuid_class: uuids.relationclassUuid,
          uuid_role_instance_from: uuids.roleFromInstanceUuid,
          uuid_role_instance_to: uuids.roleToInstanceUuid,
          uuid_instance_object: uuids.relationclassInstanceUuid,
          uuid_relationclass: uuids.relationclassUuid,
        });
        expect(res1.body[0].role_instance_from).to.deep.include({
          uuid: uuids.roleFromInstanceUuid,
          uuid_role: uuids.roleFromUuid,
          uuid_has_reference_class_instance: uuids.classFromInstanceUuid,
        });
        expect(res1.body[0].role_instance_to).to.deep.include({
          uuid: uuids.roleToInstanceUuid,
          uuid_role: uuids.roleToUuid,
          uuid_instance_object: uuids.roleToInstanceUuid,
          uuid_has_reference_class_instance: uuids.classToInstanceUuid,
        });
      });
    });
  });
  describe("DELETE Instance relationclasses", function () {
    it(`Should delete and return the uuid ${uuids.relationclassInstanceUuid}`, async () => {
      const res1 = await server
        .delete(
          `/instances/relationclassesInstances/${uuids.relationclassInstanceUuid}`
        )
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(res1).to.exist;
      expect(res1.status).to.equal(200);
      expect(res1.body).to.deep.include(uuids.relationclassInstanceUuid);
    });

    it(`Should delete the relationclass, the bendpoint and the roles`, async () => {
      // create scene instance
      const resPostScenetype = await server
        .post(`/instances/sceneTypes/${uuids.scenetypeUuid}/sceneInstances`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.sceneInstanceUuid2,
          uuid_scene_type: uuids.scenetypeUuid,
          name: "test scene instance",
          class_instances: [
            {
              uuid: uuids.classFromInstanceUuid2,
              uuid_class: uuids.classFromUuid,
              name: "test class from",
            },
            {
              uuid: uuids.classToInstanceUuid2,
              uuid_class: uuids.classToUuid,
              name: "test class to",
            },
            {
              uuid: uuids.classBendpointInstanceUuid,
              uuid_class: uuids.classBendpointUuid,
              name: "test class bendpoint",
            },
          ],
        });

      expect(resPostScenetype).to.exist;
      expect(resPostScenetype.status).to.equal(201);

      // create relationclass instance
      const resPostInstance = await server
        .post(
          `/instances/sceneInstances/${uuids.sceneInstanceUuid2}/relationclassesInstances`
        )
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send([
          {
            uuid: uuids.relationclassInstanceUuid2,
            uuid_relationclass: uuids.relationclassUuid,
            uuid_relationclass_bendpoint: uuids.classBendpointUuid,
            name: "test relationclass instance",
            uuid_role_instance_from: uuids.roleFromInstanceUuid2,
            uuid_role_instance_to: uuids.roleToInstanceUuid2,
            line_points: [
              {
                UUID: uuids.classBendpointInstanceUuid,
                Point: { x: -3.3, y: 1.8, z: 0 },
              },
            ],
            role_instance_from: {
              uuid: uuids.roleFromInstanceUuid2,
              uuid_role: uuids.roleFromUuid,
              uuid_relationclass: uuids.relationclassUuid,
              uuid_has_reference_class_instance: uuids.classFromInstanceUuid2,
            },
            role_instance_to: {
              uuid: uuids.roleToInstanceUuid2,
              uuid_role: uuids.roleToUuid,
              uuid_relationclass: uuids.relationclassUuid,
              uuid_has_reference_class_instance: uuids.classToInstanceUuid2,
            },
          },
        ]);
      expect(resPostInstance).to.exist;
      expect(resPostInstance.status).to.equal(201);

      const res2 = await server
        .delete(
          `/instances/relationclassesInstances/${uuids.relationclassInstanceUuid2}`
        )
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(res2).to.exist;
      expect(res2.status).to.equal(200);
      expect(res2.body).to.deep.include(uuids.relationclassInstanceUuid2);
      expect(res2.body).to.deep.include(uuids.roleFromInstanceUuid2);
      expect(res2.body).to.deep.include(uuids.roleToInstanceUuid2);
      expect(res2.body).to.deep.include(uuids.classBendpointInstanceUuid);
    });

    it(`Should delete the relationclass and the role instance`, async () => {
      // create relationclass instance
      await server
        .post(
          `/instances/sceneInstances/${uuids.sceneInstanceUuid2}/relationclassesInstances`
        )
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send([
          {
            uuid: uuids.relationclassInstanceUuid3,
            uuid_relationclass: uuids.relationclassUuid,
            name: "test relationclass instance",
            uuid_role_instance_from: uuids.roleFromInstanceUuid3,
            uuid_role_instance_to: uuids.roleToInstanceUuid3,
            role_instance_from: {
              uuid: uuids.roleFromInstanceUuid3,
              uuid_role: uuids.roleFromUuid,
              uuid_relationclass: uuids.relationclassUuid,
            },
            role_instance_to: {
              uuid: uuids.roleToInstanceUuid3,
              uuid_role: uuids.roleToUuid,
              uuid_relationclass: uuids.relationclassUuid,
            },
          },
          {
            uuid: uuids.relationclassInstanceUuid4,
            uuid_relationclass: uuids.relationclassUuid2,
            name: "test relationclass instance 2",
            uuid_role_instance_from: uuids.roleFromInstanceUuid4,
            uuid_role_instance_to: uuids.roleToInstanceUuid4,
            role_instance_from: {
              uuid: uuids.roleFromInstanceUuid4,
              uuid_role: uuids.roleFromUuid2,
              uuid_relationclass: uuids.relationclassUuid2,
              uuid_has_reference_relationclass_instance:
                uuids.relationclassInstanceUuid3,
            },
            role_instance_to: {
              uuid: uuids.roleToInstanceUuid4,
              uuid_role: uuids.roleToUuid2,
              uuid_relationclass: uuids.relationclassUuid2,
            },
          },
        ]);
      const res2 = await server
        .delete(
          `/instances/relationclassesInstances/${uuids.relationclassInstanceUuid3}`
        )
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(res2).to.exist;
      expect(res2.status).to.equal(200);
      expect(res2.body).to.deep.include(uuids.relationclassInstanceUuid3);
      expect(res2.body).to.deep.include(uuids.roleFromInstanceUuid4);
    });
  });
});
