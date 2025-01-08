import { Router } from "express";
import Instance_scene_controller from "../../controllers/instance/Instance_scenes.controller";
import { verif_scene_instance_body } from "../../data/services/rule_engine/instance_rule_engine/Instance_scenes.verificator";
import { authenticate_token } from "../../data/services/middleware/auth.middleware";

/**
 * @description - These are the routes for the scenes instances.
 * @type {Router}
 */
const sceneInstanceRouter = Router();

sceneInstanceRouter.get(
  /*
  #swagger.tags = ['Instance']
  #swagger.summary = 'Get a scene instance by UUID'
  #swagger.responses[200] = {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/SceneInstance" 
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
  "/sceneInstances/:uuid",
  authenticate_token,
  Instance_scene_controller.get_scene_instance_by_uuid
);

sceneInstanceRouter.patch(
  /*
  #swagger.tags = ['Instance']
  #swagger.summary = 'Update a scene instance'
  #swagger.requestBody = {
    "description": "Updated scene instance object",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/SceneInstance" 
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
          "$ref": "#/components/schemas/SceneInstance" 
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
  "/sceneInstances/:uuid",
  verif_scene_instance_body,
  authenticate_token,
  Instance_scene_controller.patch_scene_instance_by_uuid
);

sceneInstanceRouter.post(
  /*
  #swagger.tags = ['Instance']
  #swagger.summary = 'Create a scene instance'
  #swagger.requestBody = {
    "description": "New scene instance object",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/SceneInstance" 
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
          "$ref": "#/components/schemas/SceneInstance" 
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
  "/sceneInstances/:uuid",
  verif_scene_instance_body,
  authenticate_token,
  Instance_scene_controller.post_scene_instance_by_uuid
);

sceneInstanceRouter.delete(
  /*
  #swagger.tags = ['Instance']
  #swagger.summary = 'Delete a scene instance'
  #swagger.responses[204] = {
    "description": "Scene instance deleted successfully"
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
  "/sceneInstances/:uuid",
  authenticate_token,
  Instance_scene_controller.delete_scene_instance_by_uuid
);

// -----------------------------------------------------------------------------
// For sceneType
// -----------------------------------------------------------------------------

sceneInstanceRouter.get(
  /*
  #swagger.tags = ['Instance']
  #swagger.summary = 'Get all scene instances for a scene type'
  #swagger.responses[200] = {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/SceneInstance"   
 
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
    "description": "Scene type not found",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  */
  "/sceneTypes/:uuid/sceneInstances",
  authenticate_token,
  Instance_scene_controller.get_scene_instances
);

sceneInstanceRouter.post(
  /*
  #swagger.tags = ['Instance']
  #swagger.summary = 'Create a scene instance for a scene type'
  #swagger.requestBody = {
    "description": "New scene instance object",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/SceneInstance" 
        }
      },
      "required": true
    }
  }
  #swagger.responses[200] = {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/SceneInstance" 
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
  "/sceneTypes/:uuid/sceneInstances",
  //verif_scene_instance_body,
  authenticate_token,
  Instance_scene_controller.post_scene_instances
);

sceneInstanceRouter.delete(
  /*
  #swagger.tags = ['Instance']
  #swagger.summary = 'Delete all scene instances for a scene type'
  #swagger.responses[204] = {
    "description": "Scene instances deleted successfully"
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
  "/sceneTypes/:uuid/sceneInstances",
  authenticate_token,
  Instance_scene_controller.delete_scene_instances
);

export default sceneInstanceRouter;
