import { expect } from "chai";
import { PoolClient } from "pg";
import {
    current_user,
    run_with_request_context,
} from "../../data/services/request_context";
import { begin_transaction } from "../../data/services/transaction";
import type { AuthTokenPayload } from "../../data/services/middleware/auth.middleware";

const user: AuthTokenPayload = {
    uuid: "ff892138-77e0-47fe-a323-3fe0e1bf0240",
    username: "admin",
    isAdmin: true,
};

/**
 * @description - A client that records the statements it is asked to run.
 */
function make_client(): { client: PoolClient; statements: [string, unknown[]][] } {
    const statements: [string, unknown[]][] = [];
    const client = {
        query: (text: string, values: unknown[] = []) => {
            statements.push([text, values]);
            return Promise.resolve({ rows: [] });
        },
    } as unknown as PoolClient;
    return { client, statements };
}

describe("begin_transaction", () => {
    it("publishes the acting user to the database", async () => {
        const { client, statements } = make_client();

        await run_with_request_context({ user: user }, () =>
            begin_transaction(client)
        );

        expect(statements).to.have.length(2);
        expect(statements[0][0]).to.equal("BEGIN");
        expect(statements[1][0]).to.contain("set_config");
        expect(statements[1][1]).to.deep.equal([user.uuid]);
    });

    it("scopes the setting to the transaction so it cannot leak to the next request", async () => {
        const { client, statements } = make_client();

        await run_with_request_context({ user: user }, () =>
            begin_transaction(client)
        );

        // The third argument of set_config is the is_local flag: pooled
        // connections are reused, a session wide setting would leak.
        expect(statements[1][0]).to.contain("true");
    });

    it("opens a plain transaction for an anonymous request", async () => {
        const { client, statements } = make_client();

        await begin_transaction(client);

        expect(statements).to.have.length(1);
        expect(statements[0][0]).to.equal("BEGIN");
    });

    it("orders BEGIN before the setting", async () => {
        const { client, statements } = make_client();

        await run_with_request_context({ user: user }, () =>
            begin_transaction(client)
        );

        // set_config with is_local only takes effect inside a transaction block.
        expect(statements[0][0]).to.equal("BEGIN");
    });
});

describe("request context", () => {
    it("is empty outside of a request", () => {
        expect(current_user()).to.be.undefined;
    });

    it("survives the awaits of a request", async () => {
        await run_with_request_context({ user: user }, async () => {
            await new Promise((resolve) => setTimeout(resolve, 1));
            expect(current_user()?.uuid).to.equal(user.uuid);
            await new Promise((resolve) => setImmediate(resolve));
            expect(current_user()?.username).to.equal(user.username);
        });
    });

    it("keeps concurrent requests apart", async () => {
        const other: AuthTokenPayload = { ...user, uuid: "other-uuid", username: "bob" };
        const seen: string[] = [];

        const first = run_with_request_context({ user: user }, async () => {
            await new Promise((resolve) => setTimeout(resolve, 5));
            seen.push(current_user()?.username ?? "none");
        });
        const second = run_with_request_context({ user: other }, async () => {
            await new Promise((resolve) => setTimeout(resolve, 1));
            seen.push(current_user()?.username ?? "none");
        });

        await Promise.all([first, second]);

        expect(seen).to.deep.equal(["bob", "admin"]);
    });

    it("does not leak out of the request that set it", async () => {
        await run_with_request_context({ user: user }, async () => {
            expect(current_user()).to.not.be.undefined;
        });

        expect(current_user()).to.be.undefined;
    });
});
