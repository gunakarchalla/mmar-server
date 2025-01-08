import {RequestHandler} from "express";
import {database_connection, queries} from "../../../index";
import {ObjectInstance, UUID} from "../../../../mmar-global-data-structure";
import {API404Error, HTTP403Constrain,} from "../middleware/error_handling/standard_errors.middleware";
import {applyRules_ocl} from "./Metamodel_ocl";
import {applyRules_jsonRulesEngine} from "./Metamodel_jsonRulesEngine";
import Metamodel_common_functions from "../../meta/Metamodel_common_functions.connection";

export const custom_rules_object_instance_body: RequestHandler = async (
    req,
    res,
    next
) => {
    try {
        let engineSelection;
        if (req.query.engine !== undefined) engineSelection = req.query.engine.toString();

        const res_rules = await custom_rules_inner_object_instance_body(
            req.params.uuid,
            engineSelection
        );
        if (res_rules.state) {
            res.status(200).send(
                `The object instance with the uuid: ${req.params.uuid}, does comply to all the rules: ${res_rules.passed}`
            );
        } else {
            throw new HTTP403Constrain(
                `The object instance with the uuid: ${req.params.uuid}, does not meet the rules: ${res_rules.failed}.`
            );
        }
        next();
    } catch (err) {
        next(err);
    }
};

export async function custom_rules_inner_object_instance_body(
    uuidToTest: UUID,
    engine: string | undefined
): Promise<{
    state: boolean;
    failed: string[] | null;
    passed: string[] | null;
}> {
    const client = await database_connection.getPool().connect();
    try {
        const rule_query = queries.getQuery_get(
            "rule_by_metaobject_uuid_filter_query"
        );
        const instanceObjectToTest =
            await Metamodel_common_functions.getInstanceObjectByAnyInstanceUuid(
                client,
                uuidToTest
            );
        let res_rules;
        const related_meta_uuid =
            await Metamodel_common_functions.getMetaobjectWithInstanceUuid(
                client,
                uuidToTest
            );
        if (
            instanceObjectToTest instanceof ObjectInstance &&
            related_meta_uuid !== undefined
        ) {
            //the scenetotest actually exists
            switch (engine) {
                //here we select the engine to compute the rules
                case "ocl":
                    res_rules = (
                        await client.query(rule_query, [related_meta_uuid.uuid, "ocl%"])
                    ).rows;
                    return await applyRules_ocl(instanceObjectToTest, res_rules);


                case "jsonRulesEngine":
                    res_rules = (
                        await client.query(rule_query, [
                            related_meta_uuid.uuid,
                            "jsonRulesEngine%",
                        ])
                    ).rows;
                    return await applyRules_jsonRulesEngine(
                        instanceObjectToTest,
                        res_rules
                    );

                default:
                    return {state: true, failed: null, passed: null};
            }
        } else {
            throw new API404Error(
                `Cannot find object instance with uuid ${uuidToTest}.`
            );
        }
        // eslint-disable-next-line no-useless-catch
    } catch (err) {
        throw err;
    } finally {
        client.release();
    }
}
