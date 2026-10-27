# Contracts and schema validation

> Snippets show the shape of a good setup, not a copy-paste source of truth. Option names and defaults drift between releases: when you are not sure an option exists in the installed version, check it (installed types, a type-check, or the page in `official-docs.md`) before relying on it, and name the page in the reply if you used one.

## Which kind of contract check

| Goal | Tool |
|---|---|
| Response shape of a third-party or undocumented API stays compatible | JSON Schema / OpenAPI components validated with AJV in the API tests |
| Your service matches its published OpenAPI | Generate types (`openapi-typescript`) and validate real responses against the spec (`jest-openapi`, `openapi-response-validator`, or AJV over dereferenced components); run in the provider's CI |
| Consumer and provider owned by different teams | Pact: consumer tests record interactions into a pact file, provider verifies against it; publish via Pact Broker/PactFlow with `can-i-deploy` gating |
| GraphQL | Validate operations against the schema at build time (`graphql-codegen`), test resolvers in-process, assert response against generated types |

## SchemaRegistry (AJV over YAML/JSON)

```ts
import Ajv, { type ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';

export class SchemaRegistry {
  private readonly ajv = new Ajv({ allErrors: true, strict: false });
  private readonly cache = new Map<string, ValidateFunction>();
  constructor(private readonly root = path.resolve(__dirname, '../../schemas')) { addFormats(this.ajv); }

  validate(name: string, data: unknown) {
    const check = this.validator(name);
    check(data);
    return check.errors ?? [];          // tests: expect(errors).toEqual([]) prints every violation
  }
  private validator(name: string) {
    let v = this.cache.get(name);
    if (!v) { v = this.ajv.compile(this.load(name)); this.cache.set(name, v); }
    return v;
  }
  private load(name: string) {
    for (const file of walk(this.root, /\.(ya?ml|json)$/i)) {
      const doc = file.endsWith('.json') ? JSON.parse(fs.readFileSync(file, 'utf8')) : yaml.load(fs.readFileSync(file, 'utf8'));
      const schema = doc?.components?.schemas?.[name] ?? doc?.definitions?.[name] ?? (doc?.title === name ? doc : undefined);
      if (schema) return schema;
    }
    throw new Error(`Unknown schema: ${name}`);
  }
}
```

Rules:

- `required` + `type` on every field you rely on; `format: email|uri|date-time` via `ajv-formats`; `minLength: 1` for tokens and messages.
- `additionalProperties: true` for APIs you do not own (they may add fields); `false` for your own contracts so accidental leaks (password hashes, internal ids) fail the test.
- One schema per response family, including errors; name them by family (`LoginSuccess`, `AuthError`, `UsersList`), not by endpoint.
- Keep `$ref` within one file or dereference with `@apidevtools/json-schema-ref-parser` before compiling.
- Validate the success path at least once per family and the error schema in each negative; do not validate on every single test, it hides the actual assertion.

```yaml
# schemas/auth/auth.yaml
openapi: 3.0.3
info: { title: Auth responses, version: 1.0.0 }
paths: {}
components:
  schemas:
    LoginSuccess:
      type: object
      additionalProperties: true
      required: [id, username, email, accessToken, refreshToken]
      properties:
        id: { type: integer }
        username: { type: string }
        email: { type: string, format: email }
        accessToken: { type: string, minLength: 1 }
        refreshToken: { type: string, minLength: 1 }
    AuthError:
      type: object
      required: [message]
      properties: { message: { type: string, minLength: 1 } }
```

## Pact in a sentence each

- Consumer test: use `PactV4` to describe the interaction (`given state`, `uponReceiving`, `withRequest`, `willRespondWith` with matchers like `like()`/`eachLike()`), run the consumer code against the mock server, write the pact file.
- Provider verification: `Verifier` replays the pact against the running provider with `stateHandlers` for provider states; run in provider CI; publish results.
- Broker: `pact-broker publish` from consumer CI, `can-i-deploy` before deploying either side. Matchers over exact values keep pacts stable.

## Type generation

`npx openapi-typescript ./openapi.yaml -o src/api/schema.d.ts` gives request/response types for the client; `openapi-fetch` yields a typed client when you own the spec. Fall back to hand-written `types.ts` derived from real responses when no spec exists, and record inconsistencies in the type comments.
