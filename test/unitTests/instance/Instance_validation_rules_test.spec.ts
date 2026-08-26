import chai from "chai";
import chaiHttp from "chai-http";
import "mocha";
import {PoolClient} from "pg";
import {v4 as uuidv4} from "uuid";
import {TestEnvironmentSetup} from "../TestEnvironmentSetup";

process.env.NODE_ENV = "test";
chai.use(chaiHttp);
const expect = chai.expect;
const API_URL = "http://localhost:8000";
const TIMEOUT = 60000;
const server = chai.request(API_URL);

/**
 * @description - The two rules the instance rule engine actually applies.
 *
 * metaObjectExists answers a yes/no question that used to be answered by loading
 * the whole meta subtree and testing it against undefined; it now runs the same
 * WHERE clause as a single row, memoised for the request. These tests pin the
 * answers, in both directions: the right kind of meta object is accepted and the
 * wrong kind is not, which is what stops a class instance naming a port.
 *
 * regexExValidator never enforced anything — its guard read `length === 0` where
 * it meant `> 0`, so it was skipped exactly when there was a regex to apply. It
 * enforces now, which is a deliberate behaviour change, so what it accepts and
 * refuses is worth stating.
 */
describe("Instance validation rules", function () {
    this.timeout(TIMEOUT);
    const setup = TestEnvironmentSetup.getInstance(API_URL);

    let token: string;
    let client: PoolClient;

    const uuids = {
        sceneTypeUuid: uuidv4(),
        classUuid: uuidv4(),
        portUuid: uuidv4(),
        digitsAttributeUuid: uuidv4(),
        digitsAttributeTypeUuid: uuidv4(),
        freeAttributeUuid: uuidv4(),
        freeAttributeTypeUuid: uuidv4(),
        sceneInstanceUuid: uuidv4(),
    };

    /** @description - Uuids minted per test, swept up in tearDown. */
    const spent: string[] = [];
    const fresh = () => {
        const uuid = uuidv4();
        spent.push(uuid);
        return uuid;
    };

    /**
     * @description - A scene holding one class instance with one attribute.
     * @param {object} attribute - What to put on the attribute instance.
     * @param {string} classUuid - The meta class the class instance names.
     * @returns {object} - The scene instance body.
     */
    function scene_with(
        attribute: Record<string, unknown>,
        classUuid: string = uuids.classUuid
    ): Record<string, unknown> {
        const classInstanceUuid = fresh();
        return {
            uuid: uuids.sceneInstanceUuid,
            uuid_scene_type: uuids.sceneTypeUuid,
            name: "validation scene",
            class_instances: [
                {
                    uuid: classInstanceUuid,
                    uuid_class: classUuid,
                    name: "node",
                    geometry: "",
                    attribute_instance: [
                        {
                            uuid: fresh(),
                            assigned_uuid_class_instance: classInstanceUuid,
                            ...attribute,
                        },
                    ],
                },
            ],
        };
    }

    const patch = async (body: Record<string, unknown>) =>
        server
            .patch(`/instances/sceneInstances/${uuids.sceneInstanceUuid}`)
            .set("content-type", "application/json")
            .set("accept", "application/json")
            .set("Cookie", "authcookie=" + token)
            .send(body);

    before(async () => {
        ({client, token} = await setup.setupTestEnvironment());

        const created = await server
            .post("/metamodel/sceneTypes")
            .set("content-type", "application/json")
            .set("accept", "application/json")
            .set("Cookie", "authcookie=" + token)
            .send({
                uuid: uuids.sceneTypeUuid,
                name: "Validation scene type",
                classes: [
                    {
                        uuid: uuids.classUuid,
                        name: "Node",
                        is_reusable: true,
                        is_abstract: false,
                        geometry: "",
                        attributes: [
                            {
                                uuid: uuids.digitsAttributeUuid,
                                name: "digits_only",
                                attribute_type: {
                                    uuid: uuids.digitsAttributeTypeUuid,
                                    name: "DigitsOnly",
                                    pre_defined: true,
                                    default_value: "0",
                                    regex_value: "^[0-9]+$",
                                },
                            },
                            {
                                uuid: uuids.freeAttributeUuid,
                                name: "anything",
                                attribute_type: {
                                    uuid: uuids.freeAttributeTypeUuid,
                                    name: "Unconstrained",
                                    pre_defined: true,
                                    default_value: "",
                                },
                            },
                        ],
                        ports: [
                            {
                                uuid: uuids.portUuid,
                                name: "Node port",
                                uuid_class: uuids.classUuid,
                                geometry: "",
                            },
                        ],
                    },
                ],
            });
        expect(created.status).to.equal(201);
    });

    after(async function () {
        await setup.tearDown(client, [...Object.values(uuids), ...spent]);
    });

    describe("regexExValidator", function () {
        it("accepts a value that matches the regex of its attribute type", async function () {
            const res = await patch(
                scene_with({uuid_attribute: uuids.digitsAttributeUuid, value: "12345"})
            );
            expect(res.status).to.equal(200);
        });

        it("refuses a value that does not match", async function () {
            const res = await patch(
                scene_with({
                    uuid_attribute: uuids.digitsAttributeUuid,
                    value: "not digits at all",
                })
            );
            expect(res.status).to.equal(403);
            expect(res.body.error).to.contain("does not match the regex");
        });

        it("accepts any value when the attribute type states no regex", async function () {
            const res = await patch(
                scene_with({
                    uuid_attribute: uuids.freeAttributeUuid,
                    value: "anything at all: 12345 !@#",
                })
            );
            expect(res.status).to.equal(200);
        });

        // There is nothing to test a constraint against, and reading .match() off
        // a missing value is how the rule used to throw a 500 rather than a 403.
        it("accepts an attribute instance carrying no value", async function () {
            const res = await patch(
                scene_with({uuid_attribute: uuids.digitsAttributeUuid})
            );
            expect(res.status).to.equal(200);
        });
    });

    describe("metaObjectExists", function () {
        it("refuses an attribute instance naming a meta attribute that does not exist", async function () {
            const ghost = uuidv4();
            const res = await patch(
                scene_with({uuid_attribute: ghost, value: "1"})
            );
            expect(res.status).to.equal(403);
            expect(res.body.error).to.contain(`The meta attribute ${ghost} does not exist`);
        });

        it("refuses a class instance naming a meta class that does not exist", async function () {
            const ghost = uuidv4();
            const res = await patch(
                scene_with(
                    {uuid_attribute: uuids.digitsAttributeUuid, value: "1"},
                    ghost
                )
            );
            expect(res.status).to.equal(403);
            expect(res.body.error).to.contain(`The meta class ${ghost} does not exist`);
        });

        // The uuid resolves to a real metaobject, just not one of the kind the
        // rule asks about. A predicate that only checked the metaobject table
        // would pass this.
        it("refuses a class instance naming a port instead of a class", async function () {
            const res = await patch(
                scene_with(
                    {uuid_attribute: uuids.digitsAttributeUuid, value: "1"},
                    uuids.portUuid
                )
            );
            expect(res.status).to.equal(403);
            expect(res.body.error).to.contain(`The meta class ${uuids.portUuid} does not exist`);
        });
    });
});
