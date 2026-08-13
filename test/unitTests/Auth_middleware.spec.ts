import { expect } from "chai";
import { NextFunction, Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import {
    authenticate_token,
    getUser,
    requireUser,
} from "../../data/services/middleware/auth.middleware";
import { environment } from "../../data/services/environment";
import { current_user } from "../../data/services/request_context";
import { BaseError } from "../../data/services/middleware/error_handling/standard_errors.middleware";

const valid_claims = {
    uuid: "ff892138-77e0-47fe-a323-3fe0e1bf0240",
    username: "admin",
    isAdmin: true,
};

/**
 * @description - Build a minimal request. The response is deliberately left empty:
 * the middleware must never write to it, it reports through next().
 */
function make_request(options: {
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
    body?: Record<string, unknown>;
}): Request {
    return {
        headers: options.headers ?? {},
        cookies: options.cookies ?? {},
        body: options.body ?? {},
        method: "GET",
        originalUrl: "/unit-test",
        ip: "127.0.0.1",
        get: () => undefined,
    } as unknown as Request;
}

/**
 * @description - Run the middleware and capture what it forwarded to next().
 */
function run(req: Request): { error?: BaseError; called: boolean } {
    const result: { error?: BaseError; called: boolean } = { called: false };
    const next: NextFunction = (err?: unknown) => {
        result.called = true;
        if (err !== undefined) result.error = err as BaseError;
    };
    authenticate_token(req, {} as Response, next);
    return result;
}

function bearer(token: string): Record<string, string> {
    return { authorization: `Bearer ${token}` };
}

describe("authenticate_token", () => {
    it("accepts a valid token and exposes the user on the request", () => {
        const token = jwt.sign(valid_claims, environment.jwt_secret);
        const req = make_request({ headers: bearer(token) });

        const { error, called } = run(req);

        expect(called).to.be.true;
        expect(error).to.be.undefined;
        expect(req.user).to.not.be.undefined;
        expect(req.user?.uuid).to.equal(valid_claims.uuid);
        expect(req.user?.username).to.equal(valid_claims.username);
        expect(req.user?.isAdmin).to.equal(true);
    });

    it("does not write the identity into the request body", () => {
        const token = jwt.sign(valid_claims, environment.jwt_secret);
        const req = make_request({ headers: bearer(token) });

        run(req);

        expect(req.body).to.deep.equal({});
    });

    it("ignores an identity forged in the request body", () => {
        // A caller must not be able to authenticate, nor to override the verified
        // identity, by putting claims in the body it controls.
        const forged = { uuid: "00000000-0000-0000-0000-000000000000" };
        const req = make_request({ body: { tokendata: forged, user: forged } });

        const { error } = run(req);

        expect(error?.httpCode).to.equal(401);
        expect(req.user).to.be.undefined;
    });

    it("keeps the verified identity when the body also carries claims", () => {
        const token = jwt.sign(valid_claims, environment.jwt_secret);
        const req = make_request({
            headers: bearer(token),
            body: { user: { uuid: "00000000-0000-0000-0000-000000000000" } },
        });

        run(req);

        expect(req.user?.uuid).to.equal(valid_claims.uuid);
    });

    it("rejects a request without any token", () => {
        const { error } = run(make_request({}));

        expect(error?.httpCode).to.equal(401);
        expect(error?.message).to.equal("No token provided");
    });

    it("rejects a blank token", () => {
        const { error } = run(make_request({ cookies: { authcookie: "   " } }));

        expect(error?.httpCode).to.equal(401);
        expect(error?.message).to.equal("Empty token provided");
    });

    it("rejects a token signed with another secret", () => {
        const token = jwt.sign(valid_claims, "not-the-server-secret");

        const { error } = run(make_request({ headers: bearer(token) }));

        expect(error?.httpCode).to.equal(401);
        expect(error?.message).to.equal("Invalid token");
    });

    it("reports an expired token distinctly", () => {
        const token = jwt.sign(valid_claims, environment.jwt_secret, {
            expiresIn: "-1s",
        });

        const { error } = run(make_request({ headers: bearer(token) }));

        expect(error?.httpCode).to.equal(401);
        expect(error?.message).to.equal("Token expired");
    });

    it("rejects a correctly signed token that does not describe a user", () => {
        const token = jwt.sign({ unrelated: "payload" }, environment.jwt_secret);

        const { error } = run(make_request({ headers: bearer(token) }));

        expect(error?.httpCode).to.equal(401);
        expect(error?.message).to.equal("Invalid token");
    });

    it("falls back to the authentication cookie", () => {
        const token = jwt.sign(valid_claims, environment.jwt_secret);
        const req = make_request({ cookies: { authcookie: token } });

        run(req);

        expect(req.user?.uuid).to.equal(valid_claims.uuid);
    });

    it("accepts the bearer scheme regardless of its case", () => {
        const token = jwt.sign(valid_claims, environment.jwt_secret);
        const req = make_request({ headers: { authorization: `bearer ${token}` } });

        run(req);

        expect(req.user?.uuid).to.equal(valid_claims.uuid);
    });

    it("makes the user available to the data layer through the request context", () => {
        // The connection layer has no access to the request object; it reads the
        // acting user from the context this middleware opens.
        const token = jwt.sign(valid_claims, environment.jwt_secret);
        const req = make_request({ headers: bearer(token) });
        let seen: string | undefined;

        authenticate_token(req, {} as Response, () => {
            seen = current_user()?.uuid;
        });

        expect(seen).to.equal(valid_claims.uuid);
    });

    it("leaves no context behind for an unauthenticated request", () => {
        run(make_request({}));

        expect(current_user()).to.be.undefined;
    });

    it("does not turn an error thrown downstream into an authentication failure", () => {
        // next() runs the rest of the chain synchronously; an error raised there
        // must propagate untouched instead of being reported as a bad token.
        const token = jwt.sign(valid_claims, environment.jwt_secret);
        const req = make_request({ headers: bearer(token) });
        const downstream = new Error("failure in a later handler");

        expect(() =>
            authenticate_token(req, {} as Response, () => {
                throw downstream;
            })
        ).to.throw(downstream);
    });

    it("does not crash when the cookie parser did not run", () => {
        const req = { headers: {}, body: {}, method: "GET", originalUrl: "/u", ip: "::1", get: () => undefined } as unknown as Request;

        const { error } = run(req);

        expect(error?.httpCode).to.equal(401);
    });
});

describe("requireUser", () => {
    it("returns the authenticated user", () => {
        const req = make_request({});
        req.user = { ...valid_claims };

        expect(requireUser(req).uuid).to.equal(valid_claims.uuid);
    });

    it("throws a 401 when the route was never authenticated", () => {
        expect(() => requireUser(make_request({}))).to.throw();
        try {
            requireUser(make_request({}));
        } catch (err) {
            expect((err as BaseError).httpCode).to.equal(401);
        }
    });
});

describe("getUser", () => {
    it("returns undefined when the request is anonymous", () => {
        expect(getUser(make_request({}))).to.be.undefined;
    });

    it("returns the user when the request is authenticated", () => {
        const req = make_request({});
        req.user = { ...valid_claims };

        expect(getUser(req)?.username).to.equal(valid_claims.username);
    });
});
