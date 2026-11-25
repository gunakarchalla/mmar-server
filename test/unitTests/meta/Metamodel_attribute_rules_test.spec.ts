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

/**
 * @description - The rules that hold a metamodel's own values to the regular
 * expressions the metamodel states (see Metamodel_attributes.rules).
 *
 * An attribute's default value is what every instance of it starts out holding, and its
 * facets are what a modeller may put in it. Saving either in a form the attribute type
 * refuses builds a metamodel whose models cannot be saved: the instance rule refuses the
 * value later, and the modeling client answers that 403 by rolling the whole scene back.
 *
 * The cases below go through the routes rather than through the connections, because
 * that is where the refusal has to happen: a scene type carries its classes, and those
 * carry their attributes, so importing a metamodel writes attributes that never pass
 * their own routes — and a refusal raised inside the write comes back as an opaque 500
 * instead of the 403 it is.
 */
describe("Metamodel attribute value rules", function () {
  const server = chai.request(API_URL);
  const setup = TestEnvironmentSetup.getInstance(API_URL);

  this.timeout(TIMEOUT);
  let token: string;
  let client: PoolClient;

  const uuids = {
    sceneTypeUuid: uuidv4(),
    classUuid: uuidv4(),
    digitsTypeUuid: uuidv4(),
    digitsAttributeUuid: uuidv4(),
    brokenTypeUuid: uuidv4(),
  };

  const post = (path: string, body: object) =>
    server
      .post(path)
      .set("content-type", "application/json")
      .set("accept", "application/json")
      .set("Cookie", "authcookie=" + token)
      .send(body);

  const patch = (path: string, body: object) =>
    server
      .patch(path)
      .set("content-type", "application/json")
      .set("accept", "application/json")
      .set("Cookie", "authcookie=" + token)
      .send(body);

  /**
   * @description - A scene type holding one class with one attribute of a type that
   * only accepts digits.
   * @param {object} attribute - The default value and facets to give the attribute.
   * @returns {object} - The scene type body.
   */
  const scene_type_with = (attribute: object) => ({
    uuid: uuids.sceneTypeUuid,
    name: "attribute rule scene type",
    classes: [
      {
        uuid: uuids.classUuid,
        name: "Node",
        geometry: "",
        attributes: [
          {
            uuid: uuids.digitsAttributeUuid,
            name: "digits_only",
            ...attribute,
            attribute_type: {
              uuid: uuids.digitsTypeUuid,
              name: "DigitsOnly",
              regex_value: "^[0-9]+$",
            },
          },
        ],
      },
    ],
  });

  before(async () => {
    ({ client, token } = await setup.setupTestEnvironment());
  });

  after(async () => {
    await setup.tearDown(client, Object.values(uuids));
  });

  it("refuses an attribute nested in a scene type whose default value its type does not allow", async () => {
    // Empty is the value an attribute holds until someone fills it in, and a type that
    // wants digits does not allow it: this attribute needs a default.
    const res = await post("/metamodel/sceneTypes", scene_type_with({ default_value: "" }));
    expect(res.status).to.equal(403);
    expect(res.body.error).to.contain("default value");
  });

  it("refuses a facet the attribute type does not allow", async () => {
    const res = await post(
      "/metamodel/sceneTypes",
      scene_type_with({ default_value: "1", facets: "1|two|3" }),
    );
    expect(res.status).to.equal(403);
    expect(res.body.error).to.contain("two");
  });

  it("refuses an attribute type whose regular expression cannot be compiled", async () => {
    // Typed by hand, so "^([unclosed" is a SyntaxError rather than a pattern that
    // refuses everything - stored, it would be a rule no client could apply.
    const res = await post(`/metamodel/attributeTypes/${uuids.brokenTypeUuid}`, {
      uuid: uuids.brokenTypeUuid,
      name: "broken pattern",
      regex_value: "^([unclosed",
    });
    expect(res.status).to.equal(403);
    expect(res.body.error).to.contain("not a regular expression");
  });

  it("accepts the metamodel once its values fit", async () => {
    const res = await post(
      "/metamodel/sceneTypes",
      scene_type_with({ default_value: "7", facets: "1|2|3" }),
    );
    expect(res.status).to.equal(201);
  });

  it("accepts narrowing a regular expression, leaving its attributes to answer for themselves", async () => {
    // An attribute type is the more fundamental object: it is saved on the strength of
    // its own pattern. The attribute whose default is now "7" is refused when THAT
    // attribute is saved, the way an attribute instance is refused against its
    // attribute - each level answers to the one above it as it is written.
    const res = await patch(`/metamodel/attributeTypes/${uuids.digitsTypeUuid}`, {
      uuid: uuids.digitsTypeUuid,
      name: "DigitsOnly",
      regex_value: "^[0-5]$",
    });
    expect(res.status).to.equal(200);
  });

  it("refuses the attribute whose default the narrowed expression no longer allows", async () => {
    const res = await patch(`/metamodel/attributes/${uuids.digitsAttributeUuid}`, {
      uuid: uuids.digitsAttributeUuid,
      name: "digits_only",
      default_value: "7",
    });
    expect(res.status).to.equal(403);
    expect(res.body.error).to.contain("default value");
  });
});
