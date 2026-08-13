import { AsyncLocalStorage } from "async_hooks";
import type { AuthTokenPayload } from "./middleware/auth.middleware";

/**
 * @description - What is known about the request currently being served.
 */
interface RequestContext {
    /** @description - The authenticated user, absent on an anonymous route. */
    user?: AuthTokenPayload;
}

/**
 * @description - The context of the request being served, carried implicitly.
 *
 * The identity of the caller is needed deep down in the data layer, to attribute
 * the rows written to logging.t_history, where the request object is not
 * available. Threading it through the signature of every connection method would
 * touch the whole codebase, so it travels in an async local store instead, which
 * node propagates across the awaits of a single request.
 */
const storage = new AsyncLocalStorage<RequestContext>();

/**
 * @description - Run a request, and everything it awaits, inside a context.
 * @param {RequestContext} context - The context of the request.
 * @param {() => T} callback - The continuation of the request.
 * @returns {T} - Whatever the continuation returns.
 */
export function run_with_request_context<T>(
    context: RequestContext,
    callback: () => T
): T {
    return storage.run(context, callback);
}

/**
 * @description - The user on whose behalf the current code runs.
 * @returns {AuthTokenPayload | undefined} - The user, or undefined outside of an
 * authenticated request, for example on a login route or in a background task.
 */
export function current_user(): AuthTokenPayload | undefined {
    return storage.getStore()?.user;
}
