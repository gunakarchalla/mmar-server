/**
 * Log every SQL statement the built server issues, one JSON line each.
 *
 * Preloaded in front of the server, never part of a build under test:
 *
 *   node --require ./test/read_equivalence/pg_query_log.js ../dist/mmar-server/index.js
 *
 * Why not pg_stat_user_tables: those counters are index PROBES, so one batched
 * query over 150 parents counts as ~150 and a per-object fan-out and a batched
 * read are indistinguishable. Counting statements answers the question the
 * scan counters cannot - how many times did the server go to the database.
 *
 * MMAR_QUERY_STACKS=1 also records the call site of each statement, which is
 * what separates "the write path re-reads" from "a middleware read it before
 * the handler ever ran". It costs a stack capture per query, so leave it off
 * when timing.
 *
 * The `pg` it patches has to be the very module instance the server loaded, so
 * it is resolved next to the server's own entry point rather than next to this
 * file - mmar-server/node_modules/pg is a different copy and patching it would
 * silently log nothing.
 */
const fs = require("fs");
const path = require("path");

const PG =
    process.env.MMAR_PG_PATH ||
    path.resolve(__dirname, "../../../dist/mmar-server/node_modules/pg");
const OUT = process.env.MMAR_QUERY_LOG || "/tmp/mmar_queries.log";
const WANT_STACKS = process.env.MMAR_QUERY_STACKS === "1";

const pg = require(PG);
try {
    fs.unlinkSync(OUT);
} catch {
    // First run, or somebody already removed it.
}

// The default of 10 frames stops short of the middleware that started the call.
Error.stackTraceLimit = 60;

/**
 * @description - The server's own frames of the current stack, innermost first,
 * with the absolute dist prefix stripped.
 * @returns {string} - The frames, joined with " <- ".
 */
function call_site() {
    return (new Error().stack || "")
        .split("\n")
        .slice(3)
        .filter((f) => f.includes("/dist/mmar-server/"))
        .map((f) => f.trim().replace(/^at /, "").replace(/\(.*\/dist\/mmar-server\//, "("))
        .slice(0, 20)
        .join(" <- ");
}

const original = pg.Client.prototype.query;
pg.Client.prototype.query = function (...args) {
    const first = args[0];
    const text = typeof first === "string" ? first : (first && first.text) || "<unknown>";
    const record = { q: text.replace(/\s+/g, " ").trim() };
    if (WANT_STACKS) record.at = call_site();
    // Synchronous, so the line is on disk before the statement is sent and a
    // probe can bracket a request by counting lines.
    fs.appendFileSync(OUT, JSON.stringify(record) + "\n");
    return original.apply(this, args);
};
