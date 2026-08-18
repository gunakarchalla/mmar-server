import { Router } from "express";
import { custom_rules_object_instance_body } from "../../data/services/model_checking_rules/Metamodel_instanceobject_verificator_ocl";
import { authenticate_token } from "../../data/services/middleware/auth.middleware";

import bendpointInstanceRouter from "./Instance_bendpoints.routes";
import portInstanceRouter from "./Instance_ports.routes";
import attributeInstanceRouter from "./Instance_attributes.routes";
import sceneInstanceRouter from "./Instance_scenes.routes";
import relationClassInstanceRouter from "./Instance_relationclasses.routes";
import roleInstanceRouter from "./Instance_roles.routes";
import classInstanceRouter from "./Instance_classes.routes";
import { validate_uuid_params } from "../../data/services/middleware/uuid_params.middleware";

/** @description - This is the router for the Instance part of the project.
 * @type {Router}
 */
const instanceRouter = Router();

// A malformed uuid is a bad request, not a database error: without this the
// value reaches PostgreSQL, fails to cast, and comes back to the caller as a 500.
validate_uuid_params(instanceRouter);

instanceRouter.use(bendpointInstanceRouter);
instanceRouter.use(portInstanceRouter);
instanceRouter.use(attributeInstanceRouter);
instanceRouter.use(sceneInstanceRouter);
instanceRouter.use(relationClassInstanceRouter);
instanceRouter.use(roleInstanceRouter);
instanceRouter.use(classInstanceRouter);

instanceRouter.get(
  /*
  #swagger.tags = ['Instance']
  #swagger.summary = 'Test custom rules for object instances'
  #swagger.responses[200] = {
    "description": "Successful operation. Returns the results of the rule checks."
  }
  #swagger.responses[400] = {
    "description": "Invalid UUID or engine supplied",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  */
  "/objectInstance_rules_test/:uuid/",
  authenticate_token,
  custom_rules_object_instance_body
);

/*
select engine with /?engine=NAME
with NAME = {ocl,rools,nodeRules,jsonRulesEngine,trool}
example url: https://localhost:8001/instances/objectInstance_rules_test/f0ffdbb4-0d0c-4b38-983b-d927c785c02d/?engine=ocl
 */

export default instanceRouter;
