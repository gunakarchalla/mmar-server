# MMAR Metamodeling Platform - API Server Project

This project is part of the MMAR Metamodeling Platform, focusing on the API Server.

## Installation

The API Server is part of the MMAR Metamodeling Platform. To install the entire platform, please refer to the [MMAR repository](https://github.com/MM-AR/mmar) or the Wiki Entry of the [MMAR Manual Installation](https://github.com/MM-AR/mmar/wiki/Manual-MMAR-Installation).


## Authentication

### Configuration

The server validates its configuration on startup and refuses to boot when a mandatory
variable is missing or unusable, rather than failing later on a request. The variables are
read from the `.env` file at the root of the project, or from the environment. Copy
`.env.example` to `.env` to get started; that file documents every variable, and the table
below lists the ones that matter most.

Nothing containing a secret is committed to the repository. `.env` and the former
`config/DBConfig.json` are git-ignored, and the credentials that used to live in them —
including a `JWT_SECRET` of `secret` and a database password of `root` — were published in
the git history and must be treated as compromised wherever this code was ever deployed.

| Variable | Mandatory | Description |
| --- | --- | --- |
| `JWT_SECRET` | yes | Secret used to sign and verify the JSON web tokens. Must be at least 32 characters; the server will not start with a shorter one. Generate with `openssl rand -base64 48`. |
| `PGPASSWORD` | yes | Password of the database role the server connects as. |
| `PGHOST`, `PGPORT`, `PGUSER`, `PGDATABASE` | no | Database connection, defaulting to `database:5432` / `api` / `api`. |
| `PGPOOL_MAX` | no | Connections held open by this process, `25` by default. One request uses one connection, so this only has to cover the requests in flight, and it must stay well below the database's own `max_connections` across every server instance. |
| `PG_STATEMENT_TIMEOUT_MS` | no | Upper bound on a single query, `30000` by default, so a runaway statement cannot pin a connection. |
| `TOKEN_EXPIRE_TIME` | no | Lifetime of an issued token (`30m`, `8h`, or a number of seconds), `8h` by default. There is no revocation list, so this is also how long a leaked token stays usable. |
| `HTTPPORT` | no | Port of the server, `8000` by default. |
| `NODE_ENV` | no | `development` enables verbose logging and drops the `secure` flag on the auth cookie so it works over plain HTTP. Anything else is treated as production. |
| `CORS_ORIGINS` | no | Comma separated browser origins allowed to call the API. The API accepts cookie authentication, so it cannot be left open to every origin when this is set; unset means same-origin only. |
| `TRUST_PROXY_HOPS` | no | Number of reverse proxies in front of the server, `0` by default. Set it so that `req.ip` is the real client, which the rate limiter and the audit trail both depend on. |
| `MAX_UPLOAD_BYTES` | no | Largest uploaded file accepted, `16 MiB` by default. |

### Authenticating a request

A client authenticates either with the `Authorization: Bearer <token>` header, which takes
precedence, or with the `authcookie` cookie set by `POST /login`. A rejected request is
answered with a `401` and one of `No token provided`, `Empty token provided`,
`Token expired` or `Invalid token`.

### Using the authenticated user in a handler

The verified token payload is exposed as `req.user`, never inside `req.body`: the body is
supplied by the client, so an identity stored there cannot be told apart from a forged one.
Handlers do not read `req.user` directly, they use one of the two accessors of
`data/services/middleware/auth.middleware.ts`:

- `requireUser(req)` returns the authenticated user and throws a `401` if the route is not
  guarded by `authenticate_token`. Use it on every protected route.
- `getUser(req)` returns `undefined` when the request is anonymous. Use it only on routes
  that are deliberately reachable without authentication.

A route that acts on behalf of a user must therefore declare the `authenticate_token`
middleware, for example:

```ts
router.delete("/files/:uuid", authenticate_token, controller.delete_file_by_uuid);
```

### Administrators

An administrator is a member of any user group whose `is_administrator` column is set. A
group named `administrators` carrying that flag is seeded by the database, and the `admin`
account belongs to it, but nothing in the code refers to that particular group: membership
is what confers the privilege, so it can be granted and revoked through the ordinary user
group API, and a deployment may flag more than one group. This replaces a single hardcoded
user uuid that used to be written into every right check, which could be granted to nobody
else and revoked from no one.

`public.is_administrator(uuid)` in the database is the one definition of the privilege. The
SQL right checks call it, and so does the server, through `require_administrator`:

```ts
router.post("/signup", authenticate_token, require_administrator, controller.post_user);
```

The check reads the database rather than the `isAdmin` claim carried by the token, so that
revoking someone's administrator status takes effect on their next request instead of when
their token happens to expire. Creating an account is restricted to administrators; there is
no anonymous self-service sign up.

### Rate limiting

`POST /login` and `POST /login/signin` are rate limited per client address: every attempt
costs a deliberately expensive bcrypt comparison, so without a limit the endpoint is both a
password oracle and a cheap way to exhaust the CPU. Successful sign ins do not count against
the limit. Set `TRUST_PROXY_HOPS` correctly, or every client behind the proxy is bucketed as
one.

### Security audit trail

Security events are recorded in `logging.t_security_event`, in the same database as the rest
of the data, so that they can be queried and joined with it:

| event | outcome | when |
| --- | --- | --- |
| `login` | success / failure | a sign in through `POST /login` |
| `token_verification` | failure | a request presenting a missing, blank, expired or invalid token |
| `token_verification` | success | every authenticated request, **not recorded** by default, see below |
| `access_grant` | success | an access right is granted or changed on a scene instance |
| `access_revoke` | success | an access right is removed |
| `access_denied` | failure | any request refused with a 403, wherever it was raised |

The offending token is never stored, only a short non reversible fingerprint of it, which is
enough to tell a single stale token being retried apart from many distinct forged ones. The
client address, method, route and user agent are stored alongside.

A successful token verification happens on every single authenticated call, so recording it
would add one insert per API request to the database holding the models. It is dropped
unless `SECURITY_AUDIT_PERSIST_TOKEN_SUCCESS=true` is set. Everything else is low volume and
always recorded.

The insert runs on its own pooled connection, never on the transaction of the request, so an
audit record does not disappear when the request it describes is rolled back. It never blocks
nor fails a request. The database is the only sink, so an event that cannot be written is
lost: that situation is reported on stderr, where the container log picks it up.

### Attribution of the data changes

`logging.t_history` records every change to `metaobject` and `instance_object` through a
database trigger. Its `who` column holds the *database* role, and since every connection of
the pool authenticates as the same role, it cannot tell the platform users apart. The
`uuid_user` column answers that question.

The identity is carried from the request down to the trigger like this:

1. `authenticate_token` opens an async local context holding the verified user.
2. `begin_transaction(client)`, which replaces `client.query("BEGIN")` everywhere, reads
   that context and publishes the uuid with
   `set_config('mmar.uuid_user', <uuid>, true)`.
3. `public.change_trigger()` reads it back through `public.current_app_user()`.

The setting is **transaction local**, hence the `true`: it is discarded on commit or
rollback and can never leak to the next request that borrows the same pooled connection.

A handler that opens a transaction must therefore use the helper rather than issuing a raw
`BEGIN`, otherwise its writes are recorded without an author:

```ts
import { begin_transaction } from "../../data/services/transaction";

const client = await database_connection.getPool().connect();
await begin_transaction(client);
```

A `uuid_user` left `NULL` means the change was not made through the API server, for example
by a direct SQL session. The schema lives in the
[mmar-database](https://github.com/MM-AR/mmar-database) repository.


## Connections and transactions

One request uses one database connection, held for the length of its transaction.
That is what lets `PGPOOL_MAX` stay small, and it is a property worth preserving when
adding code: a handler that opens a second connection while holding the first doubles
the pool the server needs, and under load the two halves of the same request can end up
waiting on each other.

Two rules follow from it.

**A helper takes the caller's client, it does not borrow its own.** Everything under
`data/` accepts a `PoolClient` as its first argument. The rule engine nests — verifying a
scene verifies its classes, which verify their attributes — so the verificators pass the
client down and use `with_client` from `data/services/database_connection.ts`, which
borrows a connection only when the caller has none:

```ts
export async function verif_inner_class_instance_body(
  classToTest: ClassInstance | ClassInstance[],
  client?: PoolClient
) {
  return await with_client(client, async (c) => applyRules(c, classToTest));
}
```

**A sequence of related reads and writes belongs in one transaction.** Asking each
question on a connection of its own answers each from a different snapshot, which is how
two concurrent revocations can each see another owner and between them remove the last
one. `Scene_access_controller` shows the shape: one `begin_transaction`, every helper on
that client, commit at the end.

## Reading a tree of objects

A scene instance is a tree — classes, their attributes, their ports, the attributes of
those ports — and the obvious way to load it is to walk it: fetch the children, then ask
each child for its own children. That is what the data layer used to do, and it cost one
query per node. Measured on a scene of 150 objects holding seven attributes each, a single
`GET /instances/sceneInstances/:uuid` issued **5,604 table scans and took about 1.1
seconds**, on an idle server with a warm cache.

Each level is now one query regardless of how wide it is. `getAllByParentUuids` takes every
parent at that level and returns the children keyed by parent:

```ts
const [attributes, ports] = await Promise.all([
    Instance_attribute_connection.getAllByParentUuids(client, classUuids, "class"),
    Instance_port_connection.getAllByParentUuids(client, classUuids, "class"),
]);
for (const currentClass of returnClasses) {
    currentClass.set_attribute_instances(attributes.get(currentClass.get_uuid()) ?? []);
}
```

The same read now costs **108 scans and about 100 ms** — 52 times fewer round trips, 11
times faster — and returns byte-for-byte the same document, so no client changed.

The rule for new code: when loading the children of many parents, pass the parents as an
array and let PostgreSQL do the grouping (`WHERE parent = ANY($1::uuid[])`). Calling a
`getByUuid` in a loop reintroduces exactly the cost above.

The metamodel reads are batched the same way, and there the dominant cost was not the rows
but the repetition: every attribute loaded its attribute type from scratch, and an
attribute type is a subtree carrying a role and a table of columns whose entries are
themselves attributes. A scene type where forty attributes are all of type `String` built
that subtree forty times. Each distinct type is now loaded once, by the same function as
before. Across four real metamodels that took **9,434 table scans and 1.5 s down to 2,716
and 0.75 s**.

**Verify a read rewrite against the response, not against the tests.** The suite asserts
status codes and a handful of fields; it passed in full while an earlier attempt at this
silently dropped a subtree and reordered arrays. `test/read_equivalence/` captures the
documents an endpoint returns and diffs two captures — see the README there for the three
traps it caught.

## Answering only once the work is durable

A handler used to send its response and then commit. The window between the two is
small but real: a client that acted on a `201` could issue its next request before the
row it had just been promised existed. Creating a user and immediately signing in as
them returned *wrong password or username*, intermittently, and more often the faster the
server got.

Every handler now commits first. New code should use `withTransaction`, which makes the
ordering structural — the handler returns its body and the helper sends it, so the two
cannot be written the wrong way round:

```ts
post_user: RequestHandler = withTransaction(
    async (client, req) => Users_connection.create(client, User.fromJS(req.body), requireUser(req).uuid),
    { status: 201 }
);
```

It also contains a failing `ROLLBACK`, which used to throw out of the catch block and take
`next(err)` with it, leaving the request hanging instead of failing.

## Statuses

A malformed uuid in the path is rejected with `400` by `validate_uuid_params`, installed on
every router that declares such a route. Without it the value travelled to PostgreSQL,
failed to cast, and came back as a `500` — the server reporting its own error for what was
plainly a bad request. Asking to delete something that does not exist answers `404`.

## Ownership that the schema does not express

A bendpoint is a class instance that a relationclass instance bends through, and it has no
meaning without that relation. Nothing in the schema says so: the link lives in
`relationclass_instance.line_points`, a `text[]` of JSON documents naming class instances,
and `class_instance.uuid_relationclass_bendpoint` points at the *meta* class rather than at
the relation. There is therefore no foreign key for the database to cascade along, and
deleting a relation used to leave its bendpoints behind — class instances in the scene that
nothing referenced and no client could reach.

`Instance_relationclasses.deleteByUuid` resolves that ownership itself, reading
`line_points` before the relation is deleted, since deleting it takes them with it.

## Indexes

PostgreSQL creates an index for a primary key or a unique constraint, never for a foreign
key. The schema declares 111 of them, and the columns they cover are exactly what the API
walks to get from a parent to its children — the attributes of a class, the classes of a
scene, the rights of a user. `init.sql` therefore ends with a `CREATE INDEX` for each of
them; measured on a scene of 150 objects, their absence turned the attribute lookup from
a bitmap index scan into a sequential scan and made the read 3.4 times slower, a gap that
widens as the tables grow.

Adding a foreign key means adding its index in the same change.

## Development

```bash
npm run lint        # eslint over the whole project
npm run test:unit   # the tests that need no database
npm run test:reset  # recreate the test database from init.sql
npm test            # the full suite, needs a database and a running server
npm run test:db     # reset, then run the full suite
```

Point the suite at a database of its own by putting its settings in `.env.test`, with a
`PGDATABASE` ending in `_test` — `test/reset_test_database.js` refuses to drop anything
else, so it cannot be aimed at the development database by accident.

`npm test` drives the real API against a real database, so it needs both up: see
`.github/workflows/ci.yml`, which loads `mmar-database/init.sql` into a throwaway
PostgreSQL, starts the server and runs the suite the same way.

Run it against a **fresh** database. `TestEnvironmentSetup` records which rows exist before
the first spec runs and every `tearDown` removes everything created since, so a spec no
longer inherits whatever the previous one forgot to delete — the suite used to produce a
different set of failures each time it ran, and the same spec could pass alone and fail in
the suite. That sweep is a safety net, not a substitute for starting clean: it cannot undo
changes to rows that were already there.

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the development branche of the repository you want to work on.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -am 'Add new feature'`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Create a new Pull Request.

Contributions must be documented to be merged into the project. If you contribute something to the project, please document the according changes into the Wiki, or the readme.

## License

This repository is licensed under the GNU AFFERO GENERAL PUBLIC LICENSE Version 3. 

The GNU Affero General Public License (GNU AGPL) is a free, copyleft license published by the Free Software Foundation in November 2007, and based on the GNU GPL version 3 and the Affero General Public License. It is intended for software designed to be run over a network, adding a provision requiring that the corresponding source code of modified versions of the software be prominently offered to all users who interact with the software over a network (https://en.wikipedia.org/wiki/GNU_Affero_General_Public_License).

The GNU AGPL is specifically designed to ensure cooperation with the community in the case of network server software. The licenses for most software are designed to take away your freedom to share and change the works. By contrast, the GNU AGPL is intended to guarantee your freedom to share and change all versions of a program–to make sure it remains free software for all its users (https://www.gnu.org/licenses/agpl-3.0.en.html).

This means that any kind of published change done to the repository must be published again under the same license. For more information have a look at the LICENSE file.
