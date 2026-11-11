# AluSathi Security Review

**Reviewed:** 31 August 2026

**Scope:** active React farmer flow, FastAPI image endpoint and offline queue

## Controls verified

| Area | Control |
| --- | --- |
| Upload size | Server reads at most 8 MB plus one byte and rejects larger files |
| Upload type | JPEG, PNG and WebP allowlist; SVG is rejected |
| File content | Pillow decodes and verifies the image instead of trusting MIME type |
| Image bounds | Shortest side must be at least 128 px; longest side no more than 8,000 px |
| Decompression safety | Malformed files and Pillow decompression-bomb errors fail closed |
| Abuse control | Per-client request limit and two concurrent inference slots |
| Error handling | Generic server error response; no stack trace returned to farmers |
| Response headers | CSP, HSTS, frame denial, no-sniff, no-referrer and no-store |
| Privacy | Uploaded images are processed in memory and are not added to training data |
| Offline privacy | Pending images stay in local IndexedDB until successful synchronization |
| Model safety | Field-validation lock hides disease names and confidence by default |
| Advice safety | No pesticide product or dosage is generated; expert confirmation is required |

## Automated evidence

- Spoofed JPEG content returns HTTP 400.
- SVG MIME type returns HTTP 415.
- A valid image returns `unknown` while field validation is false.
- Model and policy unit suite passes.
- Production dependency audit on 10 November 2026: 6 remaining findings (2 low, 4 moderate, 0 high) after upgrading Zod and its form resolver. npm reports that remaining fixes require breaking dependency changes.

## Marketplace follow-up (10 November 2026)

- The live project migration history does not list the marketplace migration. On 10 November 2026 a read-only database query found neither public.market_lots nor public.market_respond_offer(uuid,text,integer,jsonb). This does not establish the status of every other marketplace object.
- The original migration grants broad authenticated table writes and leaves security-definer RPCs exposed to PostgreSQL's default PUBLIC execute privilege. Its authorization and offer state transitions require further work.
- A forward migration is prepared and tested against an isolated local Supabase database. It restricts lot writes, and enables the hardened offer and response RPCs for authenticated users. Collection, payment and disagreement RPCs remain disabled pending their own authorization and transition tests. Nothing has been applied to the live database.
- Marketplace template and listing validation review is incomplete. Do not treat the marketplace as security-audited.
- The server now retains rotated refresh tokens, validates listing photo origins and dates, and maps known PostgreSQL concurrency conflicts to HTTP 409. Focused unit tests pass; only the offer authorization cases in tests/marketplace-auth.sql have been checked against the isolated database.
- A mocked strict token-rotation test demonstrates that simultaneous marketplace requests can race; the test is marked expected failure. Against isolated local Supabase, two simultaneous refreshes succeeded and returned the same rotated token. Application-level response ordering, multi-worker behavior, and the live provider have not been tested.
- The live project dashboard displayed Healthy when rechecked on 10 November 2026. This does not establish the cause of its earlier Unhealthy status.

## Residual risks

- The in-memory per-client rate-limit table is suitable for a single demo process, not a distributed public service.
- Production deployment still needs a trusted reverse proxy, HTTPS termination, centralized rate limiting, request logging without image contents, uptime monitoring and an incident process.
- IndexedDB is device-local, not encrypted application storage. Farmers should use a device they control.
- The three-class model cannot prove that an upload contains a potato leaf; the field-validation lock currently contains this risk.

## Release decision

Suitable for a controlled competition demo. Not approved for unsupervised public field diagnosis.
