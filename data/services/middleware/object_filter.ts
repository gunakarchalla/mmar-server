import {ParsedQs} from "qs";
import {MetaObject, ObjectInstance, Rule} from "../../../../mmar-global-data-structure";
import {JSONPath} from 'jsonpath-plus';

/**
 * @description - This function is used to apply the filter to the object before sending it.
 * @param {| MetaObject | ObjectInstance | MetaObject[] | ObjectInstance[] | string[] | Rule | Rule[]} sc - The object to filter.
 * @param {string | ParsedQs | string[] | ParsedQs[] | undefined} filter - The filter to apply comming from the ulr (/?filter=[a,b,c])
 * @returns {unknown} - The filtered object.
 * @throws {Error} - If there is an error in the filter.
 * @method
 */
export function filter_object(
// gna gna gna implicit any type gna gna gna bad practice gna gna gna
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
sc,
filter: string | ParsedQs | string[] | ParsedQs[] | undefined
): unknown {
    try {
        if (filter && typeof filter === "string") {
            const jsonPath = filter;
            const filteredResult = JSONPath({path: jsonPath, json: sc});
            return filteredResult;
        } else {
            return sc;
        }
    } catch (err) {
        throw Error(`Error the filter could not be applied to the object: ${err}`);
    }
}
