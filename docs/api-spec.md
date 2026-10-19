# Case Queue API — Specification

Base URL: `http://localhost:3000`

TypeScript types for every request and response are in [`src/types.ts`](../src/types.ts). The file
has no imports, so you can copy it into a client project.

## Conventions

### Requests

- Request bodies must be JSON with `Content-Type: application/json`. A `POST` or `PATCH` with any
  other content type gets `415`.
- Query parameters are flat strings. Bracket syntax such as `?a[b]=c` is not parsed into objects;
  the key is taken literally (`a[b]`) and ignored.

### CORS

The API allows cross-origin requests from `http://localhost:5173` (the Vite dev server) with
credentials. From the browser:

- send every request with `credentials: 'include'`, or the session cookie is not sent;
- the `Location` header is exposed, so `response.headers.get('Location')` works cross-origin.

### Errors

Every non-2xx response has the same body:

```json
{ "error": { "message": "Human-readable description", "code": "machine_readable_code" } }
```

Validation errors add a `fields` array (`[{ "field": "title", "message": "..." }]`).

| Status | `error.code` | When |
|---|---|---|
| 400 | `bad_request` | Malformed JSON body or invalid query parameter |
| 404 | `not_found` | No route matches the method and path |
| 413 | `payload_too_large` | JSON body larger than 100 KB |
| 415 | `unsupported_media_type` | `POST` or `PATCH` without `Content-Type: application/json` |
| 500 | `internal` | Unexpected server error |
| 500 | `forced_failure` | `?fail=1` was passed (see below) |

### Dev affordances

Every `GET` request accepts two extra query parameters for building loading and error states.
They are applied before anything else, so they also work on routes that would return `401` or `404`.

| Parameter | Effect | Invalid value |
|---|---|---|
| `delay=<ms>` | Wait this many milliseconds before responding. Values over `10000` are capped at 10 seconds. | Anything but a non-negative integer → `400` |
| `fail=1` | Respond `500` with code `forced_failure`. Applied after `delay`, so `?delay=1500&fail=1` gives a slow failure. `fail=0` does nothing. | Anything but `0` or `1` → `400` |

Both are disabled when `NODE_ENV=production`; the parameters are then ignored.

```sh
curl -i 'http://localhost:3000/api/health?delay=1500'
curl -i 'http://localhost:3000/api/health?delay=1500&fail=1'
```

---

## Endpoints

### `GET /api/health`

Liveness check. No authentication.

**Example request**

```http
GET /api/health HTTP/1.1
Host: localhost:3000
```

**Example response** — `200 OK`

```json
{ "status": "ok" }
```

**Status codes**

| Status | When |
|---|---|
| 200 | Server is up |
| 400 | Invalid `delay` or `fail` value |
| 500 | `?fail=1` |

**curl**

```sh
curl -i http://localhost:3000/api/health
```
