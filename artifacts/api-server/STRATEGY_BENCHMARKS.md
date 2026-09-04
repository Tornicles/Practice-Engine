# Strategy benchmark release history

`pnpm --filter @workspace/api-server run strategy:quality-gate` runs the deterministic
strategy benchmark, enforces the unchanged minimum score of 95 and maximum regression of
2, and prints the current result against every committed release fixture.

## Release fixtures

`benchmark-baselines/release-history.json` is ordered from oldest to newest. Each listed
fixture is a committed CI artifact containing aggregate and per-scenario scores, boolean
quality dimensions, and review metadata. The newest fixture is the fail-closed gate
baseline; all fixtures are retained so reviewers can inspect trends across releases.

To intentionally update a baseline, add (never rewrite) a fixture, append it to the
history, and set `approval.type` to `intentional-baseline-update`. Include the prior
release ID, a specific rationale, and the non-personal review identity and timestamp.
The parser rejects fixtures without these audit fields or whose data-handling declaration
does not explicitly state that coach data and credentials are absent.

Fixtures contain deterministic synthetic scenario IDs, scores, dimensions, and release
review metadata only. Do not add raw prompts, coach profile/experience data, generated
coach content, tokens, or credentials.