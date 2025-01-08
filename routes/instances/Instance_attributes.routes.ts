import { Router } from "express";
import Instance_attribute_controller from "../../controllers/instance/Instance_attributes.controller";
import { verif_attribute_instance_body } from "../../data/services/rule_engine/instance_rule_engine/Instance_attributes.verificator";
import { authenticate_token } from "../../data/services/middleware/auth.middleware";

/**
 * @description - These are the routes for the attributes instances.
 * @type {Router}
 */
const attributeInstanceRouter = Router();

attributeInstanceRouter.get(
  /*
  #swagger.tags= [
    "Instance"
  ]
  #swagger.summary= "Get an attribute instance by uuid"
  #swagger.responses[200]= {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/AttributeInstance"
        }
      }
    }
  }
  #swagger.responses[400]= {
    "description": "Invalid uuid supplied",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  #swagger.responses[404]= {
    "description": "Attribute instance not found",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  */
  "/attributesInstances/:uuid",
  authenticate_token,
  Instance_attribute_controller.get_attribute_instance_by_uuid
);

attributeInstanceRouter.patch(
  /*
  #swagger.tags= [
    "Instance"
  ]
  #swagger.summary= "Update an attribute instance"
  #swagger.requestBody= {
    "description": "Updated attribute instance object",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/AttributeInstance"
        }
      }
    },
    "required": true
  }
  #swagger.responses[200]= {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/AttributeInstance"
        }
      }
    }
  }
  #swagger.responses[400]= {
    "description": "Invalid payload supplied",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  #swagger.responses[404]= {
    "description": "Attribute instance not found",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  */
  "/attributesInstances/:uuid",
  verif_attribute_instance_body,
  authenticate_token,
  Instance_attribute_controller.patch_attribute_instance_by_uuid
);

attributeInstanceRouter.post(
  /*
  #swagger.tags= [
    "Instance"
  ]
  #swagger.summary= "Create an attribute instance"
  #swagger.requestBody= {
    "description": "New attribute instance object",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/AttributeInstance"
        }
      }
    },
    "required": true
  }
  #swagger.responses[200]= {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/AttributeInstance"
        }
      }
    }
  }
  #swagger.responses[400]= {
    "description": "Invalid payload supplied",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  */
  "/attributesInstances/:uuid",
  verif_attribute_instance_body,
  authenticate_token,
  Instance_attribute_controller.post_attribute_instance_by_uuid
);

attributeInstanceRouter.delete(
  /*
  #swagger.tags= [
    "Instance"
  ]
  #swagger.summary= "Delete an attribute instance"
  #swagger.responses[204]= {
    "description": "Attribute instance deleted successfully"
  }
  #swagger.responses[400]= {
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
  "/attributesInstances/:uuid",
  authenticate_token,
  Instance_attribute_controller.delete_attribute_instance_by_uuid
);

// -----------------------------------------------------------------------------
// For classesInstance
// -----------------------------------------------------------------------------

attributeInstanceRouter.get(
  "/classesInstances/:uuid/attributesInstances",
  authenticate_token,
  Instance_attribute_controller.get_attribute_instance_for_class
);

attributeInstanceRouter.post(
  "/classesInstances/:uuid/attributesInstances",
  verif_attribute_instance_body,
  authenticate_token,
  Instance_attribute_controller.post_attribute_instance_for_class
);

attributeInstanceRouter.delete(
  "/classesInstances/:uuid/attributesInstances",
  authenticate_token,
  Instance_attribute_controller.delete_attribute_instance_for_class
);

// -----------------------------------------------------------------------------
// For relationClassInstance
// -----------------------------------------------------------------------------

attributeInstanceRouter.get(
  "/relationclassesInstances/:uuid/attributesInstances",
  authenticate_token,
  Instance_attribute_controller.get_attribute_instance_for_class
);

attributeInstanceRouter.post(
  "/relationclassesInstances/:uuid/attributesInstances",
  verif_attribute_instance_body,
  authenticate_token,
  Instance_attribute_controller.post_attribute_instance_for_class
);

attributeInstanceRouter.delete(
  "/relationclassesInstances/:uuid/attributesInstances",
  authenticate_token,
  Instance_attribute_controller.delete_attribute_instance_for_class
);

// -----------------------------------------------------------------------------
// For sceneInstance
// -----------------------------------------------------------------------------

attributeInstanceRouter.get(
  "/sceneInstances/:uuid/attributesInstances",
  authenticate_token,
  Instance_attribute_controller.get_attribute_instance_for_scene
);

attributeInstanceRouter.post(
  "/sceneInstances/:uuid/attributesInstances",
  verif_attribute_instance_body,
  authenticate_token,
  Instance_attribute_controller.post_attribute_instance_for_scene
);

attributeInstanceRouter.delete(
  "/sceneInstances/:uuid/attributesInstances",
  authenticate_token,
  Instance_attribute_controller.delete_attribute_instance_for_scene
);

export default attributeInstanceRouter;
