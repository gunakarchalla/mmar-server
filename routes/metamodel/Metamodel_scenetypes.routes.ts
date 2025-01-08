import { Router } from "express";
import Metamodel_scenetypes_controller from "../../controllers/meta/Metamodel_scenetypes.controller";
import { verif_scenetype_body } from "../../data/services/rule_engine/meta_rule_engine/Metamodel_scenetypes.rules";
import { authenticate_token } from "../../data/services/middleware/auth.middleware";

/**
 * @description - These are the routes for the sceneTypes.
 * @type {Router}
 */
const sceneTypeRouter = Router();

sceneTypeRouter.get(
  /*
  #swagger.tags = ['Metamodel']
  #swagger.summary = 'Fetch a specific scene type by its unique identifier (UUID)'
  #swagger.description = 'This endpoint retrieves detailed information about a single scene type identified by its UUID.'
  #swagger.responses[200] = {
    description: 'Successful operation. Returns the scene type object.',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/SceneType'
        }
      }
    }
  }
  #swagger.responses[400] = {
    description: 'Bad Request. The provided UUID is invalid.'
  }
  #swagger.responses[404] = {
    description: 'Not Found. No scene type with the specified UUID exists.'
  } 
  */
  "/sceneTypes/:uuid",
  authenticate_token,
  Metamodel_scenetypes_controller.get_scenetypes_by_uuid
);

sceneTypeRouter.patch(
  /*
  #swagger.tags = ['Metamodel']
  #swagger.summary = 'Modify an existing scene type'
  #swagger.description = 'This endpoint allows you to update specific properties of a scene type identified by its UUID.'
  #swagger.requestBody = {
    description: 'The modified scene type data',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/SceneType'
        }
      }
    },
    required: true
  }
  #swagger.responses[200] = {
    description: 'Successful operation. Returns the updated scene type object.',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/SceneType'
        }
      }
    }
  }
  #swagger.responses[400] = {
    description: 'Bad Request. The provided UUID or payload is invalid.'
  }
  #swagger.responses[404] = {
    description: 'Not Found. The scene type with the specified UUID does not exist.'
  } 
  */
  "/sceneTypes/:uuid",
  verif_scenetype_body,
  authenticate_token,
  Metamodel_scenetypes_controller.patch_scenetype
);

sceneTypeRouter.post(
  /*
  #swagger.tags = ['Metamodel']
  #swagger.summary = 'Create a new scene type with a specific UUID'
  #swagger.description = 'This endpoint facilitates the creation of a new scene type with a user-specified UUID.'
  #swagger.requestBody = {
    description: 'The data for the new scene type',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/SceneType'
        }
      }
    },
    required: true
  }
  #swagger.responses[201] = {
    description: 'Created. The new scene type was successfully created. Returns the created scene type object.',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/SceneType'
        }
      }
    }
  }
  #swagger.responses[400] = {
    description: 'Bad Request. The provided UUID or payload is invalid.'
  }
  */
  "/sceneTypes/:uuid",
  verif_scenetype_body,
  authenticate_token,
  Metamodel_scenetypes_controller.post_scenetype
);

sceneTypeRouter.delete(
  /*
  #swagger.tags = ['Metamodel']
  #swagger.summary = 'Remove a scene type'
  #swagger.description = 'This endpoint enables the deletion of a specific scene type identified by its UUID.'
  #swagger.responses[204] = {
    description: 'No Content. The scene type was successfully deleted.'
  }
  #swagger.responses[400] = {
    description: 'Bad Request. The provided UUID is invalid.'
  }
  #swagger.responses[404] = {
    description: 'Not Found. The scene type with the specified UUID does not exist.'
  } 
  */
  "/sceneTypes/:uuid",
  authenticate_token,
  Metamodel_scenetypes_controller.delete_scenetypes_by_uuid
);

// -----------------------------------------------------------------------------
// For SceneType
// -----------------------------------------------------------------------------

sceneTypeRouter.get(
  /*
  #swagger.tags= [
    "Metamodel"
  ]
  #swagger.summary= "Get the list of all scene types"
  #swagger.operationId= "getSceneTypes"
  #swagger.responses[200]= {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/SceneType"   

          }
        }
      }
    }
  }
  */
  "/sceneTypes",
  authenticate_token,
  Metamodel_scenetypes_controller.get_scenetypes
);

sceneTypeRouter.post(
  /*
  #swagger.tags = ['Metamodel']
  #swagger.summary = 'Create a new scene type'
  #swagger.description = 'This endpoint facilitates the creation of a new scene type. The system will generate a UUID for the new scene type.'
  #swagger.requestBody = {
    description: 'The data for the new scene type',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/SceneType'
        }
      }
    },
    required: true
  }
  #swagger.responses[201] = {
    description: 'Created. The new scene type was successfully created. Returns the created scene type object.',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/SceneType'
        }
      }
    }
  }
  #swagger.responses[400] = {
    description: 'Bad Request. The provided payload is invalid.'
  }
  */
  "/sceneTypes",
  verif_scenetype_body,
  authenticate_token,
  Metamodel_scenetypes_controller.post_scenetype
);

sceneTypeRouter.delete(
  /*
  #swagger.tags = ['Metamodel']
  #swagger.summary = 'Delete all scene types'
  #swagger.description = 'This endpoint removes all existing scene types from the system.'
  #swagger.responses[204] = {
    description: 'No Content. All scene types were successfully deleted.'
  }
  */
  "/sceneTypes",
  authenticate_token,
  Metamodel_scenetypes_controller.delete_scenetypes
);

export default sceneTypeRouter;
