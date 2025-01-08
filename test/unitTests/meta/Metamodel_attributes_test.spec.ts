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

describe("Metamodel attributes tests", async function () {
  const server = chai.request(API_URL);
  const setup = TestEnvironmentSetup.getInstance(API_URL);

  this.timeout(TIMEOUT);
  let token: string;

  let client: PoolClient;
  const uuids = {
    attributeUuid: uuidv4(),
    attributeUuid2: uuidv4(),
    classUuid: uuidv4(),
    attributeTypeUuid: uuidv4(),
    attributeTableUuid: uuidv4(),
    attributeTypeTableUuid: uuidv4(),
    attributeCol1Uuid: uuidv4(),
    attributeTypeCol1Uuid: uuidv4(),
    attributeCol2Uuid: uuidv4(),
    attributeTypeCol2Uuid: uuidv4(),
    attributeCol3Uuid: uuidv4(),
    attributeTypeCol3Uuid: uuidv4(),
    attributeUuid3: uuidv4(),
    attributeUuid4: uuidv4(),
    portUuid: uuidv4(),
    sceneTypeUuid: uuidv4(),
    classUuid6: uuidv4(),
    attributeUuid6: uuidv4(),
    classInstanceUuid1: uuidv4(),
    attributeInstanceUuid: uuidv4(),
  };
  before(async () => {
    ({ client, token } = await setup.setupTestEnvironment());
  });

  after(async () => {
    await setup.tearDown(client, Object.values(uuids));
  });

  describe("POST Metamodel attributes", function () {
    it(`Should post and return the attribute with the uuid${uuids.attributeUuid}`, async () => {
      const res1 = await server
        .post(`/metamodel/attributes/${uuids.attributeUuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.attributeUuid,
          name: "Name",
          description: "Name of the element",
          default_value: "John Doe",
          facets: "facets",
          min: 0,
          max: 1,
          attribute_type: {
            uuid: uuids.attributeTypeUuid,
            name: "String",
            pre_defined: true,
            regex_value:
              "^([\\x09\\x0A\\x0D\\x20-\\x7E]|[\\xC2-\\xDF][\\x80-\\xBF]|\\xE0[\\xA0-\\xBF][\\x80-\\xBF]|[\\xE1-\\xEC\\xEE\\xEF][\\x80-\\xBF]{2}|\\xED[\\x80-\\x9F][\\x80-\\xBF]|\\xF0[\\x90-\\xBF][\\x80-\\xBF]{2}|[\\xF1-\\xF3][\\x80-\\xBF]{3}|\\xF4[\\x80-\\x8F][\\x80-\\xBF]{2})*$",
          },
        });
      expect(res1).to.exist;
      expect(res1.status).to.equal(201);
      expect(res1.body).to.deep.include({
        uuid: uuids.attributeUuid,
        name: "Name",
        description: "Name of the element",
        default_value: "John Doe",
        facets: "facets",
        min: 0,
        max: 1,
        uuid_metaobject: uuids.attributeUuid,
        attribute_type_uuid: uuids.attributeTypeUuid,
      });
      expect(res1.body.attribute_type).to.deep.include({
        uuid: uuids.attributeTypeUuid,
      });
    });

    it(`Should post and return the class of uuid${uuids.classUuid} with an attribute with a sequence number`, async () => {
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
              uuid: uuids.attributeUuid2,
              name: "Name",
              sequence: 1,
              ui_component: "text",
              description: "Name of the element",
              attribute_type: {
                uuid: uuids.attributeTypeUuid,
              },
            },
          ],
          geometry: "function vizRep(gc) {}",
        });
      expect(res1).to.exist;
      expect(res1.status).to.equal(201);
      expect(res1.body.attributes[0]).to.deep.include({
        uuid: uuids.attributeUuid2,
        sequence: 1,
        ui_component: "text",
      });
    });

    it(`Should post and return the attribute table with the uuid${uuids.attributeTableUuid}`, async () => {
      const resTable = await server
        .post(`/metamodel/attributes/${uuids.attributeTableUuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.attributeTableUuid,
          name: "Table",
          description: "Table of the element",
          attribute_type: {
            uuid: uuids.attributeTypeTableUuid,
            has_table_attribute: [
              {
                attribute: {
                  uuid: uuids.attributeCol1Uuid,
                  name: "column1",
                  description: "column 1 of the table",
                  attribute_type: {
                    uuid: uuids.attributeTypeCol1Uuid,
                    name: "column1_type",
                    pre_defined: false,
                    regex_value: "",
                  },
                },
                sequence: 1,
              },
              {
                attribute: {
                  uuid: uuids.attributeCol2Uuid,
                  name: "column2",
                  description: "column 2 of the table",
                  attribute_type: {
                    uuid: uuids.attributeTypeCol2Uuid,
                    name: "column2_type",
                    pre_defined: false,
                    regex_value: "",
                  },
                },
                sequence: 2,
              },
              {
                attribute: {
                  uuid: uuids.attributeCol3Uuid,
                  name: "column3",
                  description: "column 3 of the table",
                  attribute_type: {
                    uuid: uuids.attributeTypeCol3Uuid,
                    name: "column3_type",
                    pre_defined: false,
                    regex_value: "",
                  },
                },
                sequence: 3,
              },
            ],
          },
        });
      expect(resTable).to.exist;
      expect(resTable.status).to.equal(201);
      expect(resTable.body.attribute_type).to.deep.include({
        uuid: uuids.attributeTypeTableUuid,
      });
    });
  });

  describe("PATCH Metamodel attributes", function () {
    it(`should patch the class attribute with the uuid${uuids.attributeUuid2} sequence and ui component`, async () => {
      const res1 = await server
        .patch(`/metamodel/classes/${uuids.classUuid}/attributes`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.attributeUuid2,
          name: "Name_updated",
          sequence: 2,
          min: 10,
          ui_component: "text_updated",
          description: "Name of the element",
        });
      expect(res1).to.exist;
      expect(res1.status).to.equal(200);
      expect(res1.body[0]).to.deep.include({
        uuid: uuids.attributeUuid2,
        name: "Name_updated",
        sequence: 2,
        min: 10,
        ui_component: "text_updated",
      });
    });
  });

  describe("GET Metamodel attributes", function () {
    it(`Should return the attribute with the uuid${uuids.attributeUuid}`, async () => {
      const res1 = await server
        .get(`/metamodel/attributes/${uuids.attributeUuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(res1).to.exist;
      expect(res1.status).to.equal(200);
      expect(res1.body).to.deep.include({
        uuid: uuids.attributeUuid,
        name: "Name",
        description: "Name of the element",
        default_value: "John Doe",
        uuid_metaobject: uuids.attributeUuid,
        attribute_type_uuid: uuids.attributeTypeUuid,
      });
      expect(res1.body.attribute_type).to.deep.include({
        uuid: uuids.attributeTypeUuid,
      });
    });

    it(`Should return the attribute table with the uuid${uuids.attributeTableUuid}`, async () => {
      const resTable = await server
        .get(`/metamodel/attributes/${uuids.attributeTableUuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(resTable).to.exist;
      expect(resTable.status).to.equal(200);
      expect(resTable.body.attribute_type).to.deep.include({
        uuid: uuids.attributeTypeTableUuid,
      });
    });
  });

  describe("DELETE Metamodel attributes", function () {
    it(`Should delete and return the uuid${uuids.attributeTypeUuid}`, async () => {
      const res1 = await server
        .delete(`/metamodel/attributes/${uuids.attributeUuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(res1).to.exist;
      expect(res1.status).to.equal(200);
      expect(res1.body).to.deep.include(
        uuids.attributeUuid,
        "Should delete the attribute",
      );
      expect(res1.body).not.to.deep.include(
        uuids.attributeTypeUuid,
        "Should not delete the attribute type",
      );
      expect(res1.body).not.to.deep.include(
        uuids.classUuid,
        "Should not delete the class",
      );
    });

    it(`Should delete and return the attribute table with the uuid${uuids.attributeTableUuid}`, async () => {
      const resTable = await server
        .delete(`/metamodel/attributes/${uuids.attributeTableUuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(resTable).to.exist;
      expect(resTable.status).to.equal(200);
      expect(resTable.body).to.deep.include(uuids.attributeTableUuid);
    });

    it(`should delete the attribute${uuids.attributeUuid3} but not the sceneType${uuids.sceneTypeUuid}`, async () => {
      await server
        .post(`/metamodel/sceneTypes`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.sceneTypeUuid,
          name: "test Scenetype",
          description: "This is test scenetype",
          attributes: [
            {
              uuid: uuids.attributeUuid3,
              name: "Name",
              description: "Name of the element",
              attribute_type: {
                uuid: uuids.attributeTypeUuid,
              },
            },
          ],
        });

      const res1 = await server
        .delete(`/metamodel/attributes/${uuids.attributeUuid3}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);

      expect(res1).to.exist;
      expect(res1.status).to.equal(200);
      expect(res1.body).to.deep.include(uuids.attributeUuid3);
      expect(res1.body).not.to.deep.include(uuids.attributeTypeUuid);
      expect(res1.body).not.to.deep.include(uuids.sceneTypeUuid);
    });

    it(`should delete the attribute${uuids.attributeUuid4} but not the port${uuids.portUuid}`, async () => {
      await server
        .post(`/metamodel/ports/${uuids.portUuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.portUuid,
          name: "port test",
          uuid_class: uuids.classUuid,
          attributes: [
            {
              uuid: uuids.attributeUuid4,
              name: "Name",
              description: "Name of the element",
              attribute_type: {
                uuid: uuids.attributeTypeUuid,
              },
            },
          ],
        });
      const res1 = await server
        .delete(`/metamodel/attributes/${uuids.attributeUuid4}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);

      expect(res1).to.exist;
      expect(res1.status).to.equal(200);
      expect(res1.body).to.deep.include(uuids.attributeUuid4);
      expect(res1.body).not.to.deep.include(uuids.attributeTypeUuid);
      expect(res1.body).not.to.deep.include(uuids.portUuid);
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
          attributes: [
            {
              uuid: uuids.attributeUuid6,
              name: "Name",
              sequence: 1,
              ui_component: "text",
              description: "Name of the element",
              attribute_type: {
                uuid: uuids.attributeTypeUuid,
              },
            },
          ],
        });
      await server
        .post(`/instances/classesInstances/${uuids.classInstanceUuid1}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.classInstanceUuid1,
          uuid_class: uuids.classUuid6,
          name: "test class instance",
        });

      await server
        .post(
          `/instances/classesInstances/${uuids.classInstanceUuid1}/attributesInstances`,
        )
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send([
          {
            uuid: uuids.attributeInstanceUuid,
            uuid_attribute: uuids.attributeUuid6,
            value: "Test role reference",
          },
        ]);

      const res1 = await server
        .delete(`/metamodel/attributes/${uuids.attributeUuid6}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(res1).to.exist;
      expect(res1.status).to.equal(409);
      expect(res1.text).to.include(uuids.attributeInstanceUuid);
    });
  });
});
