import {ClassInstance, ObjectInstance, SceneInstance, SceneType} from "../../../../mmar-global-data-structure";
import {OclEngine} from "@stekoe/ocl.js";
import {Rule as InternRule} from "../../../../mmar-global-data-structure/models/meta/Metamodel_rules.structure";

export async function applyRules_ocl(
  objectToTest: ObjectInstance,
  constraints: InternRule[]
): Promise<{
  state: boolean;
  failed: string[] | null;
  passed: string[] | null;
}> {
  /**
   * Create an empty engine
   */
  const oclEngine = OclEngine.create();

  /**
   * Link inner type to custom OCL types to be referenced by the user
   * Register them in the engine
   */
  const customTypes = {
    SceneType: SceneType,
    SceneInstance: SceneInstance,
    ClassInstance: ClassInstance,
  };
  oclEngine.registerTypes(customTypes);

  /**
   * Add the rules to the engine
   */
  for (const rule of constraints) {
    oclEngine.addOclExpression(rule.value);
  }

  /**
   * Test the rules against the object
   */
  const result_test_rules = oclEngine.evaluate(objectToTest);

  return {
    state: result_test_rules.getResult(),
    failed: result_test_rules.getNamesOfFailedInvs(),
    passed: null,
  };
}
