import { expect } from "chai";
import { Request, Response } from "express";
import { logError } from "../../data/services/middleware/error_handling/error_handling.middleware";
import {
    API401Error,
    BaseError,
    HTTP403NORIGHT,
    HttpStatusCode,
} from "../../data/services/middleware/error_handling/standard_errors.middleware";
import { User, Usergroup } from "../../../mmar-global-data-structure";

/**
 * @description - A response that records what was written to it rather than
 * writing anything, so that a handler can be observed without a socket.
 */
function make_response(options: { headersSent?: boolean } = {}) {
    const recorded: { status?: number; body?: unknown } = {};
    const res = {
        headersSent: options.headersSent ?? false,
        status(code: number) {
            recorded.status = code;
            return this;
        },
        json(payload: unknown) {
            recorded.body = payload;
            return this;
        },
        send(payload: unknown) {
            recorded.body = payload;
            return this;
        },
    };
    return { res: res as unknown as Response, recorded };
}

/**
 * @description - A request carrying only what the error middleware reads from it.
 */
function make_request(): Request {
    return {
        method: "GET",
        originalUrl: "/instances/sceneInstances/x",
        get: () => undefined,
    } as unknown as Request;
}

describe("logError", () => {
    it("answers a deliberate error with its own status and message", () => {
        const { res, recorded } = make_response();
        let passed_on = false;

        logError(
            new API401Error("Token expired", "Token expired"),
            make_request(),
            res,
            () => {
                passed_on = true;
            }
        );

        expect(recorded.status).to.equal(HttpStatusCode.NOT_AUTHORIZED);
        expect(recorded.body).to.deep.equal({ error: "Token expired" });
        expect(passed_on, "must not also delegate to Express").to.be.false;
    });

    it("does not disclose the message of an unexpected error", () => {
        const { res, recorded } = make_response();

        // What the data layer actually throws: the raw database error, wrapped.
        const leaky = new Error(
            'Error getting the scene 4f2: error: relation "scene_instance" does not exist'
        );

        logError(leaky, make_request(), res, () => undefined);

        expect(recorded.status).to.equal(HttpStatusCode.INTERNAL_SERVER);
        expect(recorded.body).to.deep.equal({ error: "Internal server error" });
        expect(JSON.stringify(recorded.body)).to.not.contain("scene_instance");
    });

    it("never writes twice when the response has already started", () => {
        const { res, recorded } = make_response({ headersSent: true });
        let delegated: unknown;

        const err = new HTTP403NORIGHT("no right");
        logError(err, make_request(), res, (e?: unknown) => {
            delegated = e;
        });

        expect(recorded.status, "must not write a second status").to.be.undefined;
        expect(delegated).to.equal(err);
    });

    it("reports a thrown non-error as an opaque failure", () => {
        const { res, recorded } = make_response();

        logError("something threw a string", make_request(), res, () => undefined);

        expect(recorded.status).to.equal(HttpStatusCode.INTERNAL_SERVER);
        expect(recorded.body).to.deep.equal({ error: "Internal server error" });
    });

    it("keeps the status of every BaseError subclass", () => {
        for (const [error, expected] of [
            [new HTTP403NORIGHT("denied"), HttpStatusCode.FORBIDDEN],
            [new API401Error(), HttpStatusCode.NOT_AUTHORIZED],
        ] as [BaseError, HttpStatusCode][]) {
            const { res, recorded } = make_response();
            logError(error, make_request(), res, () => undefined);
            expect(recorded.status).to.equal(expected);
        }
    });
});

describe("User.is_admin", () => {
    /**
     * @description - Build a user belonging to the given groups.
     */
    function user_in_groups(groups: Partial<Usergroup>[]): User {
        const user = new User("u-1", "Someone", "someone", "");
        user.set_has_user_group(groups as Usergroup[]);
        return user;
    }

    it("is true for a member of a group flagged administrative", () => {
        expect(user_in_groups([{ is_administrator: true }]).is_admin()).to.be.true;
    });

    it("is true when only one of several groups is administrative", () => {
        expect(
            user_in_groups([
                { is_administrator: false },
                { is_administrator: true },
            ]).is_admin()
        ).to.be.true;
    });

    it("is false for a member of ordinary groups only", () => {
        expect(
            user_in_groups([
                { is_administrator: false },
                { can_create_class: true } as Partial<Usergroup>,
            ]).is_admin()
        ).to.be.false;
    });

    it("is false for a user in no group at all", () => {
        expect(user_in_groups([]).is_admin()).to.be.false;
    });

    it("no longer grants administrator by username and uuid", () => {
        // The old rule was username === "admin" && uuid === <hardcoded>. A user
        // matching it but belonging to no administrative group must not pass.
        const user = new User(
            "ff892138-77e0-47fe-a323-3fe0e1bf0240",
            "admin",
            "admin",
            ""
        );
        user.set_has_user_group([]);
        expect(user.is_admin()).to.be.false;
    });

    it("does not throw when the groups were never loaded", () => {
        const user = new User("u-2", "Someone", "someone", "");
        expect(() => user.is_admin()).to.not.throw();
        expect(user.is_admin()).to.be.false;
    });
});
