import { Router } from "express";
import Instance_bendpoint_controller from "../../controllers/instance/Instance_bendpoints.controller";
import { verif_class_instance_body } from "../../data/services/rule_engine/instance_rule_engine/Instance_classes.verificator";
import { authenticate_token } from "../../data/services/middleware/auth.middleware";

/**
 * @description - These are the routes for the bendpoints instances.
 * @type {Router}
 */
const bendpointInstanceRouter = Router();

bendpointInstanceRouter.patch(
  /*
  #swagger.tags = ['Instance']
  #swagger.summary = 'Update a bendpoint instance'
  #swagger.requestBody = {
      "description": "Updated bendpoint instance object",
      "content": {
          "application/json": {
              "schema": {
                  "$ref": "#/components/schemas/ClassInstance" 
              }
          }
      },
      "required": true
  }
  #swagger.responses[200] = {
      "description": "Successful operation",
      "content": {
          "application/json": {
              "schema": {
                  "$ref": "#/components/schemas/ClassInstance" 
              }
          }
      }
  }
  #swagger.responses[400] = {
      "description": "Invalid payload supplied",
      "content": {
          "application/json": {
              "schema": {
                  "$ref": "#/components/schemas/Error"
              }
          }
      }
  }
  #swagger.responses[404] = {
      "description": "Bendpoint instance not found",
      "content": {
          "application/json": {
              "schema": {
                  "$ref": "#/components/schemas/Error"
              }
          }
      }
  }
  */
  "/bendpointsInstances/:uuid",
  authenticate_token,
  Instance_bendpoint_controller.patch_bendpoint_instance_by_uuid 
);

bendpointInstanceRouter.delete(
  /*
  #swagger.tags = ['Instance']
  #swagger.summary = 'Delete a bendpoint instance'
  #swagger.responses[204] = {
      "description": "Bendpoint instance deleted successfully"
  }
  #swagger.responses[400] = {
      "description": "Invalid uuid supplied",
      "content": {
          "application/json": {
              "schema": {
                  "$ref": "#/components/schemas/Error"
              }
          }
      }
  }
  */
  "/bendpointsInstances/:uuid",
  authenticate_token,
  Instance_bendpoint_controller.delete_bendpoint_instances_by_uuid 
);

// -----------------------------------------------------------------------------
// For relationclassesInstances
// -----------------------------------------------------------------------------

bendpointInstanceRouter.get(
  /*
  #swagger.tags = ['Instance']
  #swagger.summary = 'Get all bendpoint instances of a relation class instance'
  #swagger.responses[200] = {
      "description": "Successful operation",
      "content": {
          "application/json": {
              "schema": {
                  "type": "array",
                  "items": {
                      "$ref": "#/components/schemas/ClassInstance"   
 
                  }
              }
          }
      }
  }
  #swagger.responses[400] = {
      "description": "Invalid uuid supplied",
      "content": {
          "application/json": {
              "schema": {
                  "$ref": "#/components/schemas/Error"
              }
          }
      }
  }
  #swagger.responses[404] = {
      "description": "Relation class instance not found",
      "content": {
          "application/json": {
              "schema": {
                  "$ref": "#/components/schemas/Error"
              }
          }
      }
  }
  */
  "/relationclassesInstances/:uuid/bendpointsInstances",
  authenticate_token,
  Instance_bendpoint_controller.get_bendpoint_instances_for_relationclass
);

bendpointInstanceRouter.post(
  /*
  #swagger.tags = ['Instance']
  #swagger.summary = 'Create a bendpoint instance for a relation class instance'
  #swagger.requestBody = {
      "description": "New bendpoint instance object",
      "content": {
          "application/json": {
              "schema": {
                  "$ref": "#/components/schemas/ClassInstance" 
              }
          }
      },
      "required": true
  }
  #swagger.responses[200] = {
      "description": "Successful operation",
      "content": {
          "application/json": {
              "schema": {
                  "$ref": "#/components/schemas/ClassInstance" 
              }
          }
      }
  }
  #swagger.responses[400] = {
      "description": "Invalid payload supplied",
      "content": {
          "application/json": {
              "schema": {
                  "$ref": "#/components/schemas/Error"
              }
          }
      }
  }
  #swagger.responses[404] = {
      "description": "Relation class instance not found",
      "content": {
          "application/json": {
              "schema": {
                  "$ref": "#/components/schemas/Error"
              }
          }
      }
  }
  */
  "/relationclassesInstances/:uuid/bendpointsInstances",
  verif_class_instance_body, 
  authenticate_token,
  Instance_bendpoint_controller.post_bendpoint_instance_by_uuid
);

export default bendpointInstanceRouter;
