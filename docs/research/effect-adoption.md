# Effect adoption assessment

Reviewed 2026-10-01 against the current repository and official Effect v4 documentation. This is an assessment, not an adoption decision or a tested integration.

## Recommendation

Effect is technically compatible with this project. Broad adoption is not justified by the current workload. Keep the browser code and existing command interfaces as they are. Reconsider Effect for a future workflow with external services, retry policies, cancellation, or substantial concurrent work. A build-only Schema experiment is the most plausible smaller option if source validation becomes difficult to maintain.

## Verified library capabilities

- Effect documents both Bun and browser support, including optional platform packages for platform services. It can fit the current Bun scripts and Vite browser build without replacing either tool. That fit is an architectural inference, not a locally compiled integration. [Platform documentation](https://effect.website/docs/v4/platform/introduction)
- `Effect<Success, Error, Requirements>` records expected failures and required services in its type. These are modeled failures; introducing Effect does not automatically classify every exception. [Effect type](https://effect.website/docs/v4/getting-started/the-effect-type)
- `Effect.runPromise` bridges an Effect program to Promise-based callers. This allows adoption inside one module while retaining an existing async interface. At that boundary, a rejected Promise no longer exposes a typed error parameter to its caller. [Running effects](https://effect.website/docs/v4/getting-started/running-effects)
- Schema validates and transforms input data and derives types. Its documented requirements are TypeScript 5.9 or newer and strict mode. This repository has TypeScript 7 and strict mode enabled. [Schema introduction](https://effect.website/docs/v4/schema/introduction), [package.json](../../package.json), [tsconfig.json](../../tsconfig.json)
- Retries support schedules with backoff, jitter, and limits. Concurrent operators can limit the number of running tasks. Resource finalizers can run on success, failure, or interruption. These capabilities become useful when several such policies must work together. [Retries](https://effect.website/docs/v4/error-management/retrying), [Concurrency](https://effect.website/docs/v4/concurrency/basic-concurrency), [Resource management](https://effect.website/docs/v4/resource-management/introduction)
- The official `effect@4.0.0` release identifies v4 as stable and supersedes beta and release-candidate guidance. It also distinguishes APIs tagged unstable, which can change in minor releases. Packages share a version; the core has no runtime dependencies. Its release notes describe improved tree-shaking, but do not establish the bundle cost for this app. [Official release](https://github.com/Effect-TS/effect/releases/tag/effect@4.0.0)

## Fit with this repository

| Area | Current evidence | Assessment |
| --- | --- | --- |
| Browser behavior | Static site with direct DOM behavior; no `fetch` or Promise workflow found in `src/`. Dependencies are currently development tools. | Little immediate benefit from an Effect runtime. New concepts and shipped code would need a concrete payoff. |
| Portfolio Item Source Validation | Structured errors, input-shape checks, and domain rules already exist in [the validator](../../scripts/portfolio/portfolio-item-source-validator.ts). | Schema could reduce structural checks. Proof Point references, publication rules, uniqueness, and evidence constraints would still need explicit rules. Preserve existing error quality. |
| Portfolio Evidence Workflow | [The command](../../scripts/portfolio-generation-command.ts) reads local inputs, creates a validated output set, then writes files sequentially. | Typed I/O errors might help a larger command. Wrapping these writes in Effect would not make the output set transactional; staging and commit/recovery behavior would need separate design. |
| Site inventory | [Inventory code](../../scripts/site/site-inventory.ts) uses `Promise.all` for filesystem reads. | Bounded concurrency could help at larger scale, but no present bottleneck was measured. A small concurrency limiter is also an option. |
| Browser performance | [The performance guard](../../scripts/check-performance-budget.ts) limits total shipped JavaScript to 24 KiB gzipped. | Measure a real production-build delta before any browser adoption. Build-only imports can avoid a browser cost if they remain outside the browser dependency graph. |

## Conditions for a future experiment

Choose one actual problem, such as importing remote Portfolio Item data with retries and validation. Keep Effect inside that module and expose ordinary data or a Promise to callers. Compare code clarity, failure handling, and dependency cost with the existing approach. Preserve source-to-site generation and publication constraints.

For Schema alone, start with one build-time input shape and retain the validator's domain checks. Continue only if it removes enough duplicated validation to justify the dependency and learning cost.

No package was installed and no app code changed during this assessment. Integration compatibility, browser bundle impact, and runtime performance remain unmeasured.
