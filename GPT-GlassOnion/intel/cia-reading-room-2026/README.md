# CIA Reading Room 2026 — GPT-GlassOnion ingestion

Target source (public/declassified only):

`https://www.cia.gov/readingroom/search/site/?f%5B0%5D=ds_created%3A%5B2026-01-01T00%3A00%3A00Z%20TO%202027-01-01T00%3A00%3A00Z%5D`

## Completion contract

This corpus MUST NOT be labeled complete until all of the following are true:

1. The source result set has been exhaustively enumerated.
2. Every public attachment has been retrieved or has a documented permanent source-side error.
3. Every retrieved file has a SHA-256 digest.
4. Every PDF has text extraction attempted with `pdftotext`.
5. Image-only PDFs use Tesseract OCR fallback.
6. Every record has source URL and retrieval timestamp.
7. `manifest.json` reports identical `discovered`, `downloaded`, `scanned`, and `indexed` counts with zero errors.
8. `manifest.json.complete` is `true`.

## Current source-access condition

On 2026-08-28, GitHub-hosted runners received an origin-edge `Access Denied` response for the legacy CIA Reading Room routes. The response is delivered as HTTP 302 to `/readingroom`; `/readingroom` itself returns the same redirect/access-denied condition. This affects the filtered search, tested document pages, and tested `/readingroom/docs/*.pdf` URLs from the runner.

Therefore the pipeline intentionally records **BLOCKED_BY_ORIGIN_EDGE** rather than inventing a document count or marking the corpus complete.

## Pipeline

`CIA public source → enumerate → download → SHA-256 → text extraction → OCR fallback → provenance manifest → GlassOnion ontology/index`

Run via `.github/workflows/cia-reading-room-2026-ingest.yml`.

## Governance

- Public/declassified material only.
- No inference from redactions.
- No claim of CIA, NGA, DoD, Palantir, or other government affiliation.
- Do not bypass source access controls. Use a CIA-supported public endpoint, supplied public archive/export, or separately indexed public copy when available; provenance must identify the retrieval path.
