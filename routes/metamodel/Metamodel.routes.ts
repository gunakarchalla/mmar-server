import {Router} from "express";
import attributetypeMetaRouter from "./Metamodel_attributes_types.routes";
import sceneTypeRouter from "./Metamodel_scenetypes.routes";
import attributeMetaRouter from "./Metamodel_attributes.routes";
import classMetaRouter from "./Metmodel_classes.routes";
import relationclassMetaRouter from "./Metamodel_relationclasses.routes";
import roleMetaRouter from "./Metmodel_roles.routes";
import portMetaRouter from "./Metamodel_ports.routes";
import ruleMetaRouter from "./Metamodel_rules.routes";
import procedureMetaRouter from "./Metamodel_procedure.routes";

/**
 * @description This function is used to create the routes for the metamodel
 */
const metamodelRouter = Router();

metamodelRouter.use(attributetypeMetaRouter);
metamodelRouter.use(sceneTypeRouter);
metamodelRouter.use(attributeMetaRouter);
metamodelRouter.use(classMetaRouter);
metamodelRouter.use(relationclassMetaRouter);
metamodelRouter.use(roleMetaRouter);
metamodelRouter.use(portMetaRouter);
metamodelRouter.use(procedureMetaRouter);

metamodelRouter.use(ruleMetaRouter);

//metamodelRouter.use(fileRouter);

//TODO: implement in the v2

export default metamodelRouter;
