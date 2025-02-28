import { Router } from "express";
import Metamodel_procedure_controller from "../../controllers/meta/Metamodel_procedure.controller";
import { authenticate_token } from "../../data/services/middleware/auth.middleware";

/**
 * @description - These are the routes for the procedures.
 * @type {Router}
 */
const procedureMetaRouter = Router();
// -----------------------------------------------------------------------------
// For specific algorithms
// -----------------------------------------------------------------------------

procedureMetaRouter.get(
  /*
  #swagger.tags= [
    "Metamodel"
  ]
  #swagger.summary= "Get a procedure by its UUID"
  #swagger.responses[200]= {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Procedure"
        }
      }
    }
  }
  #swagger.responses[400]= {
    "description": "Invalid UUID supplied"
  }
  #swagger.responses[404]= {
    "description": "Procedure not found"
  } 
  */
  "/procedures/:uuid",
  authenticate_token,
  Metamodel_procedure_controller.get_procedure_by_uuid
);

procedureMetaRouter.patch(
  /*
  #swagger.tags= [
    "Metamodel"
  ]
  #swagger.summary= "Update a procedure by its UUID"
  #swagger.requestBody= {
    "description": "Updated procedure object",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Procedure"
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
          "$ref": "#/components/schemas/Procedure"
        }
      }
    }
  }
  #swagger.responses[400]= {
    "description": "Invalid UUID supplied or invalid payload"
  }
  #swagger.responses[404]= {
    "description": "Procedure not found"
  } 
  */
  "/procedures/:uuid",
  authenticate_token,
  Metamodel_procedure_controller.patch_procedure_by_uuid
);

procedureMetaRouter.post(
  /*
  #swagger.tags= [
    "Metamodel"
  ]
  #swagger.summary= "Create a new procedure with a specified UUID"
  #swagger.requestBody= {
    "description": "New procedure object",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Procedure"
        }
      }
    },
    "required": true
  }
  #swagger.responses[201]= {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Procedure"
        }
      }
    }
  }
  #swagger.responses[400]= {
    "description": "Invalid UUID supplied or invalid payload"
  }
  #swagger.responses[409]= {
    "description": "Procedure with the specified UUID already exists"
  } 
  */
  "/procedures/:uuid",
  authenticate_token,
  Metamodel_procedure_controller.post_procedure_by_uuid
);

procedureMetaRouter.delete(
  /*
  #swagger.tags= [
    "Metamodel"
  ]
  #swagger.summary= "Delete a procedure by its UUID"
  #swagger.responses[204]= {
    "description": "Successful operation. Procedure deleted"
  }
  #swagger.responses[400]= {
    "description": "Invalid UUID supplied"
  }
  #swagger.responses[404]= {
    "description": "Procedure not found"
  } 
  */
  "/procedures/:uuid",
  authenticate_token,
  Metamodel_procedure_controller.delete_procedure_by_uuid
);

// -----------------------------------------------------------------------------
// For all algorithms
// -----------------------------------------------------------------------------

procedureMetaRouter.get(
  /*
  #swagger.tags= [
    "Metamodel"
  ]
  #swagger.summary= "Get all procedures (not linked and linked to a scene type)"
  #swagger.responses[200]= {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/Procedure"   

          }
        }
      }
    }
  }
  */
  "/procedures",
  authenticate_token,
  Metamodel_procedure_controller.get_procedures
);

// -----------------------------------------------------------------------------
// For independent algorithms
// -----------------------------------------------------------------------------

procedureMetaRouter.get(
  /*
  #swagger.tags= [
    "Metamodel"
  ]
  #swagger.summary= "Get all independent procedures (not linked to a scene type)"
  #swagger.responses[200]= {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/Procedure"   

          }
        }
      }
    }
  }
  */
  "/independent_procedures",
  authenticate_token,
  Metamodel_procedure_controller.get_independent_procedures
);

procedureMetaRouter.post(
  /*
  #swagger.tags= [
    "Metamodel"
  ]
  #swagger.summary= "Create a new independent procedure"
  #swagger.requestBody= {
    "description": "New procedure object",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Procedure"
        }
      }
    },
    "required": true
  }
  #swagger.responses[201]= {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Procedure"
        }
      }
    }
  }
  #swagger.responses[400]= {
    "description": "Invalid payload"
  }
  */
  //post independent of scene_type
  "/procedures",
  authenticate_token,
  Metamodel_procedure_controller.post_procedure
);

procedureMetaRouter.delete(
  /*
  #swagger.tags= [
    "Metamodel"
  ]
  #swagger.summary= "Delete all procedures"
  #swagger.responses[204]= {
    "description": "Successful operation. All procedures deleted"
  }
  */
  "/procedures",
  authenticate_token,
  Metamodel_procedure_controller.delete_all_procedures
);

// -----------------------------------------------------------------------------
// For scene_type specific algorithms
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// For scene_type specific algorithms
// -----------------------------------------------------------------------------

procedureMetaRouter.get(
  /*
  #swagger.tags= [
    "Metamodel"
  ]
  #swagger.summary= "Get procedures associated with a specific scene type"
  #swagger.responses[200]= {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/Procedure"   

          }
        }
      }
    }
  }
  #swagger.responses[400]= {
    "description": "Invalid UUID supplied"
  }
  #swagger.responses[404]= {
    "description": "Scene type not found"
  } 
  */
  "/sceneTypes/:uuid/procedures",
  authenticate_token,
  Metamodel_procedure_controller.get_procedure_by_scene_type_uuid
);

procedureMetaRouter.post(
  /*
  #swagger.tags= [
    "Metamodel"
  ]
  #swagger.summary= "Create a new procedure associated with a specific scene type"
  #swagger.requestBody= {
    "description": "New procedure object",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Procedure"
        }
      }
    },
    "required": true
  }
  #swagger.responses[201]= {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Procedure"
        }
      }
    }
  }
  #swagger.responses[400]= {
    "description": "Invalid UUID supplied or invalid payload"
  }
  #swagger.responses[404]= {
    "description": "Scene type not found"
  } 
  */
  "/sceneTypes/:uuid/procedures",
  authenticate_token,
  Metamodel_procedure_controller.post_procedure_for_scenetype
);

procedureMetaRouter.delete(
  /*
  #swagger.tags= [
    "Metamodel"
  ]
  #swagger.summary= "Delete a procedure associated with a specific scene type"
  #swagger.responses[204]= {
    "description": "Successful operation. Procedure deleted"
  }
  #swagger.responses[400]= {
    "description": "Invalid UUID supplied"
  }
  #swagger.responses[404]= {
    "description": "Scene type or procedure not found"
  } 
  */
  "/sceneTypes/:uuid/procedures",
  authenticate_token,
  Metamodel_procedure_controller.delete_procedure_by_uuid
);

export default procedureMetaRouter;
