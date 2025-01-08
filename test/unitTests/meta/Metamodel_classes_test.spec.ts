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

describe("Metamodel classes tests", function () {
  const server = chai.request(API_URL);
  const setup = TestEnvironmentSetup.getInstance(API_URL);

  this.timeout(TIMEOUT);
  let token: string;

  let client: PoolClient;

  const uuids = {
    classUuid: uuidv4(),
    classUuid2: uuidv4(),
    classUuid3: uuidv4(),
    classUuid4: uuidv4(),
    bendpointUuid: uuidv4(),
    sceneTypeUuid3: uuidv4(),
    portUuid: uuidv4(),
    sceneTypeUuid: uuidv4(),
    attributeUuid: uuidv4(),
    attributeUuid2: uuidv4(),
    relationClassUuid2: uuidv4(),
    roleUuid: uuidv4(),
    roleUuid2: uuidv4(),
    relationClassUuid: uuidv4(),
    classUuid5: uuidv4(),
    relationClassUuid3: uuidv4(),
    attributeTypeUuid: uuidv4(),
    classUuid6: uuidv4(),
    classInstanceUuid1: uuidv4(),
    classUuidPatch: uuidv4(),
    portUuidDelete: uuidv4(),
    portUuidEdit: uuidv4(),
    portUuidAdd: uuidv4(),
    attributeUuidDelete: uuidv4(),
    attributeUuidEdit: uuidv4(),
    attributeUuidAdd: uuidv4(),
  };
  before(async () => {
    ({ client, token } = await setup.setupTestEnvironment());
  });

  after(async () => {
    await setup.tearDown(client, Object.values(uuids));
  });

  describe("POST Metamodel classes", () => {
    it(`Should post and return the class of uuid ${uuids.classUuid}`, async () => {
      const res1 = await server
        .post(`/metamodel/classes/${uuids.classUuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.classUuid,
          name: "Gateway",
          is_reusable: true,
          is_abstract: false,
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
          geometry: "function vizRep(gc) {}",
        });
      expect(res1).to.exist;
      expect(res1.status).to.equal(201);
      expect(res1.body).to.deep.includes({
        uuid: uuids.classUuid,
        name: "Gateway",
        is_reusable: true,
        is_abstract: false,
        geometry: "function vizRep(gc) {}",
        uuid_metaobject: uuids.classUuid,
      });
      expect(res1.body.attributes[0]).to.deep.include({
        uuid: uuids.attributeUuid,
      });
      expect(res1.body.attributes[0].attribute_type).to.deep.include({
        uuid: uuids.attributeTypeUuid,
      });
    });
  });

  describe("PATCH Metamodel classes", () => {
    it(`should PATCH the class ${uuids.classUuidPatch}`, async () => {
      const resPost = await server
        .post(`/metamodel/classes/${uuids.classUuidPatch}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.classUuidPatch,
          name: "Test patch class",
          is_reusable: true,
          is_abstract: false,
          ports: [
            {
              uuid: uuids.portUuidDelete,
              name: "port to delete",
              uuid_class: uuids.classUuidPatch,
            },
            {
              uuid: uuids.portUuidEdit,
              name: "port to edit",
              uuid_class: uuids.classUuidPatch,
            },
          ],
          attributes: [
            {
              uuid: uuids.attributeUuidDelete,
              name: "Attribute to delete",
              description: "Attribute to delete",
              facets: "test facet",
              ui_component: "test ui component",
              sequence: 1,
              attribute_type: {
                uuid: uuids.attributeTypeUuid,
                name: "String",
                pre_defined: true,
                default_value: "This is a string",
                regex_value: "",
              },
            },
            {
              uuid: uuids.attributeUuidEdit,
              name: "Attribute to edit",
              description: "Attribute to edit",
              attribute_type: {
                uuid: uuids.attributeTypeUuid,
              },
            },
          ],
        });
      expect(resPost).to.exist;
      expect(resPost.status).to.equal(201);
      expect(resPost.body.attributes).to.have.lengthOf(2);
      expect(resPost.body.ports).to.have.lengthOf(2);

      const res1 = await server
        .patch(`/metamodel/classes/${uuids.classUuidPatch}?hardpatch=true`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.classUuidPatch,
          name: "Test patch class updated",
          is_reusable: false,
          is_abstract: true,
          ports: [
            {
              uuid: uuids.portUuidEdit,
              name: "port to edit updated",
              uuid_class: uuids.classUuidPatch,
            },
            {
              uuid: uuids.portUuidAdd,
              name: "port to add",
              uuid_class: uuids.classUuidPatch,
            },
          ],
          attributes: [
            {
              uuid: uuids.attributeUuidEdit,
              name: "Attribute to edit updated",
              description: "Attribute to edit updated",
              attribute_type: {
                uuid: uuids.attributeTypeUuid,
              },
            },
            {
              uuid: uuids.attributeUuidAdd,
              name: "Attribute to add",
              description: "Attribute to add",
              attribute_type: {
                uuid: uuids.attributeTypeUuid,
              },
            },
          ],
        });
      expect(res1).to.exist;
      expect(res1.status).to.equal(200);
      expect(res1.body).to.deep.includes({
        uuid: uuids.classUuidPatch,
        name: "Test patch class updated",
        is_reusable: false,
        is_abstract: true,
        uuid_metaobject: uuids.classUuidPatch,
      });
      expect(res1.body.attributes).to.have.lengthOf(2);
      expect(res1.body.ports).to.have.lengthOf(2);

      // Check attributes
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      res1.body.attributes.forEach((attribute) => {
        const expectedAttribute = [
          {
            uuid: uuids.attributeUuidAdd,
            name: "Attribute to add",
          },
          {
            uuid: uuids.attributeUuidEdit,
            name: "Attribute to edit updated",
          },
        ].find((expAttr) => expAttr.uuid === attribute.uuid);

        expect(
          attribute,
          `Attribute with UUID ${attribute.uuid}`,
        ).to.deep.include(expectedAttribute);
      });

      // Check ports
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      res1.body.ports.forEach((port) => {
        const expectedPort = [
          {
            uuid: uuids.portUuidAdd,
            name: "port to add",
          },
          {
            uuid: uuids.portUuidEdit,
            name: "port to edit updated",
          },
        ].find((expPort) => expPort.uuid === port.uuid);

        expect(port, `Port with UUID ${port.uuid}`).to.deep.include(
          expectedPort,
        );
      });
    });
  });

  describe("GET Metamodel classes", () => {
    it(`Should return the class of uuid ${uuids.classUuid}`, async () => {
      const res1 = await server
        .get(`/metamodel/classes/${uuids.classUuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(res1).to.exist;
      expect(res1.status).to.equal(200);
      expect(res1.body).to.deep.includes({
        uuid: uuids.classUuid,
        name: "Gateway",
        is_reusable: true,
        is_abstract: false,
        geometry: "function vizRep(gc) {}",
        uuid_metaobject: uuids.classUuid,
      });
      expect(res1.body.attributes[0]).to.deep.include({
        uuid: uuids.attributeUuid,
      });
      expect(res1.body.attributes[0].attribute_type).to.deep.include({
        uuid: uuids.attributeTypeUuid,
      });
    });
  });

  describe("DELETE Metamodel classes", () => {
    it(`Should delete and return the uuid ${uuids.classUuid}`, async () => {
      const res1 = await server
        .delete(`/metamodel/classes/${uuids.classUuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(res1).to.exist;
      expect(res1.status).to.equal(200);
      expect(res1.body).to.deep.include(uuids.classUuid);
    });

    it(`Should delete the class ${uuids.classUuid2} and the port ${uuids.portUuid}`, async () => {
      await server
        .post(`/metamodel/classes/${uuids.classUuid2}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.classUuid2,
          name: "test class",
          is_reusable: true,
          is_abstract: false,
        });
      await server
        .post(`/metamodel/ports/${uuids.portUuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.portUuid,
          name: "port test class2",
          uuid_class: uuids.classUuid2,
          geometry:
            "function vizRep(gc) {gc.graphic_cube(0.1, 0.1, 0.02, 'red');gc.graphic_text(-0.2, 0, 0.05, 0.05, 0.1, 'port'); return gc.drawVizRepPort()}",
        });
      const res1 = await server
        .delete(`/metamodel/classes/${uuids.classUuid2}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(res1).to.exist;
      expect(res1.status).to.equal(200);
      expect(res1.body).to.deep.include(uuids.classUuid2);
      expect(res1.body).to.deep.include(uuids.portUuid);
    });

    it(`Should delete the class ${uuids.classUuid3} but not the scenetype ${uuids.sceneTypeUuid}`, async () => {
      await server
        .post(`/metamodel/classes/${uuids.classUuid3}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.classUuid2,
          name: "test class",
          is_reusable: true,
          is_abstract: false,
        });
      await server
        .post("/metamodel/sceneTypes")
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.sceneTypeUuid,
          name: "Test SceneType",
          description: "This is a test scenetype",
          classes: [
            {
              uuid: uuids.classUuid3,
            },
          ],
        });

      const res1 = await server
        .delete(`/metamodel/classes/${uuids.classUuid3}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(res1).to.exist;
      expect(res1.status).to.equal(200);
      expect(res1.body).to.deep.include(uuids.classUuid3);
      expect(res1.body).not.to.deep.include(uuids.sceneTypeUuid);
    });

    it(`should delete the class ${uuids.classUuid4} but not the attribute ${uuids.attributeUuid2}`, async () => {
      await server
        .post(`/metamodel/classes/${uuids.classUuid4}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.classUuid4,
          name: "test class",
          is_reusable: true,
          is_abstract: false,
          attributes: [
            {
              uuid: uuids.attributeUuid2,
              name: "Name attribute",
              description: "Name of the element",
              attribute_type: {
                uuid: uuids.attributeTypeUuid,
              },
            },
          ],
        });
      const res1 = await server
        .delete(`/metamodel/classes/${uuids.classUuid4}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(res1).to.exist;
      expect(res1.status).to.equal(200);
      expect(res1.body).to.deep.include(uuids.classUuid4);
      expect(res1.body).not.to.deep.include(uuids.attributeUuid2);
    });

    it("should unlink the bendpoint from the relationclass", async () => {
      await server
        .post("/metamodel/sceneTypes")
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.sceneTypeUuid3,
          name: "BPMN Diagram",
          description: "This is a BPMN metamodel",
          classes: [
            {
              uuid: uuids.bendpointUuid,
              name: "test bendpoint",
            },
          ],
        });
      await server
        .post(`/metamodel/relationClasses/${uuids.relationClassUuid2}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          name: "test relationclass",
          uuid: uuids.relationClassUuid2,
          description: "This is a test relationclass",
          uuid_class_bendpoint: uuids.bendpointUuid,
          bendpoints: uuids.bendpointUuid,
          role_from: {
            uuid: uuids.roleUuid,
            name: "test_role_from",
            scenetype_references: [
              {
                uuid: uuids.sceneTypeUuid3,
                min: 1,
                max: 1,
              },
            ],
          },
          role_to: {
            uuid: uuids.roleUuid,
            name: "test_role_to",
            scenetype_references: [
              {
                uuid: uuids.sceneTypeUuid3,
                min: 1,
                max: 1,
              },
            ],
          },
        });
      const relaclass = await server
        .get(`/metamodel/relationClasses/${uuids.relationClassUuid2}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);

      expect(relaclass).to.exist;
      expect(relaclass.status).to.equal(200);
      expect(relaclass.body).to.deep.include({
        uuid: uuids.relationClassUuid2,
      });
      expect(relaclass.body.bendpoints).not.to.equal(uuids.bendpointUuid);
      expect(relaclass.body.uuid_class_bendpoint).to.not.equal(
        uuids.bendpointUuid,
      );

      const res1 = await server
        .delete(`/metamodel/classes/${uuids.bendpointUuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(res1).to.exist;
      expect(res1.status).to.equal(200);
      expect(res1.body).not.to.deep.include(uuids.relationClassUuid2);
      expect(res1.body).to.deep.include(uuids.bendpointUuid);
    });

    it("should restrict de deletion", async () => {
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
        .post(`/metamodel/relationClasses/${uuids.relationClassUuid3}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          name: "test relationclass",
          uuid: uuids.relationClassUuid3,
          description: "This is a test relationclass",
          role_from: {
            uuid: uuids.roleUuid2,
            name: "test_role_from",
            class_references: [
              {
                uuid: uuids.classUuid5,
                min: 1,
                max: 1,
              },
            ],
          },
          role_to: {
            uuid: uuids.roleUuid2,
            name: "test_role_to",
            class_references: [
              {
                uuid: uuids.classUuid5,
                min: 1,
                max: 1,
              },
            ],
          },
        });
      const res1 = await server
        .delete(`/metamodel/classes/${uuids.classUuid5}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(res1).to.exist;
      expect(res1.status).to.equal(409);
      expect(res1.body).to.deep.include(uuids.roleUuid2);
    });

    it(`should restrict the deletion because there is an instance`, async () => {
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
      const test = await server
        .post(`/instances/classesInstances/${uuids.classInstanceUuid1}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.classInstanceUuid1,
          uuid_class: uuids.classUuid6,
          name: "test class instance",
        });
      expect(test).to.exist;
      expect(test.status).to.equal(201);
      expect(test.body).to.deep.include({
        uuid: uuids.classInstanceUuid1,
        uuid_class: uuids.classUuid6,
        name: "test class instance",
      });
      const res1 = await server
        .delete(`/metamodel/classes/${uuids.classUuid6}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(res1).to.exist;
      expect(res1.status).to.equal(409);
      expect(res1.body).to.deep.include(uuids.classInstanceUuid1);
    });
  });
});
