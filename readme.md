# MMAR Metamodeling Platform - API Server Project

This project is part of the MMAR Metamodeling Platform, focusing on the API Server.

## Installation

The API Server is part of the MMAR Metamodeling Platform. To install the entire platform, please refer to the [MMAR repository](https://github.com/MM-AR/mmar) or the Wiki Entry of the [MMAR Manual Installation](https://github.com/MM-AR/mmar/wiki/Manual-MMAR-Installation).


## Authentication

### Configuration

The server validates its configuration on startup and refuses to boot when a mandatory
variable is missing, rather than failing later on a request. The variables are read from
the `.env` file at the root of the project, or from the environment:

| Variable | Mandatory | Description |
| --- | --- | --- |
| `JWT_SECRET` | yes | Secret used to sign and verify the JSON web tokens. |
| `TOKEN_EXPIRE_TIME` | no | Lifetime of an issued token. |
| `HTTPPORT` | no | Port of the server, `8000` by default. |

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
