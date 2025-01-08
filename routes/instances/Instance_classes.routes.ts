import { Router } from "express";
import Instance_classes_controller from "../../controllers/instance/Instance_classes.controller";
import { verif_class_instance_body } from "../../data/services/rule_engine/instance_rule_engine/Instance_classes.verificator";
import { authenticate_token } from "../../data/services/middleware/auth.middleware";

/**
 * @description - These are the routes for the classes instances.
 */
const classInstanceRouter = Router();

classInstanceRouter.get(
  /*
  #swagger.tags = ['Instance']
  #swagger.summary = 'Get a class instance by its UUID'
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
    "description": "Invalid UUID supplied",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  #swagger.responses[404] = {
    "description": "Class instance not found",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  */
  "/classesInstances/:uuid",
  authenticate_token,
  Instance_classes_controller.get_class_instance_by_uuid
);

classInstanceRouter.patch(
  /*
  #swagger.tags = ['Instance']
  #swagger.summary = 'Update a class instance'
  #swagger.requestBody = {
    "description": "Updated class instance object",
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
    "description": "Class instance not found",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  */
  "/classesInstances/:uuid",
  verif_class_instance_body,
  authenticate_token,
  Instance_classes_controller.patch_class_instance_by_uuid
);

classInstanceRouter.post(
  /*
  #swagger.tags = ['Instance']
  #swagger.summary = 'Create a class instance'
  #swagger.requestBody = {
    "description": "New class instance object",
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
  */
  "/classesInstances/:uuid",
  verif_class_instance_body,
  authenticate_token,
  Instance_classes_controller.post_class_instance_by_uuid
);

classInstanceRouter.delete(
  /*
  #swagger.tags = ['Instance']
  #swagger.summary = 'Delete a class instance'
  #swagger.responses[204] = {
    "description": "Class instance deleted successfully"
  }
  #swagger.responses[400] = {
    "description": "Invalid UUID supplied",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  */
  "/classesInstances/:uuid",
  authenticate_token,
  Instance_classes_controller.delete_class_instance_by_uuid
);

// -----------------------------------------------------------------------------
// For SceneInstance
// -----------------------------------------------------------------------------

classInstanceRouter.get(
  /*
  #swagger.tags = ['Instance']
  #swagger.summary = 'Get all class instances for a scene instance'
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
    "description": "Invalid UUID supplied",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  #swagger.responses[404] = {
    "description": "Scene instance not found",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  */
  "/sceneInstances/:uuid/classesInstances",
  authenticate_token,
  Instance_classes_controller.get_classes_instances_for_scene
);

classInstanceRouter.post(
  /*
  #swagger.tags = ['Instance']
  #swagger.summary = 'Create a class instance for a scene instance'
  #swagger.requestBody = {
    "description": "New class instance object",
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
    "description": "Scene instance not found",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  */
  "/sceneInstances/:uuid/classesInstances",
  verif_class_instance_body,
  authenticate_token,
  Instance_classes_controller.post_class_instance_for_scene
);

classInstanceRouter.delete(
  /*
  #swagger.tags = ['Instance']
  #swagger.summary = 'Delete all class instances for a scene instance'
  #swagger.responses[204] = {
    "description": "Class instances deleted successfully"
  }
  #swagger.responses[400] = {
    "description": "Invalid UUID supplied",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  */
  "/sceneInstances/:uuid/classesInstances",
  authenticate_token,
  Instance_classes_controller.delete_class_instance_for_scene
);

export default classInstanceRouter;
