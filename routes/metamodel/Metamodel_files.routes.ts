import { Router } from "express";
import Metamodel_file_controller from "../../controllers/meta/Metamodel_files.controller";
import multer from "multer";
const upload = multer();
/**
 * @description - These are the routes for the file.
 * @type {Router}
 */
const fileRouter: Router = Router();
fileRouter.get(
  /*
  #swagger.tags = ['Files']
  #swagger.summary = 'A URL to render HTML page for file upload'
  #swagger.responses[200] = {
    "description": "Successful operation. If name or UUID is provided, returns the file content. Otherwise, renders the file upload page."
  }
  #swagger.responses[400] = {
    "description": "Invalid name or UUID supplied",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  #swagger.responses[404] = {
    "description": "File not found",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  */
  "/",
  function (req, res, next) {
    if (req.query.name) {
      Metamodel_file_controller.get_file_by_name(req, res, next);
    } else if (req.query.uuid) {
      Metamodel_file_controller.get_file_by_uuid(req, res, next);
    } else {
      // Handle the case when no parameters are provided
      res.setHeader(
        "Content-Security-Policy",
        "script-src 'self' 'unsafe-inline'"
      );
      res.render("file");
    }
  }
);

fileRouter.get(
  /*
  #swagger.tags = ['Files']
  #swagger.summary = 'Get all files'
  #swagger.responses[200] = {
    "description": "Successful operation. Returns the list of files."
  }
  #swagger.responses[400] = {
    "description": "Invalid request",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  */
  "/allfiles",
  Metamodel_file_controller.get_all_files
);

fileRouter.get("/alluuids", Metamodel_file_controller.get_all_uuids);

fileRouter.get(
  /*
  #swagger.tags = ['Files']
  #swagger.summary = 'Get a file by UUID'
  #swagger.responses[200] = {
    "description": "Successful operation. Returns the file content."
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
    "description": "File not found",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  */
  "/:uuid",
  Metamodel_file_controller.get_file_by_uuid
);

//fileRouter.get("/files/:name", Metamodel_file_controller.get_file_by_name);

fileRouter.post(
  /*
  #swagger.tags = ['Files']
  #swagger.summary = 'Update a file by UUID'
  #swagger.requestBody = {
    "description": "Updated file content",
    "content": {
      "multipart/form-data": { 
        "schema": {
          "type": "object",
          "properties": {
            "file": {
              "type": "string",
              "format": "binary" 
            }
          }
        }
      }
    },
    "required": true
  }
  #swagger.responses[200] = {
    "description": "Successful operation. Returns the updated file information."
  }
  #swagger.responses[400] = {
    "description": "Invalid UUID or file content supplied",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  */
  "/:uuid",
  upload.single("file"),
  Metamodel_file_controller.post_file_by_uuid
);

fileRouter.patch(
  /*
  #swagger.tags = ['Files']
  #swagger.summary = 'Update a file by UUID'
  #swagger.requestBody = {
    "description": "Updated file content",
    "content": {
      "multipart/form-data": { 
        "schema": {
          "type": "object",
          "properties": {
            "file": {
              "type": "string",
              "format": "binary" 
            }
          }
        }
      }
    },
    "required": true
  }
  #swagger.responses[200] = {
    "description": "Successful operation. Returns the updated file information."
  }
  #swagger.responses[400] = {
    "description": "Invalid UUID or file content supplied",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  */
  "/:uuid",
  upload.single("file"),
  Metamodel_file_controller.patch_file_by_uuid
);

fileRouter.post(
  /*
  #swagger.tags = ['Files']
  #swagger.summary = 'Upload a new file'
  #swagger.requestBody = {
    "description": "File to upload",
    "content": {
      "multipart/form-data": { 
        "schema": {
          "type": "object",
          "properties": {
            "file": {
              "type": "string",
              "format": "binary" 
            }
          }
        }
      }
    },
    "required": true
  }
  #swagger.responses[201] = {
    "description": "Successful operation. Returns the created file information."
  }
  #swagger.responses[400] = {
    "description": "Invalid file supplied",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  */
  "/",
  upload.single("file"),
  Metamodel_file_controller.post_file
);

fileRouter.delete(
  /*
  #swagger.tags = ['Files']
  #swagger.summary = 'Delete a file by UUID'
  #swagger.responses[204] = {
    "description": "File deleted successfully"
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
  "/:uuid", Metamodel_file_controller.delete_file_by_uuid
);

export default fileRouter;
