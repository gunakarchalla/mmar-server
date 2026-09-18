import { RequestHandler } from "express";
import { verif_metamodel_body } from "./Metamodel_attributes.rules";

/**
 * A scene type carries its own attributes and its classes with theirs - which is how a
 * whole metamodel is imported - so the metamodel attribute rules apply to the whole body.
 */
export const verif_scenetype_body: RequestHandler = verif_metamodel_body;
