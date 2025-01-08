import { Router } from "express";
import Metamodel_relationclass_controller from "../../controllers/meta/Metamodel_relationclasses.controller";
import { verif_relationClass_body } from "../../data/services/rule_engine/meta_rule_engine/Metamodel_relationclasses.rules";
import { authenticate_token } from "../../data/services/middleware/auth.middleware";

const relationclassMetaRouter: Router = Router();

relationclassMetaRouter.get(
  /*
  #swagger.tags = ['Metamodel']
  #swagger.summary = 'Get all relation classes'
  #swagger.responses[200] = {
    description: 'Successful operation',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/Relationclass'   

          }
        }
      }
    }
  }
  */
  "/relationClasses",
  authenticate_token,
  Metamodel_relationclass_controller.get_all_relationclasses
);

relationclassMetaRouter.get(
  /*
  #swagger.tags = ['Metamodel']
  #swagger.summary = 'Get a relation class by UUID'
  #swagger.responses[200] = {
    description: 'Successful operation',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/Relationclass'
        }
      }
    }
  }
  #swagger.responses[400] = {
    description: 'Invalid UUID supplied'
  }
  #swagger.responses[404] = {
    description: 'Relation class not found'
  } 
  */
  "/relationClasses/:uuid",
  authenticate_token,
  Metamodel_relationclass_controller.get_relationclass_by_uuid
);

relationclassMetaRouter.patch(
  /*
  #swagger.tags = ['Metamodel']
  #swagger.summary = 'Update a relation class by UUID'
  #swagger.requestBody = {
    description: 'Updated relation class object',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/Relationclass'
        }
      }
    },
    required: true
  }
  #swagger.responses[200] = {
    description: 'Successful operation',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/Relationclass'
        }
      }
    }
  }
  #swagger.responses[400] = {
    description: 'Invalid UUID supplied or invalid payload'
  }
  #swagger.responses[404] = {
    description: 'Relation class not found'
  } 
  */
  "/relationClasses/:uuid",
  verif_relationClass_body,
  authenticate_token,
  Metamodel_relationclass_controller.patch_relationclass_by_uuid
);

relationclassMetaRouter.post(
  /*
  #swagger.tags = ['Metamodel']
  #swagger.summary = 'Create a new relation class with specified UUID'
  #swagger.requestBody = {
    description: 'New relation class object',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/Relationclass'
        }
      }
    },
    required: true
  }
  #swagger.responses[201] = {
    description: 'Successful operation',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/Relationclass'
        }
      }
    }
  }
  #swagger.responses[400] = {
    description: 'Invalid UUID supplied or invalid payload'
  }
  */
  "/relationClasses/:uuid",
  verif_relationClass_body,
  authenticate_token,
  Metamodel_relationclass_controller.post_relationclass_by_uuid
);

relationclassMetaRouter.delete(
  /*
  #swagger.tags = ['Metamodel']
  #swagger.summary = 'Delete a relation class by UUID'
  #swagger.responses[204] = {
    description: 'Successful operation. Relation class deleted'
  }
  #swagger.responses[400] = {
    description: 'Invalid UUID supplied'
  }
  #swagger.responses[404] = {
    description: 'Relation class not found'
  } 
  */
  "/relationClasses/:uuid",
  authenticate_token,
  Metamodel_relationclass_controller.delete_relationclass_by_uuid
);

// -----------------------------------------------------------------------------
// For SceneType
// -----------------------------------------------------------------------------

relationclassMetaRouter.get(
  /*
  #swagger.tags = ['Metamodel']
  #swagger.summary = 'Retrieve relation classes linked to a scene type'
  #swagger.description = 'This endpoint fetches all relation classes associated with a particular scene type, identified by its UUID.'
  #swagger.responses[200] = {
    description: 'Successful operation. Returns an array of relation class objects linked to the scene type.',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/Relationclass'
          }
        }
      }
    }
  }
  #swagger.responses[400] = {
    description: 'Bad Request. The provided UUID is invalid.'
  }
  #swagger.responses[404] = {
    description: 'Not Found. The scene type with the specified UUID does not exist.'
  } 
  */
  "/sceneTypes/:uuid/relationClasses",
  authenticate_token,
  Metamodel_relationclass_controller.get_relationclasses_for_scene
);

relationclassMetaRouter.post(
  /*
  #swagger.tags = ['Metamodel']
  #swagger.summary = 'Associate a new relation class with a scene type'
  #swagger.description = 'This endpoint creates a new relation class and establishes a link between it and a specific scene type.'
  #swagger.requestBody = {
    description: 'The data for the new relation class',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/Relationclass'
        }
      }
    },
    required: true
  }
  #swagger.responses[201] = {
    description: 'Created. The new relation class was successfully created and linked to the scene type. Returns the created relation class object.',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/Relationclass'
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
  "/sceneTypes/:uuid/relationClasses",
  verif_relationClass_body,
  authenticate_token,
  Metamodel_relationclass_controller.post_relationclasses_for_scene
);

relationclassMetaRouter.delete(
  /*
  #swagger.tags = ['Metamodel']
  #swagger.summary = 'Delete all relation classes associated with a scene type'
  #swagger.description = 'This endpoint removes all relation classes linked to a specific scene type, identified by its UUID.'
  #swagger.responses[204] = {
    description: 'No Content. All relation classes associated with the scene type were successfully deleted.'
  }
  #swagger.responses[400] = {
    description: 'Bad Request. The provided UUID is invalid.'
  }
  #swagger.responses[404] = {
    description: 'Not Found. The scene type with the specified UUID does not exist.'
  } 
  */
  "/sceneTypes/:uuid/relationClasses",
  authenticate_token,
  Metamodel_relationclass_controller.delete_relationclasses_for_scene
);

export default relationclassMetaRouter;
