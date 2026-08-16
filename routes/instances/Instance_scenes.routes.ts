import { Router } from "express";
import Instance_scene_controller from "../../controllers/instance/Instance_scenes.controller";
import Scene_access_controller from "../../controllers/instance/Scene_access_controller";
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
  #swagger.summary = 'Update a scene instance (upsert: creates it if it does not exist yet)'
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
    "description": "Successful operation (scene instance updated or created)",
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

// -----------------------------------------------------------------------------
// Scene instance access management
// NOTE: /access/me is registered before /access/:uuid_user to prevent Express
// from capturing the literal "me" as a UUID parameter.
// -----------------------------------------------------------------------------

sceneInstanceRouter.get(
  /*
  #swagger.tags = ['Instance']
  #swagger.summary = 'Get caller\'s effective access level for a scene instance'
  #swagger.responses[200] = { "description": "Successful operation" }
  #swagger.responses[401] = { "description": "No or invalid JWT" }
  */
  "/sceneInstances/:uuid/access/me",
  authenticate_token,
  Scene_access_controller.get_my_access
);

sceneInstanceRouter.get(
  /*
  #swagger.tags = ['Instance']
  #swagger.summary = 'List all users with access to a scene instance'
  #swagger.responses[200] = { "description": "Successful operation" }
  #swagger.responses[403] = { "description": "Caller lacks delete access" }
  */
  "/sceneInstances/:uuid/access",
  authenticate_token,
  Scene_access_controller.get_scene_instance_access
);

sceneInstanceRouter.post(
  /*
  #swagger.tags = ['Instance']
  #swagger.summary = 'Grant or upsert access for a user on a scene instance'
  #swagger.responses[200] = { "description": "Successful operation" }
  #swagger.responses[400] = { "description": "Invalid access level" }
  #swagger.responses[403] = { "description": "Caller lacks delete access" }
  */
  "/sceneInstances/:uuid/access",
  authenticate_token,
  Scene_access_controller.post_scene_instance_access
);

sceneInstanceRouter.patch(
  /*
  #swagger.tags = ['Instance']
  #swagger.summary = 'Change a user\'s access level on a scene instance'
  #swagger.responses[200] = { "description": "Successful operation" }
  #swagger.responses[400] = { "description": "Invalid access level" }
  #swagger.responses[403] = { "description": "Caller lacks delete access" }
  #swagger.responses[409] = { "description": "Would leave zero delete-owners" }
  */
  "/sceneInstances/:uuid/access/:uuid_user",
  authenticate_token,
  Scene_access_controller.patch_scene_instance_access
);

sceneInstanceRouter.delete(
  /*
  #swagger.tags = ['Instance']
  #swagger.summary = 'Revoke a user\'s access to a scene instance'
  #swagger.responses[200] = { "description": "Successful operation" }
  #swagger.responses[403] = { "description": "Caller lacks delete access" }
  #swagger.responses[404] = { "description": "User has no access to this scene instance" }
  #swagger.responses[409] = { "description": "Would leave zero delete-owners" }
  */
  "/sceneInstances/:uuid/access/:uuid_user",
  authenticate_token,
  Scene_access_controller.delete_scene_instance_access
);

export default sceneInstanceRouter;
