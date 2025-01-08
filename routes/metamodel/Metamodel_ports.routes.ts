import { Router } from "express";
import Metamodel_ports_controller from "../../controllers/meta/Metamodel_ports.controller";
import { verif_port_body } from "../../data/services/rule_engine/meta_rule_engine/Metamodel_ports.rules";
import { authenticate_token } from "../../data/services/middleware/auth.middleware";

/**
 * @description - These are the routes for the meta ports.
 * @type {Router}
 */
const portMetaRouter: Router = Router();

portMetaRouter.get(
  /*
  #swagger.tags= [
    "Metamodel"
  ]
  #swagger.summary= "Get all ports"
  #swagger.operationId= "getAllPorts"
  #swagger.responses[200]= {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/Port"   

          }
        }
      }
    }
  }
  */
  "/ports",
  authenticate_token,
  Metamodel_ports_controller.get_all_ports
);

portMetaRouter.get(
  /*
  #swagger.tags= [
    "Metamodel"
  ]
  #swagger.summary= "Get a port by uuid"
  #swagger.operationId= "getPortById"
  #swagger.responses[200]= {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Port"
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
    "description": "Port not found",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  */
  "/ports/:uuid",
  authenticate_token,
  Metamodel_ports_controller.get_ports_by_uuid
);

portMetaRouter.patch(
  /*
  #swagger.tags= [
    "Metamodel"
  ]
  #swagger.summary= "Update a port"
  #swagger.operationId= "updatePort"
  #swagger.requestBody= {
    "description": "Updated port object",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Port"
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
          "$ref": "#/components/schemas/Port"
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
    "description": "Port not found",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  */
  "/ports/:uuid",
  verif_port_body,
  authenticate_token,
  Metamodel_ports_controller.patch_port_by_uuid
);

portMetaRouter.post(
  /*
  #swagger.tags= [
    "Metamodel"
  ]
  #swagger.summary= "Create an unlinked port"
  #swagger.operationId= "createUnlinkedPort"
  #swagger.requestBody= {
    "description": "New port object",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Port"
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
          "$ref": "#/components/schemas/Port"
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
  "/ports/:uuid",
  verif_port_body,
  authenticate_token,
  Metamodel_ports_controller.post_port_by_uuid
);

portMetaRouter.delete(
  /*
  #swagger.tags= [
    "Metamodel"
  ]
  #swagger.summary= "Delete a port"
  #swagger.operationId= "deletePort"
  #swagger.responses[204]= {
    "description": "Port deleted successfully"
  }
  #swagger.responses[400]= {
    "description": "Invalid id supplied",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  */
  "/ports/:uuid",
  authenticate_token,
  Metamodel_ports_controller.delete_ports_by_uuid
);

// -----------------------------------------------------------------------------
// For SceneType
// -----------------------------------------------------------------------------

portMetaRouter.get(
  /*
  #swagger.tags= [
    "Metamodel"
  ]
  #swagger.summary= "Get all ports of a scene type by uuid"
  #swagger.operationId= "getPortsOfSceneTypeById"
  #swagger.responses[200]= {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/Port"   

          }
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
  "/sceneTypes/:uuid/ports",
  authenticate_token,
  Metamodel_ports_controller.get_ports_for_scene
);

portMetaRouter.post(
  /*
  #swagger.tags= [
    "Metamodel"
  ]
  #swagger.summary= "Add a port to a scene type"
  #swagger.operationId= "addPortToSceneType"
  #swagger.requestBody= {
    "description": "New port object to be added to the scene type",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Port"
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
          "$ref": "#/components/schemas/Port"
        }
      }
    }
  }
  #swagger.responses[400]= {
    "description": "Invalid payload supplied or scene type not found",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  */
  "/sceneTypes/:uuid/ports",
  verif_port_body,
  authenticate_token,
  Metamodel_ports_controller.post_port
);

portMetaRouter.delete(
  /*
  #swagger.tags= [
    "Metamodel"
  ]
  #swagger.summary= "Delete all ports of a scene type"
  #swagger.operationId= "deleteAllPortsOfSceneType"
  #swagger.responses[204]= {
    "description": "Ports deleted successfully"
  }
  #swagger.responses[400]= {
    "description": "Invalid id supplied or scene type not found",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  */
  "/sceneTypes/:uuid/ports",
  authenticate_token,
  Metamodel_ports_controller.delete_ports_for_scene
);

export default portMetaRouter;
