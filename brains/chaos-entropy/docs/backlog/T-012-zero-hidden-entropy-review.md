# T-012 — External code review: zero-hidden-entropy audit

**Column:** Ready | **Priority:** High | **Estimate:** S (< 1 day)

## Context

The PoC ROADMAP.md Phase 0 acceptance criterion states: "Zero hidden entropy:
independent code review confirms all variation flows from the seed (self-review
done; external pass pending)."

The determinism guarantee is the core product value. A third party reviewing
`poc/glyph_engine.py` for hidden entropy sources provides a meaningful
confidence signal before publishing manifests or inviting design partners to
validate digests.

Sources of hidden entropy to check:
1. Any `random` / `numpy.random` call that does not use the seeded RNG.
2. `time()`, `datetime.now()`, process PID in any render-path code.
3. Font discovery ordering: `discover_fonts()` returns a list; if the OS returns
   fonts in a non-deterministic order on different machines, seed→glyph mapping
   would differ across platforms. (Currently uses a frozen candidate list, so
   ordering is deterministic — but this must be confirmed.)
4. `os.urandom` or `secrets` anywhere in the render path.
5. Dict or set iteration order leaking into render decisions.
6. Any conditional logic that varies on environment outside the seed.

## Acceptance Criteria

- [ ] A reviewer other than the original author has read `poc/glyph_engine.py`
      in full with the above checklist in mind.
- [ ] Review findings documented in a PR or `docs/adr/` note.
- [ ] All identified hidden-entropy risks are either confirmed absent or fixed
      with a corresponding test.
- [ ] The Phase 0 acceptance criterion checkbox in `docs/ROADMAP.md` is ticked.

## Definition of Done

- `docs/ROADMAP.md` Phase 0 criterion "Zero hidden entropy" marked `[x]`.
- Any fixes to `poc/glyph_engine.py` landed and CI green.

## Estimate

S — the file is ~180 lines; a focused review is a few hours. Fixing any
discovered issues may extend the estimate.

## Dependencies

None.
