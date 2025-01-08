import {Router} from "express";
import instanceRouter from "./instances/Instance.routes";
import metamodelRouter from "./metamodel/Metamodel.routes";
import otherRouter from "./other.routes";
import loginRouter from "./metamodel/Login.routes";
import usergroupRouter from "./metamodel/Usergroups.route";
import fileRouter from "./metamodel/Metamodel_files.routes";
import usersRouter from "./metamodel/Metamodel_users.routes";
import {database_test} from "../data/services/middleware/database_test";

/**
 * @description - This is the all-in-one router for the entire project.
 * @type {Router}
 **/
const routes = Router();

// this is the instance part of the routes, every url have to start with /instances
routes.use("/instances", database_test, instanceRouter
    /* 
    #swagger.tags = ['Instance']
    */
);
// this is the metamodel part of the routes, every url have to start with /metamodel
routes.use("/metamodel", database_test, metamodelRouter
    /* 
    #swagger.tags = ['Metamodel']
    */
);
// this is the login part of the routes, every url have to start with /login
routes.use("/login", database_test, loginRouter
    /* 
    #swagger.tags = ['Login']
    */
);
// This is an alias for the /login route
routes.use("/userGroups", database_test, usergroupRouter
    /* 
    #swagger.tags = ['User Groups']
    */
);
routes.use("/users", database_test, usersRouter
    /* 
    #swagger.tags = ['Users']
    */
);

routes.use("/files", database_test, fileRouter
    /* 
    #swagger.tags = ['Files']
    */
);

// this is the auth part of the routes, every url have to start with /auth
routes.use("/", database_test, otherRouter
    /* 
    #swagger.tags = ['default']
    */
);

export default routes;
