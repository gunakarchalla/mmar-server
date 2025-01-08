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

describe("Metamodel attributesTypes tests", function () {
  const server = chai.request(API_URL);
  const setup = TestEnvironmentSetup.getInstance(API_URL);

  this.timeout(TIMEOUT);
  let token: string;

  let client: PoolClient;

  const uuids = {
    attributeTypeUuid: uuidv4(),
    attributeTableUuid: uuidv4(),
    attributeCol1Uuid: uuidv4(),
    attributeTypeCol1Uuid: uuidv4(),
    attributeCol2Uuid: uuidv4(),
    attributeTypeCol2Uuid: uuidv4(),
    attributeCol3Uuid: uuidv4(),
    attributeTypeCol3Uuid: uuidv4(),
    attributeTypeUuid2: uuidv4(),
    attributeUuid: uuidv4(),
  };
  before(async () => {
    ({ client, token } = await setup.setupTestEnvironment());
  });

  after(async () => {
    await setup.tearDown(client, Object.values(uuids));
  });
  describe("POST Metamodel attributeTypes", function () {
    it(`Should post and return the attribute type of uuid ${uuids.attributeTypeUuid}`, async () => {
      const res1 = await server
        .post(`/metamodel/attributeTypes/${uuids.attributeTypeUuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.attributeTypeUuid,
          name: "String",
          pre_defined: true,
          regex_value:
            "^([\\x09\\x0A\\x0D\\x20-\\x7E]|[\\xC2-\\xDF][\\x80-\\xBF]|\\xE0[\\xA0-\\xBF][\\x80-\\xBF]|[\\xE1-\\xEC\\xEE\\xEF][\\x80-\\xBF]{2}|\\xED[\\x80-\\x9F][\\x80-\\xBF]|\\xF0[\\x90-\\xBF][\\x80-\\xBF]{2}|[\\xF1-\\xF3][\\x80-\\xBF]{3}|\\xF4[\\x80-\\x8F][\\x80-\\xBF]{2})*$",
        });
      expect(res1).to.exist;
      expect(res1.status).to.equal(201);
      expect(res1.body).to.deep.include({
        uuid: uuids.attributeTypeUuid,
        name: "String",
        pre_defined: true,
        regex_value:
          "^([\\x09\\x0A\\x0D\\x20-\\x7E]|[\\xC2-\\xDF][\\x80-\\xBF]|\\xE0[\\xA0-\\xBF][\\x80-\\xBF]|[\\xE1-\\xEC\\xEE\\xEF][\\x80-\\xBF]{2}|\\xED[\\x80-\\x9F][\\x80-\\xBF]|\\xF0[\\x90-\\xBF][\\x80-\\xBF]{2}|[\\xF1-\\xF3][\\x80-\\xBF]{3}|\\xF4[\\x80-\\x8F][\\x80-\\xBF]{2})*$",
      });
    });

    it(`Should post and return an attribute table of uuid ${uuids.attributeTableUuid}`, async () => {
      const resTable = await server
        .post(`/metamodel/attributeTypes/${uuids.attributeTableUuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.attributeTableUuid,
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
        });
      expect(resTable).to.exist;
      expect(resTable.status).to.equal(201);
      expect(resTable.body.has_table_attribute[0].attribute).to.deep.include({
        uuid: uuids.attributeCol1Uuid,
        name: "column1",
        description: "column 1 of the table",
        uuid_metaobject: uuids.attributeCol1Uuid,
        attribute_type_uuid: uuids.attributeTypeCol1Uuid,
      });
      expect(resTable.body.has_table_attribute[0].sequence).to.equal(1);

      expect(resTable.body.has_table_attribute[1].attribute).to.deep.include({
        uuid: uuids.attributeCol2Uuid,
        name: "column2",
        description: "column 2 of the table",
        uuid_metaobject: uuids.attributeCol2Uuid,
        attribute_type_uuid: uuids.attributeTypeCol2Uuid,
      });
      expect(resTable.body.has_table_attribute[1].sequence).to.equal(2);

      expect(resTable.body.has_table_attribute[2].attribute).to.deep.include({
        uuid: uuids.attributeCol3Uuid,
        name: "column3",
        description: "column 3 of the table",
        uuid_metaobject: uuids.attributeCol3Uuid,
        attribute_type_uuid: uuids.attributeTypeCol3Uuid,
      });
      expect(resTable.body.has_table_attribute[2].sequence).to.equal(3);
    });
  });

  describe("GET Metamodel attributeTypes", function () {
    it(`Should return the attribute type of uuid ${uuids.attributeTypeUuid}`, async () => {
      const res1 = await server
        .get(`/metamodel/attributeTypes/${uuids.attributeTypeUuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(res1).to.exist;
      expect(res1.status).to.equal(200);
      expect(res1.body).to.deep.include({
        uuid: uuids.attributeTypeUuid,
        name: "String",
        pre_defined: true,
        regex_value:
          "^([\\x09\\x0A\\x0D\\x20-\\x7E]|[\\xC2-\\xDF][\\x80-\\xBF]|\\xE0[\\xA0-\\xBF][\\x80-\\xBF]|[\\xE1-\\xEC\\xEE\\xEF][\\x80-\\xBF]{2}|\\xED[\\x80-\\x9F][\\x80-\\xBF]|\\xF0[\\x90-\\xBF][\\x80-\\xBF]{2}|[\\xF1-\\xF3][\\x80-\\xBF]{3}|\\xF4[\\x80-\\x8F][\\x80-\\xBF]{2})*$",
      });
    });

    it(`Should return an attribute table of uuid ${uuids.attributeTableUuid}`, async () => {
      const resTable = await server
        .get(`/metamodel/attributeTypes/${uuids.attributeTableUuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(resTable).to.exist;
      expect(resTable.status).to.equal(200);
      expect(resTable.body.has_table_attribute[0].attribute).to.deep.include({
        uuid: uuids.attributeCol1Uuid,
        name: "column1",
        description: "column 1 of the table",
        uuid_metaobject: uuids.attributeCol1Uuid,
        attribute_type_uuid: uuids.attributeTypeCol1Uuid,
      });
      expect(resTable.body.has_table_attribute[0].sequence).to.equal(1);

      expect(resTable.body.has_table_attribute[1].attribute).to.deep.include({
        uuid: uuids.attributeCol2Uuid,
        name: "column2",
        description: "column 2 of the table",
        uuid_metaobject: uuids.attributeCol2Uuid,
        attribute_type_uuid: uuids.attributeTypeCol2Uuid,
      });
      expect(resTable.body.has_table_attribute[1].sequence).to.equal(2);

      expect(resTable.body.has_table_attribute[2].attribute).to.deep.include({
        uuid: uuids.attributeCol3Uuid,
        name: "column3",
        description: "column 3 of the table",
        uuid_metaobject: uuids.attributeCol3Uuid,
        attribute_type_uuid: uuids.attributeTypeCol3Uuid,
      });
      expect(resTable.body.has_table_attribute[2].sequence).to.equal(3);
    });
  });

  describe("DELETE Metamodel attributesTypes", function () {
    it(`Should delete and return the uuid ${uuids.attributeTypeUuid}`, async () => {
      const res1 = await server
        .delete(`/metamodel/attributeTypes/${uuids.attributeTypeUuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(res1).to.exist;
      expect(res1.status).to.equal(200);
      expect(res1.body).to.deep.include(uuids.attributeTypeUuid);
    });

    it(`Should delete and return the uuid ${uuids.attributeTableUuid}`, async () => {
      const resTable = await server
        .delete(`/metamodel/attributeTypes/${uuids.attributeTableUuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(resTable).to.exist;
      expect(resTable.status).to.equal(200);
      expect(resTable.body).to.deep.include(uuids.attributeTableUuid);
    });

    it(`should restrict the deletion of the attribute type ${uuids.attributeTypeUuid2}`, async () => {
      await server
        .post(`/metamodel/attributes/${uuids.attributeUuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send({
          uuid: uuids.attributeUuid,
          name: "Name",
          description: "Name of the element",
          attribute_type: {
            uuid: uuids.attributeTypeUuid2,
            name: "Test attrType",
          },
        });
      const res1 = await server
        .delete(`/metamodel/attributeTypes/${uuids.attributeTypeUuid2}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(res1).to.exist;
      expect(res1.status).to.equal(409);
      expect(res1.text).to.include(uuids.attributeUuid);
    });
  });
});
