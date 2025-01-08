import { Router } from "express";
import Metamodel_classes_controller from "../../controllers/meta/Metamodel_classes.controller";
import { verif_class_body } from "../../data/services/rule_engine/meta_rule_engine/Metamodel_classes.rules";
import { authenticate_token } from "../../data/services/middleware/auth.middleware";

/**
 * @description - These are the routes for the classes.
 * @type {Router}
 */
const classMetaRouter: Router = Router();

classMetaRouter.get(
  /*
  #swagger.tags = ["Metamodel"]
  #swagger.summary = "Get all classes"
  #swagger.responses[200] = {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/Class"   
 
          }
        }
      }
    }
  }
  */
  "/classes",
  authenticate_token,
  Metamodel_classes_controller.get_all_classes
);

classMetaRouter.get(
  /*
  #swagger.tags = ["Metamodel"]
  #swagger.summary = "Get a class by UUID"
  #swagger.responses[200] = {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Class" 
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
    "description": "Class not found",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error" 
        }
      }
    }
  }
  */
  "/classes/:uuid",
  authenticate_token,
  Metamodel_classes_controller.get_class_by_uuid
);

classMetaRouter.patch(
  /*
  #swagger.tags = ["Metamodel"]
  #swagger.summary = "Update a class by UUID"
  #swagger.requestBody = {
    "description": "Updated class object",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Class" 
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
          "$ref": "#/components/schemas/Class" 
        }
      }
    }
  }
  #swagger.responses[400] = {
    "description": "Invalid class supplied",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error" 
        }
      }
    }
  }
  #swagger.responses[404] = {
    "description": "Class not found",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error" 
        }
      }
    }
  }
  */
  "/classes/:uuid",
  verif_class_body,
  authenticate_token,
  Metamodel_classes_controller.patch_class_by_uuid
);

classMetaRouter.post(
  /*
  #swagger.tags = ["Metamodel"]
  #swagger.summary = "Create a new class"
  #swagger.requestBody = {
    "description": "New class object",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Class" 
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
          "$ref": "#/components/schemas/Class" 
        }
      }
    }
  }
  #swagger.responses[400] = {
    "description": "Invalid class supplied",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error" 
        }
      }
    }
  }
  */
  "/classes/:uuid",
  verif_class_body,
  authenticate_token,
  Metamodel_classes_controller.post_class_by_uuid
);

classMetaRouter.delete(
  /*
  #swagger.tags = ["Metamodel"]
  #swagger.summary = "Delete a class by UUID"
  #swagger.responses[204] = {
    "description": "Class deleted successfully" 
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
  "/classes/:uuid",
  authenticate_token,
  Metamodel_classes_controller.delete_classes_by_uuid
);

// -----------------------------------------------------------------------------
// For SceneType
// -----------------------------------------------------------------------------

classMetaRouter.get(
  /*
  #swagger.tags = ["Metamodel"]
  #swagger.summary = "Get all classes of a scene type by UUID"
  #swagger.responses[200] = {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/Class"   
 
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
  "/sceneTypes/:uuid/classes",
  authenticate_token,
  Metamodel_classes_controller.get_classes_for_scene
);

classMetaRouter.post(
  /*
  #swagger.tags = ["Metamodel"]
  #swagger.summary = "Add a class to a scene type"
  #swagger.requestBody = {
    "description": "New class object to add to the scene type",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Class" 
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
          "$ref": "#/components/schemas/Class" 
        }
      }
    }
  }
  #swagger.responses[400] = {
    "description": "Invalid class or scene type UUID supplied",
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
  "/sceneTypes/:uuid/classes",
  verif_class_body,
  authenticate_token,
  Metamodel_classes_controller.post_class_for_scenetype
);

classMetaRouter.delete(
  /*
  #swagger.tags = ["Metamodel"]
  #swagger.summary = "Delete all classes of a scene type"

  #swagger.responses[204] = {
    "description": "Classes deleted successfully" 
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
  "/sceneTypes/:uuid/classes",
  authenticate_token,
  Metamodel_classes_controller.delete_classes_for_scene
);

export default classMetaRouter;
