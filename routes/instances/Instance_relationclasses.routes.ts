import { Router } from "express";
import Instance_relationclass_controller from "../../controllers/instance/Instance_relationclasses.controller";
import { verif_relationclass_instances_body } from "../../data/services/rule_engine/instance_rule_engine/Instance_relationClasses.verificator";
import { authenticate_token } from "../../data/services/middleware/auth.middleware";

/**
 * @description - These are the routes for the relationclasses instances.
 * @type {Router}
 */
const relationClassInstanceRouter = Router();

relationClassInstanceRouter.get(
/*
#swagger.tags = ['Instance']
#swagger.summary = 'Get a relation class instance by its UUID'
#swagger.responses[200] = {
  "description": "Successful operation",
  "content": {
    "application/json": {
      "schema": {
        "$ref": "#/components/schemas/RelationclassInstance"
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
  "/relationclassesInstances/:uuid",
  authenticate_token,
  Instance_relationclass_controller.get_relationclass_instances_by_uuid
);

relationClassInstanceRouter.patch(
/*
#swagger.tags = ['Instance']
#swagger.summary = 'Update a relation class instance'
#swagger.requestBody = {
  "description": "Updated relation class instance object",
  "content": {
    "application/json": {
      "schema": {
        "$ref": "#/components/schemas/RelationclassInstance"
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
        "$ref": "#/components/schemas/RelationclassInstance"
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
  "/relationclassesInstances/:uuid",
  verif_relationclass_instances_body,
  authenticate_token,
  Instance_relationclass_controller.patch_relationclass_instances_by_uuid
);

relationClassInstanceRouter.post(
/*
#swagger.tags = ['Instance']
#swagger.summary = 'Create a relation class instance'
#swagger.requestBody = {
  "description": "New relation class instance object",
  "content": {
    "application/json": {
      "schema": {
        "$ref": "#/components/schemas/RelationclassInstance"
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
        "$ref": "#/components/schemas/RelationclassInstance"
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
  "/relationclassesInstances/:uuid",
  verif_relationclass_instances_body,
  authenticate_token,
  Instance_relationclass_controller.post_relationclass_instances_by_uuid
);

relationClassInstanceRouter.delete(
/*
#swagger.tags = ['Instance']
#swagger.summary = 'Delete a relation class instance'
#swagger.responses[204] = {
  "description": "Relation class instance deleted successfully"
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
  "/relationclassesInstances/:uuid",
  authenticate_token,
  Instance_relationclass_controller.delete_relationclass_instances_by_uuid
);

// -----------------------------------------------------------------------------
// For sceneInstances
// -----------------------------------------------------------------------------

relationClassInstanceRouter.get(
/*
#swagger.tags = ['Instance']
#swagger.summary = 'Get all relation class instances for a scene instance'
#swagger.responses[200] = {
  "description": "Successful operation",
  "content": {
    "application/json": {
      "schema": {
        "type": "array",
        "items": {
          "$ref": "#/components/schemas/RelationclassInstance"   

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
  "/sceneInstances/:uuid/relationclassesInstances",
  authenticate_token,
  Instance_relationclass_controller.get_relationclasses_instances_for_scene
);

relationClassInstanceRouter.post(
  /*
  #swagger.tags = ['Instance']
  #swagger.summary = 'Create a relation class instance for a scene instance'
  #swagger.requestBody = {
    "description": "New relation class instance object",
    "content": {
    "application/json": {
      "schema": {
        "$ref": "#/components/schemas/RelationclassInstance"
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
        "$ref": "#/components/schemas/RelationclassInstance"
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
"/sceneInstances/:uuid/relationclassesInstances",
verif_relationclass_instances_body,
authenticate_token,
Instance_relationclass_controller.post_relationclass_instances_for_scene
);

// TODO : Instance_relationclass_controller.delete_for_parent
//router.delete('/sceneInstances/:uuid/relationclassesInstances',delete_relationclass_instances_for_scene);

export default relationClassInstanceRouter;
