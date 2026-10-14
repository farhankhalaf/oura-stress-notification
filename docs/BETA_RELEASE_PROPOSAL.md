# Beta release proposal: 0.2.2

Historical plan for the beta release, starting from commit `6b139d9`.
See [RELEASE_CHECKLIST.md](../RELEASE_CHECKLIST.md) and the [release](https://github.com/farhankhalaf/push-notifications-for-oura-ring-stress/releases/tag/v0.2.2)
for validation results and the published revision.

## Goal

Make the existing Telegram tool easier to understand and distribute as an early
beta. Keep the human README short and put detailed setup and update guidance in
AGENTS.md. Retain the accepted iPhone demonstration.

## Documentation changes

- Put a compact supported-ring, membership, Telegram and awake-computer requirement
  at the bottom of the README, linking to SETUP.md.
- Keep the copyable setup prompt on one line and explicitly direct the agent to
  AGENTS.md. Use that exact prompt in the fresh-user acceptance test.
- Explain the silent initial baseline, missing-data behavior, normal daily alerts,
  and catch-up alerts when reinstalling an established installation.
- Remove the unmeasured delivery-delay estimate. Alerts follow syncing and can
  describe earlier physiological stress.
- For updates, recover the interpreter and data folder from the scheduled command,
  run install from the updated checkout, and verify the installed version or hash.
  Use console Python for interactive Windows commands. Extract ZIP updates into a
  new folder. Source-only updates leave intentionally disabled checks off.
- Document main as the ordinary install channel and release tags as fixed snapshots.

## First-run behavior

A new installation's first successful check with valid daily stress data records
its current total without sending a stress alert. A measured zero counts; missing
or invalid API data does not. Subsequent increases use the existing threshold and
message rules. This initialization happens once, not every day.

The state file stores `baseline_initialized` under the existing lock and atomic
writer. When the key is present, only literal boolean true means initialized.
When absent, a canonical YYYY-MM-DD date and a nonnegative integer baseline
(excluding booleans) preserve legacy behavior. Legacy installations that never
received data retain their previous first-alert behavior as well.

The successful check writes the prior initialization state OR whether valid data
arrived. Missing data, failures, pauses, timeouts and reconnects must never reset
an established baseline. New no-data checks explicitly persist false, preventing
their date/zero bookkeeping from looking like legacy state. Lost or corrupt state
starts again with a silent baseline.

Setup's explanation is conditional, and its state lock is released before the
installation subprocess starts. The success outcome remains `ok`. The explicit
Telegram test message stays unchanged. A positive initial baseline means the
first later alert uses the added-minutes message; a zero daily baseline uses the
short headline pictured in the demo.

## Regression coverage

Cover positive and zero initial readings, missing data across midnight, failures
before initialization, threshold accumulation from the seed, later-day resets,
legacy zero and positive baselines, failed-delivery retries, reinstallation,
strict marker/date validation, reconnect/error preservation, and lock release.
Include established and legacy users receiving no morning data before a positive
reading, so the first daily alert cannot be accidentally suppressed.

The native Windows installation fixture supplies positive synthetic data and
rejects any Telegram HTTP call. Run both local Python versions and all seven
Linux/macOS/Windows CI targets before publishing the beta.

## Sharing assets

Create a 1280 x 640 repository preview under 1 MB from the existing avatar and safe
edited notification image. Commit a self-contained outlined SVG and its renderer.
Export the existing walkthrough as an H.264 MP4 with dark outer margins, yuv420p,
constant 15 fps, even dimensions, no audio and fast-start playback. Preserve the
4.67-second notification hold and leave the README GIF unchanged.

Document development-only dependencies, commands, font identities, provenance and
asset hashes in [DEMOS.md](DEMOS.md). Include the PNG and MP4 in the repository and
release downloads, and verify the configured GitHub social preview.

## Publication and evidence

The sequence is proposal deep review, implementation and local checks, final light
review, commit and push, CI follow-up, then the v0.2.2 prerelease on the green SHA.
Release notes record the final commit, CI result, review outcomes and any fixes
made after review. The GitHub source archive is the installation snapshot; no
separate application package or additional runtime dependency is introduced.

Live evidence must remain dated and versioned. The new baseline behavior has only
automated coverage. Fresh-user setup, natural automatic phone delivery, a transient
banner, macOS logout/login, access revocation, live Linux scheduling and any live
Windows account setup remain unverified. A beta publication does not complete
those acceptance tests.

## Review outcome

Opus 5.5 reviewed the proposal twice at requested max effort and standard speed,
scoring 86 then 88 and reaching the round limit rather than convergence. The final
findings were addressed through explicit state-preservation tests, source-checkout
update guidance, installed-version verification, qualified evidence, and outlined
artwork. One final implementation light review at requested xhigh and standard
speed scored 91 with no blocking findings. Its documentation corrections were
applied afterward; the reviewed code and assets were unchanged.
