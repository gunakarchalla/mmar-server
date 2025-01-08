import {Engine} from "json-rules-engine";
import {ObjectInstance} from "../../../../mmar-global-data-structure";
import {Rule as InternRule} from "../../../../mmar-global-data-structure/models/meta/Metamodel_rules.structure";

export async function applyRules_jsonRulesEngine(
  objectToTest: ObjectInstance,
  constraints: InternRule[]
): Promise<{
  state: boolean;
  failed: string[] | null;
  passed: string[] | null;
}> {
  /**
   * Create en empty rule engine
   */
  const engine = new Engine();

  /**
   * Add the count operators to the engine
   * The count operators counts the length of an array and compare it to a parameter
   */
  engine.addOperator("countLessThan", (factValue, jsonValue) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return factValue.length < jsonValue;
  });
  engine.addOperator("countGreaterThanInclusive", (factValue, jsonValue) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return factValue.length >= jsonValue;
  });

  /**
   * Add the rules to the engine
   */
  for (const rule of constraints) {
    engine.addRule(JSON.parse(rule.value));
  }

  /**
   * for testing purposes only
   */
  engine.addFact("booltrue", true);

  /**
   * Create an empty string array return to the messages of failed events
   */
  const failedMsgs: string[] = [];

  /**
   * run the engine against the current object
   */
  const msgs = await engine.run(objectToTest);

  /**
   * Get the property message of the failed events and push it to the array
   */
  for (const vnt of msgs.failureEvents) {
    if (vnt.params !== undefined) {
      failedMsgs.push(vnt.params.message);
    }
  }

  return {
    state: failedMsgs.length == 0,
    failed: failedMsgs,
    passed: null,
  };
}
