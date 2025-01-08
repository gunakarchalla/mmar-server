/**
 * @description - This is the list of available http error code
 */
export enum HttpStatusCode {
    OK = 200,
    BAD_REQUEST = 400,
    NOT_FOUND = 404,
    NOT_AUTHORIZED = 401,
    INTERNAL_SERVER = 500,
    FORBIDDEN = 403,
    CONFLICT = 409,
    DATABASEERROR = 503,
}

/**
 * @description - This is the base class for all the errors
 * @export - The class is exported so that it can be used by other files.
 * @class BaseError
 * @extends {Error}
 */
export class BaseError extends Error {
    public readonly name: string;
    public readonly httpCode: HttpStatusCode;
    public readonly isOperational: boolean;

    /**
     * @description - This class is the base of all errors
     * @param {String} name - The name of the error
     * @param {HttpStatusCode} httpCode - The code of the error see: https://en.wikipedia.org/wiki/List_of_HTTP_status_codes
     * @param {Boolean} isOperational - Severity degree: if not operational then restart gracefully else handle the error
     * @param {string} description - The description of the error
     */
    constructor(
        name: string,
        httpCode: HttpStatusCode,
        isOperational: boolean,
        description: string
    ) {
        super(description);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = name;
        this.httpCode = httpCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this);
    }
}

/**
 * @description - This is the class for the 404 not found error
 * @export - The class is exported so that it can be used by other files.
 * @class API404Error
 * @extends {BaseError}
 */
export class API404Error extends BaseError {
    /** @description - This is the standard 404 error */
    constructor(
        description = "Object not found",
        name = "Object not found",
        httpCode = HttpStatusCode.NOT_FOUND,
        isOperational = true
    ) {
        super(name, httpCode, isOperational, description);
    }
}

/**
 * @description - This is the class for the 401 not authorized error
 * @export - The class is exported so that it can be used by other files.
 * @class API401Error
 * @extends {BaseError}
 */
export class API401Error extends BaseError {
    /** @description - This is the standard 401 error */
    constructor(
        description = "Wrong password or username",
        name = "Wrong password or username",
        httpCode = HttpStatusCode.NOT_AUTHORIZED,
        isOperational = true
    ) {
        super(name, httpCode, isOperational, description);
    }
}

/**
 * @description - This is the class for the 500 internal server error
 * @export - The class is exported so that it can be used by other files.
 * @class HTTP500Error
 * @extends {BaseError}
 */
export class HTTP500Error extends BaseError {
    /** The standard internal error  */
    constructor(
        description = "Something went wrong in the server. Contact the admin.",
        name = "Internal server error",
        httpCode = HttpStatusCode.INTERNAL_SERVER,
        isOperational = true
    ) {
        super(name, httpCode, isOperational, description);
    }
}

/**
 * @description - This is the class for the 403 forbidden error
 * @export - The class is exported so that it can be used by other files.
 * @class HTTP403Constrain
 * @extends {BaseError}
 */
export class HTTP403Constrain extends BaseError {
    /**
     * The constraint are not met to post or update the object
     */
    constructor(
        description: string,
        name = "Constrain rule triggered",
        httpCode = HttpStatusCode.FORBIDDEN,
        isOperational = true
    ) {
        super(name, httpCode, isOperational, description);
    }
}

/**
 * @description - This is the class for the 409 conflict error
 * @export - The class is exported so that it can be used by other files.
 * @class HTTP409CONFLICT
 * @extends {BaseError}
 */
export class HTTP409CONFLICT extends BaseError {
    /** @description - This is the standard 409 error */
    constructor(
        description = "Conflict with the current state of the resource",
        name = "Conflict Error",
        httpCode = HttpStatusCode.CONFLICT,
        isOperational = true
    ) {
        super(name, httpCode, isOperational, description);
    }
}

/**
 * @description - This is the class for the 403 forbidden error
 * @export - The class is exported so that it can be used by other files.
 * @class HTTP403NORIGHT
 * @extends {BaseError}
 */
export class HTTP403NORIGHT extends BaseError {
    /**
     * The constraint are not met to post or update the object
     */
    constructor(
        description: string,
        name = "No right to access",
        httpCode = HttpStatusCode.FORBIDDEN,
        isOperational = true
    ) {
        super(name, httpCode, isOperational, description);
    }
}

/**
 * @description - This is the class for the error when the request is not valid.
 * @export - The class is exported so that it can be used by other files.
 * @class JSONPayloadedError
 * @extends {BaseError}
 */
export class JSONPayloadedError extends BaseError {
    public readonly payload: JSON | string;

    /**
     *  @description - This is the standard error with a payload in JSON or in string
     *
     * @param {string} name - The name of the error
     * @param {HttpStatusCode} httpCode - The code of the error see: https://en.wikipedia.org/wiki/List_of_HTTP_status_codes
     * @param {Boolean} isOperational - Severity degree: if not operational then restart gracefully else handle the error
     * @param {string} description - The description of the error
     * @param {JSON} payload - The payload to transmit to the client
     */
    constructor(
        name: string,
        httpCode: HttpStatusCode,
        isOperational = true,
        description: string,
        payload: JSON | string
    ) {
        super(name, httpCode, isOperational, description);
        this.payload = payload;
    }
}

export class HTTP404Error extends BaseError {
    /** @description - This is the standard 404 error */
    constructor(
        description = "Object not found",
        name = "Object not found",
        httpCode = HttpStatusCode.NOT_FOUND,
        isOperational = true
    ) {
        super(name, httpCode, isOperational, description);
    }
}
