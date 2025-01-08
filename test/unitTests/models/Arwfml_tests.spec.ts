import chai from "chai";
import chaiHttp from "chai-http";
import "mocha";
import { PoolClient } from "pg";
import { TestEnvironmentSetup } from "../TestEnvironmentSetup";

import activityAndWorkspaceModel from "./activity_and_workspace_model.json";
import archiMateApplicationLayerMetamodel from "./ArchiMate_ApplicationLayer_metamodel.json";
import archiMateBusinessLayerMetamodel from "./ArchiMate_BusinessLayer_metamodel.json";
import archiMateCoreLayersMetamodel from "./ArchiMate_coreLayers_metamodel.json";
import archiMateTechnologyLayerMetamodel from "./ArchiMate_TechnologyLayer_metamodel.json";
import bpmnMetamodel from "./bpmn_metamodel.json";
import e3ValueMetamodel from "./e3-value_metamodel.json";
import flowScene from "./FlowScene.json";
import objectSpace from "./ObjectSpace.json";
import stateChange from "./Statechange.json";

process.env.NODE_ENV = "test";
chai.use(chaiHttp);
const expect = chai.expect;
const API_URL = "http://localhost:8000";
const TIMEOUT = 30000;

describe("ARWFML tests", async function () {
  const server = chai.request(API_URL);
  const setup = TestEnvironmentSetup.getInstance(API_URL);

  this.timeout(TIMEOUT);
  let token: string;

  let client: PoolClient;
  before(async () => {
    ({ client, token } = await setup.setupTestEnvironment());
  });

  after(async () => {
    await setup.tearDown(client, ["a3b35b86-2636-4987-8cc4-814f468f6c4b"]);
  });

  const postModel = (modelName: string, modelData: any) => {
    it(`Should post and return the ${modelName} model`, async () => {
      const res1 = await server
        .post(`/metamodel/sceneTypes/`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token)
        .send(modelData);
      expect(res1).to.exist;
      expect(res1.status).to.equal(200);
    });
  };

  const deleteModel = (modelName: string, modelUuid: string) => {
    it(`Should delete the ${modelName} model`, async () => {
      const res1 = await server
        .post(`/metamodel/sceneTypes/${modelUuid}`)
        .set("content-type", "application/json")
        .set("accept", "application/json")
        .set("Cookie", "authcookie=" + token);
      expect(res1).to.exist;
      expect(res1.status).to.equal(200);
    });
  };

  describe("POST Activity and Workspace Model", function () {
    postModel("Activity and Workspace Model", activityAndWorkspaceModel);
  });

  describe("POST ArchiMate Application Layer Metamodel", function () {
    postModel(
      "ArchiMate Application Layer Metamodel",
      archiMateApplicationLayerMetamodel,
    );
  });

  describe("POST ArchiMate Business Layer Metamodel", function () {
    postModel(
      "ArchiMate Business Layer Metamodel",
      archiMateBusinessLayerMetamodel,
    );
  });

  describe("POST ArchiMate Core Layers Metamodel", function () {
    postModel("ArchiMate Core Layers Metamodel", archiMateCoreLayersMetamodel);
  });

  describe("POST ArchiMate Technology Layer Metamodel", function () {
    postModel(
      "ArchiMate Technology Layer Metamodel",
      archiMateTechnologyLayerMetamodel,
    );
  });

  describe("POST BPMN Metamodel", function () {
    postModel("BPMN Metamodel", bpmnMetamodel);
  });

  describe("POST E3-Value Metamodel", function () {
    postModel("E3-Value Metamodel", e3ValueMetamodel);
  });

  describe("POST Flow Scene", function () {
    postModel("Flow Scene", flowScene);
  });

  describe("POST Object Space", function () {
    postModel("Object Space", objectSpace);
  });

  describe("POST State Change", function () {
    postModel("State Change", stateChange);
  });

  describe("DELETE Activity and Workspace Model", function () {
    deleteModel(
      "ActivityAndWorkspaceModel",
      "ac2530cc-84d0-4959-94ad-742b4cb76960",
    );
  });

  describe("DELETE ArchiMate Application Layer Metamodel", function () {
    deleteModel(
      "ArchiMateApplicationLayerMetamodel",
      "b3b35b86-2636-4987-8cc4-814f468f6c4b",
    );
  });

  describe("DELETE ArchiMate Business Layer Metamodel", function () {
    deleteModel(
      "ArchiMateBusinessLayerMetamodel",
      "c3b35b86-2636-4987-8cc4-814f468f6c4b",
    );
  });

  describe("DELETE ArchiMate Core Layers Metamodel", function () {
    deleteModel(
      "ArchiMateCoreLayersMetamodel",
      "d3b35b86-2636-4987-8cc4-814f468f6c4b",
    );
  });

  describe("DELETE ArchiMate Technology Layer Metamodel", function () {
    deleteModel(
      "ArchiMateTechnologyLayerMetamodel",
      "e3b35b86-2636-4987-8cc4-814f468f6c4b",
    );
  });

  describe("DELETE BPMN Metamodel", function () {
    deleteModel("BPMNMetamodel", "f3b35b86-2636-4987-8cc4-814f468f6c4b");
  });

  describe("DELETE E3-Value Metamodel", function () {
    deleteModel("E3-ValueMetamodel", "g3b35b86-2636-4987-8cc4-814f468f6c4b");
  });

  describe("DELETE Flow Scene", function () {
    deleteModel("FlowScene", "h3b35b86-2636-4987-8cc4-814f468f6c4b");
  });

  describe("DELETE Object Space", function () {
    deleteModel("ObjectSpace", "i3b35b86-2636-4987-8cc4-814f468f6c4b");
  });

  describe("DELETE State Change", function () {
    deleteModel("StateChange", "j3b35b86-2636-4987-8cc4-814f468f6c4b");
  });
});
