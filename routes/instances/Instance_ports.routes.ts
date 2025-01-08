import { Router } from "express";
import Instance_port_controller from "../../controllers/instance/Instance_ports.controller";
import { verif_port_instance_body } from "../../data/services/rule_engine/instance_rule_engine/Instance_ports.verificator";
import { authenticate_token } from "../../data/services/middleware/auth.middleware";

/**
 * @description - These are the routes for the ports instances.
 * @type {Router}
 */
const portInstanceRouter = Router();

portInstanceRouter.get(
  /*
  #swagger.tags = ['Instance']
  #swagger.summary = 'Get a port instance by its UUID'
  #swagger.responses[200] = {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/PortInstance"
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
    "description": "Port instance not found",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  */
  "/portsInstances/:uuid",
  authenticate_token,
  Instance_port_controller.get_port_instances_by_uuid
);

portInstanceRouter.patch(
  /*
  #swagger.tags = ['Instance']
  #swagger.summary = 'Update a port instance'
  #swagger.requestBody = {
    "description": "Updated port instance object",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/PortInstance"
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
          "$ref": "#/components/schemas/PortInstance"
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
    "description": "Port instance not found",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  */
  "/portsInstances/:uuid",
  verif_port_instance_body,
  authenticate_token,
  Instance_port_controller.patch_port_instance_by_uuid
);

portInstanceRouter.delete(
  /*
  #swagger.tags = ['Instance']
  #swagger.summary = 'Delete a port instance'
  #swagger.responses[204] = {
    "description": "Port instance deleted successfully"
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
  "/portsInstances/:uuid",
  authenticate_token,
  Instance_port_controller.delete_port_instances_by_uuid
);

// -----------------------------------------------------------------------------
// For sceneInstance
// -----------------------------------------------------------------------------

portInstanceRouter.get(
  /*
  #swagger.tags = ['Instance']
  #swagger.summary = 'Get all port instances for a scene instance'
  #swagger.responses[200] = {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/PortInstance"   

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
  "/sceneInstances/:uuid/portsInstances",
  authenticate_token,
  Instance_port_controller.get_port_instances_for_scene
);

portInstanceRouter.post(
  /*
  #swagger.tags = ['Instance']
  #swagger.summary = 'Create a port instance for a scene instance'
  #swagger.requestBody = {
    "description": "New port instance object",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/PortInstance"
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
          "$ref": "#/components/schemas/PortInstance"
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
  "/sceneInstances/:uuid/portsInstances",
  verif_port_instance_body,
  authenticate_token,
  Instance_port_controller.post_port_instances
);

portInstanceRouter.delete(
  /*
  #swagger.tags = ['Instance']
  #swagger.summary = 'Delete all port instances for a scene instance'
  #swagger.responses[204] = {
    "description": "Port instances deleted successfully"
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
  "/sceneInstances/:uuid/portsInstances",
  authenticate_token,
  Instance_port_controller.delete_port_instances_for_scene
);

export default portInstanceRouter;
