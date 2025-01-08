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

describe("Instance roles tests", function () {
  this.timeout(TIMEOUT);
  const setup = TestEnvironmentSetup.getInstance(API_URL);

  let token: string;

  let client: PoolClient;

  const uuids = {
    sceneInstanceUuid: uuidv4(),
    classFromInstanceUuid: uuidv4(),
    classToInstanceUuid: uuidv4(),
    roleInstanceFromUuid: uuidv4(),
    roleInstanceToUuid: uuidv4(),
    relationclassInstanceUuid: uuidv4(),
    sceneInstanceUuid1: uuidv4(),
    roleInstanceUuid1: uuidv4(),
    sceneInstanceUuid2: uuidv4(),
    classInstanceUuid2: uuidv4(),
    roleInstanceUuid2: uuidv4(),
    sceneInstanceUuid3: uuidv4(),
    classInstanceUuid3: uuidv4(),
    relationclassInstanceUuid3: uuidv4(),
    roleInstanceFromUuid3: uuidv4(),
    roleInstanceToUuid3: uuidv4(),
    roleInstanceUuid3: uuidv4(),
    sceneInstanceUuid4: uuidv4(),
    classInstanceUuid4: uuidv4(),
    relationclassInstanceUuid4_1: uuidv4(),
    relationclassInstanceUuid4_2: uuidv4(),
    roleInstanceFromUuid4_1: uuidv4(),
    roleInstanceToUuid4_1: uuidv4(),
    roleInstanceFromUuid4_2: uuidv4(),
    roleInstanceToUuid4_2: uuidv4(),
    sceneInstanceUuid5: uuidv4(),
    classInstanceUuid5: uuidv4(),
    portInstanceUuid5: uuidv4(),
    relationclassInstanceUuid5: uuidv4(),
    roleInstanceUuid5: uuidv4(),
    attributeInstanceUuid3: uuidv4(),
    attributeInstanceUuid3_2: uuidv4(),
    roleInstanceUuid3_2: uuidv4(),
    roleInstanceUuid3_3: uuidv4(),
    roleInstanceUuid3_4: uuidv4(),

    sceneTypeUuid: uuidv4(),
    classFromUuid: uuidv4(),
    classToUuid: uuidv4(),
    relationclassUuid: uuidv4(),
    roleFromUuid: uuidv4(),
    roleToUuid: uuidv4(),
    scenetypeUuid1: uuidv4(),
    classUuid1: uuidv4(),
    roleUuid1: uuidv4(),
    scenetypeUuid2: uuidv4(),
    classUuid2: uuidv4(),
    roleUuid2: uuidv4(),
    scenetypeUuid3: uuidv4(),
    classUuid3: uuidv4(),
    relationclassUuid3: uuidv4(),
    roleFromUuid3: uuidv4(),
    roleToUuid3: uuidv4(),
    roleUuid3_2: uuidv4(),
    scenetypeUuid5: uuidv4(),
    classUuid5: uuidv4(),
    portUuid5: uuidv4(),
    roleUuid5: uuidv4(),
    attributeTypeUuid3: uuidv4(),
    attributeUuid3: uuidv4(),
    roleUuid3_3: uuidv4(),
  };
  before(async () => {
    ({ client, token } = await setup.setupTestEnvironment());
  });

  after(async () => {
    await setup.tearDown(client, Object.values(uuids));
  });
  describe("POST Instance roles", function () {
    it(`Should post and return minimal role with uuid ${uuids.roleInstanceFromUuid}`, async () => {
      // create meta scene type
      await server
        .post("/metamodel/sceneTypes")
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.sceneTypeUuid,
          name: "BPMN Diagram",
          classes: [
            {
              uuid: uuids.classFromUuid,
              name: "test class from",
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
              name: "relationclass test",
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
          ],
        });

      // create scene instance
      await server
        .post(`/instances/sceneTypes/${uuids.sceneTypeUuid}/sceneInstances`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.sceneInstanceUuid,
          uuid_scene_type: uuids.sceneTypeUuid,
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

      const res1 = await server
        .post(`/instances/rolesInstances/${uuids.roleInstanceFromUuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          name: "test role instance",
          uuid: uuids.roleInstanceFromUuid,
          uuid_role: uuids.roleFromUuid,
          uuid_has_reference_class_instance: uuids.classFromInstanceUuid,
        });

      expect(res1).to.exist;
      expect(res1.status).to.equal(201);
      expect(res1.body[0]).to.deep.include({
        name: "test role instance",
        uuid: uuids.roleInstanceFromUuid,
        uuid_role: uuids.roleFromUuid,
        uuid_has_reference_class_instance: uuids.classFromInstanceUuid,
      });
    });

    it(`Should post and return minimal relationclass with a role uuid ${uuids.roleInstanceToUuid}`, async () => {
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
            uuid_class: uuids.classFromUuid,
            name: "test relationclass instance",
            uuid_role_instance_from: uuids.roleInstanceFromUuid,
            uuid_role_instance_to: uuids.roleInstanceToUuid,
            role_instance_from: {
              uuid: uuids.roleInstanceFromUuid,
            },
            role_instance_to: {
              uuid: uuids.roleInstanceToUuid,
              uuid_role: uuids.roleToUuid,
              uuid_instance_object: uuids.roleInstanceToUuid,
              uuid_relationclass: uuids.relationclassUuid,
              uuid_has_reference_class_instance: uuids.classToInstanceUuid,
            },
          },
        ]);

      expect(res1).to.exist;
      expect(res1.status).to.equal(201);
      expect(res1.body[0].role_instance_to).to.deep.include({
        uuid: uuids.roleInstanceToUuid,
        uuid_role: uuids.roleToUuid,
        uuid_instance_object: uuids.roleInstanceToUuid,
        uuid_has_reference_class_instance: uuids.classToInstanceUuid,
      });
    });
  });

  describe("GET Instance roles", function () {
    it(`Should return minimal role with uuid ${uuids.roleInstanceFromUuid}`, async () => {
      const res1 = await server
        .get(`/instances/rolesInstances/${uuids.roleInstanceFromUuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(res1).to.exist;
      expect(res1.status).to.equal(200);
      expect(res1.body).to.deep.include({
        name: "test role instance",
        uuid: uuids.roleInstanceFromUuid,
        uuid_role: uuids.roleFromUuid,
        uuid_has_reference_class_instance: uuids.classFromInstanceUuid,
      });
    });

    it("Should get all the roles for a relationclass", async () => {
      const res1 = await server
        .get(
          `/instances/relationclassesInstances/${uuids.relationclassInstanceUuid}`
        )
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(res1).to.exist;
      expect(res1.status).to.equal(200);
      expect(res1.body.role_instance_from).to.deep.include({
        uuid: uuids.roleInstanceFromUuid,
        uuid_role: uuids.roleFromUuid,
        uuid_has_reference_class_instance: uuids.classFromInstanceUuid,
      });
      expect(res1.body.role_instance_to).to.deep.include({
        uuid: uuids.roleInstanceToUuid,
        uuid_role: uuids.roleToUuid,
        uuid_instance_object: uuids.roleInstanceToUuid,
        uuid_has_reference_class_instance: uuids.classToInstanceUuid,
      });
    });
  });

  describe("DELETE Instance roles", function () {
    it(`Should delete and return the uuid ${uuids.roleInstanceFromUuid}`, async () => {
      const res1 = await server
        .delete(`/instances/rolesInstances/${uuids.roleInstanceFromUuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(res1).to.exist;
      expect(res1.status).to.equal(200);
      expect(res1.body).to.deep.include(uuids.roleInstanceFromUuid);
    });

    it(`Should delete all roles and return the uuid ${uuids.relationclassInstanceUuid}`, async () => {
      const res2 = await server
        .delete(
          `/instances/relationclassesInstances/${uuids.relationclassInstanceUuid}`
        )
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(res2).to.exist;
      expect(res2.status).to.equal(200);
      expect(res2.body).to.deep.include(uuids.relationclassInstanceUuid);
    });

    it(`Should delete role but not the referenced scene`, async () => {
      const resScene = await server
        .post("/metamodel/sceneTypes")
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.scenetypeUuid1,
          name: "Test scene type",
        });
      expect(resScene).to.exist;
      expect(resScene.status).to.equal(200);

      const resRole = await server
        .post(`/metamodel/sceneTypes/${uuids.scenetypeUuid1}/roles`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send([
          {
            uuid: uuids.roleUuid1,
            name: "role scene type ref",
            scenetype_references: [
              {
                uuid: uuids.scenetypeUuid1,
                min: 1,
                max: 1,
              },
            ],
          },
        ]);
      expect(resRole).to.exist;
      expect(resRole.status).to.equal(201);

      const resSceneInst = await server
        .post(`/instances/sceneTypes/${uuids.scenetypeUuid1}/sceneInstances`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.sceneInstanceUuid1,
          uuid_scene_type: uuids.scenetypeUuid1,
          name: "scene instance test role ref",
        });
      expect(resSceneInst).to.exist;
      expect(resSceneInst.status).to.equal(201);

      const resRoleInst = await server
        .post(`/instances/rolesInstances/${uuids.roleInstanceUuid1}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.roleInstanceUuid1,
          name: "test role instance",
          uuid_role: uuids.roleUuid1,
          uuid_has_reference_scene_instance: uuids.sceneInstanceUuid1,
        });
      expect(resRoleInst).to.exist;
      expect(resRoleInst.status).to.equal(201);

      const resDel = await server
        .delete(`/instances/rolesInstances/${uuids.roleInstanceUuid1}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(resDel).to.exist;
      expect(resDel.status).to.equal(200);
      expect(resDel.body).to.deep.include(uuids.roleInstanceUuid1);
      expect(resDel.body).to.not.deep.include(uuids.sceneInstanceUuid1);
    });

    it(`Should delete role but not the referenced class`, async () => {
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

      const resRole = await server
        .post(`/metamodel/sceneTypes/${uuids.scenetypeUuid2}/roles`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send([
          {
            uuid: uuids.roleUuid2,
            name: "role scene type ref",
            class_references: [
              {
                uuid: uuids.classUuid2,
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

      const resRoleInst = await server
        .post(`/instances/rolesInstances/${uuids.roleInstanceUuid2}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.roleInstanceUuid2,
          name: "test role instance",
          uuid_role: uuids.roleUuid2,
          uuid_has_reference_class_instance: uuids.classInstanceUuid2,
        });
      expect(resRoleInst).to.exist;
      expect(resRoleInst.status).to.equal(201);

      const resDel = await server
        .delete(`/instances/rolesInstances/${uuids.roleInstanceUuid2}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(resDel).to.exist;
      expect(resDel.status).to.equal(200);
      expect(resDel.body).to.deep.include(uuids.roleInstanceUuid2);
      expect(resDel.body).to.not.deep.include(uuids.classInstanceUuid2);
    });

    it(`Should delete role, the referenced relationclass and the attribute instance`, async () => {
      const resScene = await server
        .post("/metamodel/sceneTypes")
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.scenetypeUuid3,
          name: "Test scene type",
          classes: [
            {
              uuid: uuids.classUuid3,
              name: "test class",
            },
          ],
          relationclasses: [
            {
              uuid: uuids.relationclassUuid3,
              name: "relationclass test",
              role_from: {
                uuid: uuids.roleFromUuid3,
                name: "role_from",
                class_references: [
                  {
                    uuid: uuids.classUuid3,
                    min: 1,
                    max: 1,
                  },
                ],
              },
              role_to: {
                uuid: uuids.roleToUuid3,
                name: "role_to",
                class_references: [
                  {
                    uuid: uuids.classUuid3,
                    min: 1,
                    max: 1,
                  },
                ],
              },
            },
          ],
          attributes: [
            {
              uuid: uuids.attributeUuid3,
              name: "Name",
              description: "Name of the element",
              default_value: "John Doe",
              facets: "facets",
              min: 0,
              max: 1,
              attribute_type: {
                uuid: uuids.attributeTypeUuid3,
                name: "String",
                pre_defined: true,
                regex_value:
                  "^([\\x09\\x0A\\x0D\\x20-\\x7E]|[\\xC2-\\xDF][\\x80-\\xBF]|\\xE0[\\xA0-\\xBF][\\x80-\\xBF]|[\\xE1-\\xEC\\xEE\\xEF][\\x80-\\xBF]{2}|\\xED[\\x80-\\x9F][\\x80-\\xBF]|\\xF0[\\x90-\\xBF][\\x80-\\xBF]{2}|[\\xF1-\\xF3][\\x80-\\xBF]{3}|\\xF4[\\x80-\\x8F][\\x80-\\xBF]{2})*$",
              },
            },
          ],
        });
      expect(resScene).to.exist;
      expect(resScene.status).to.equal(200);

      const resRole = await server
        .post(`/metamodel/sceneTypes/${uuids.scenetypeUuid3}/roles`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send([
          {
            uuid: uuids.roleUuid3_2,
            name: "role relationclass ref",
            relationclass_references: [
              {
                uuid: uuids.relationclassUuid3,
                min: 1,
                max: 1,
              },
            ],
          },
          {
            uuid: uuids.roleUuid3_3,
            name: "role attribute ref",
            attribute_references: [
              {
                uuid: uuids.attributeUuid3,
                min: 1,
                max: 1,
              },
            ],
          },
        ]);
      expect(resRole).to.exist;
      expect(resRole.status).to.equal(201);

      const resSceneInst = await server
        .post(`/instances/sceneTypes/${uuids.scenetypeUuid3}/sceneInstances`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.sceneInstanceUuid3,
          uuid_scene_type: uuids.scenetypeUuid3,
          name: "scene instance test role ref",
          class_instances: [
            {
              uuid: uuids.classInstanceUuid3,
              uuid_class: uuids.classUuid3,
              name: "test class instance",
            },
          ],
          relationclasses_instances: [
            {
              uuid: uuids.relationclassInstanceUuid3,
              uuid_relationclass: uuids.relationclassUuid3,
              name: "test relationclass instance",
              uuid_role_instance_from: uuids.roleInstanceFromUuid3,
              uuid_role_instance_to: uuids.roleInstanceToUuid3,
              role_instance_from: {
                uuid: uuids.roleInstanceFromUuid3,
                uuid_role: uuids.roleFromUuid3,
                uuid_relationclass: uuids.relationclassUuid3,
                uuid_has_reference_class_instance: uuids.classInstanceUuid3,
              },
              role_instance_to: {
                uuid: uuids.roleInstanceToUuid3,
                uuid_role: uuids.roleToUuid3,
                uuid_relationclass: uuids.relationclassUuid3,
                uuid_has_reference_class_instance: uuids.classInstanceUuid3,
              },
            },
          ],
          attribute_instances: [
            {
              uuid: uuids.attributeInstanceUuid3,
              uuid_attribute: uuids.attributeUuid3,
              name: "test attribute instance",
              value: "test",
            },
            {
              uuid: uuids.attributeInstanceUuid3_2,
              uuid_attribute: uuids.attributeUuid3,
              name: "test attribute instance",
              value: "test",
              role_instance_from: {
                uuid: uuids.roleInstanceUuid3_3,
                name: "test role instance",
                uuid_role: uuids.roleUuid3_2,
              },
            },
          ],
        });
      expect(resSceneInst).to.exist;
      expect(resSceneInst.status).to.equal(201);

      const resRoleInst = await server
        .post(`/instances/rolesInstances/${uuids.roleInstanceUuid3}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.roleInstanceUuid3,
          name: "test role instance",
          uuid_role: uuids.roleUuid3_2,
          uuid_has_reference_relationclass_instance:
            uuids.relationclassInstanceUuid3,
        });
      expect(resRoleInst).to.exist;
      expect(resRoleInst.status).to.equal(201);

      const resRoleInst2 = await server
        .post(`/instances/rolesInstances/${uuids.roleInstanceUuid3_2}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.roleInstanceUuid3_2,
          name: "test role instance",
          uuid_role: uuids.roleUuid3_3,
          uuid_has_reference_attribute_instance: uuids.attributeInstanceUuid3,
        });
      expect(resRoleInst2).to.exist;
      expect(resRoleInst2.status).to.equal(201);

      const resDel = await server
        .delete(`/instances/rolesInstances/${uuids.roleInstanceUuid3}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(resDel).to.exist;
      expect(resDel.status).to.equal(200);
      expect(resDel.body).to.deep.include(uuids.roleInstanceUuid3);
      expect(resDel.body).to.deep.include(uuids.relationclassInstanceUuid3);

      const resDel2 = await server
        .delete(`/instances/rolesInstances/${uuids.roleInstanceUuid3_2}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(resDel2).to.exist;
      expect(resDel2.status).to.equal(200);
      expect(resDel2.body).to.deep.include(uuids.roleInstanceUuid3_2);
      expect(resDel2.body).to.deep.include(uuids.attributeInstanceUuid3);

      const resDel3 = await server
        .delete(`/instances/rolesInstances/${uuids.roleInstanceUuid3_3}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(resDel3).to.exist;
      expect(resDel3.status).to.equal(200);
      expect(resDel3.body).to.deep.include(uuids.roleInstanceUuid3_3);
      expect(resDel3.body).not.to.deep.include(uuids.attributeInstanceUuid3_2);
    });

    it(`Should delete role and the referenced relationclass (role from and role to)`, async () => {
      const resSceneInst = await server
        .post(`/instances/sceneTypes/${uuids.scenetypeUuid3}/sceneInstances`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.sceneInstanceUuid4,
          uuid_scene_type: uuids.scenetypeUuid3,
          name: "scene instance test role ref",
          class_instances: [
            {
              uuid: uuids.classInstanceUuid4,
              uuid_class: uuids.classUuid3,
              name: "test class instance",
            },
          ],
          relationclasses_instances: [
            {
              uuid: uuids.relationclassInstanceUuid4_1,
              uuid_relationclass: uuids.relationclassUuid3,
              name: "test relationclass instance",
              uuid_role_instance_from: uuids.roleInstanceFromUuid4_1,
              uuid_role_instance_to: uuids.roleInstanceToUuid4_1,
              role_instance_from: {
                uuid: uuids.roleInstanceFromUuid4_1,
                uuid_role: uuids.roleFromUuid3,
                uuid_relationclass: uuids.relationclassUuid3,
                uuid_has_reference_class_instance: uuids.classInstanceUuid4,
              },
              role_instance_to: {
                uuid: uuids.roleInstanceToUuid4_1,
                uuid_role: uuids.roleToUuid3,
                uuid_relationclass: uuids.relationclassUuid3,
                uuid_has_reference_class_instance: uuids.classInstanceUuid4,
              },
            },
            {
              uuid: uuids.relationclassInstanceUuid4_2,
              uuid_relationclass: uuids.relationclassUuid3,
              name: "test relationclass instance",
              uuid_role_instance_from: uuids.roleInstanceFromUuid4_2,
              uuid_role_instance_to: uuids.roleInstanceToUuid4_2,
              role_instance_from: {
                uuid: uuids.roleInstanceFromUuid4_2,
                uuid_role: uuids.roleFromUuid3,
                uuid_relationclass: uuids.relationclassUuid3,
                uuid_has_reference_class_instance: uuids.classInstanceUuid4,
              },
              role_instance_to: {
                uuid: uuids.roleInstanceToUuid4_2,
                uuid_role: uuids.roleToUuid3,
                uuid_relationclass: uuids.relationclassUuid3,
                uuid_has_reference_class_instance: uuids.classInstanceUuid4,
              },
            },
          ],
        });
      expect(resSceneInst).to.exist;
      expect(resSceneInst.status).to.equal(201);

      const resDelFrom = await server
        .delete(`/instances/rolesInstances/${uuids.roleInstanceFromUuid4_1}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(resDelFrom).to.exist;
      expect(resDelFrom.status).to.equal(200);
      expect(resDelFrom.body).to.deep.include(uuids.roleInstanceFromUuid4_1);
      expect(resDelFrom.body).to.deep.include(
        uuids.relationclassInstanceUuid4_1
      );

      const resDelTo = await server
        .delete(`/instances/rolesInstances/${uuids.roleInstanceToUuid4_2}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(resDelTo).to.exist;
      expect(resDelTo.status).to.equal(200);
      expect(resDelTo.body).to.deep.include(uuids.roleInstanceToUuid4_2);
      expect(resDelTo.body).to.deep.include(uuids.relationclassInstanceUuid4_2);
    });

    it(`Should delete role but not the port`, async () => {
      const resScene = await server
        .post("/metamodel/sceneTypes")
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.scenetypeUuid5,
          name: "Test scene type",
          classes: [
            {
              uuid: uuids.classUuid5,
              name: "test class",
            },
          ],
        });
      expect(resScene).to.exist;
      expect(resScene.status).to.equal(200);

      const resPort = await server
        .post(`/metamodel/ports/${uuids.portUuid5}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.portUuid5,
          name: "Test port for class",
          uuid_scene_type: uuids.scenetypeUuid5,
          uuid_class: uuids.classUuid5,
          geometry: "bla bla bla",
        });
      expect(resPort).to.exist;
      expect(resPort.status).to.equal(201);

      const resRole = await server
        .post(`/metamodel/sceneTypes/${uuids.scenetypeUuid5}/roles`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send([
          {
            uuid: uuids.roleUuid5,
            name: "role port ref",
            port_references: [
              {
                uuid: uuids.portUuid5,
                min: 1,
                max: 1,
              },
            ],
          },
        ]);
      expect(resRole).to.exist;
      expect(resRole.status).to.equal(201);

      const resSceneInst = await server
        .post(`/instances/sceneTypes/${uuids.scenetypeUuid5}/sceneInstances`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.sceneInstanceUuid5,
          uuid_scene_type: uuids.scenetypeUuid5,
          name: "scene instance test role ref",
          class_instances: [
            {
              uuid: uuids.classInstanceUuid5,
              uuid_class: uuids.classUuid5,
              name: "test class instance",
            },
          ],
        });
      expect(resSceneInst).to.exist;
      expect(resSceneInst.status).to.equal(201);

      const resPortInst = await server
        .post(
          `/instances/sceneInstances/${uuids.sceneInstanceUuid5}/portsInstances`
        )
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send([
          {
            uuid: uuids.portInstanceUuid5,
            uuid_port: uuids.portUuid5,
            name: "Test port instance for class",
            uuid_scene_instance: uuids.sceneInstanceUuid5,
            uuid_class_instance: uuids.classInstanceUuid5,
            geometry: "bla bla bla",
          },
        ]);
      expect(resPortInst).to.exist;
      expect(resPortInst.status).to.equal(201);

      const resRoleInst = await server
        .post(`/instances/rolesInstances/${uuids.roleInstanceUuid5}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.roleInstanceUuid5,
          name: "test role instance",
          uuid_role: uuids.roleUuid5,
          uuid_has_reference_port_instance: uuids.portInstanceUuid5,
        });
      expect(resRoleInst).to.exist;
      expect(resRoleInst.status).to.equal(201);

      const resDel = await server
        .delete(`/instances/rolesInstances/${uuids.roleInstanceUuid5}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(resDel).to.exist;
      expect(resDel.status).to.equal(200);
      expect(resDel.body).to.deep.include(uuids.roleInstanceUuid5);
      expect(resDel.body).not.to.deep.include(uuids.portInstanceUuid5);
    });
  });
});
