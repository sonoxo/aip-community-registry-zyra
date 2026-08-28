#!/usr/bin/env python3
"""Public/declassified CIA Reading Room 2026 corpus ingester.

Enumerates the exact user-supplied ds_created filter, downloads each public
PDF attachment, computes SHA-256, extracts text with pdftotext, falls back to
OCR for image-only PDFs, and writes a machine-verifiable manifest.

This does not infer redacted material and does not claim government affiliation.
"""
from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import shutil
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urljoin
from urllib.request import Request, build_opener, HTTPRedirectHandler

BASE = "https://www.cia.gov"
FILTER = "ds_created:[2026-01-01T00:00:00Z TO 2027-01-01T00:00:00Z]"
SEARCH = f"{BASE}/readingroom/search/site/?f%5B0%5D={quote(FILTER, safe='')}"
UA = "GPT-GlassOnion-Public-Archive/0.4 (+https://github.com/sonoxo/aip-community-registry-zyra)"
DOC_RE = re.compile(r'href=["\']([^"\']*/readingroom/document/[^"\'#?]+)["\']', re.I)
PDF_RE = re.compile(r'href=["\']([^"\']+\.pdf(?:\?[^"\']*)?)["\']', re.I)
TITLE_RE = re.compile(r'<h1[^>]*>(.*?)</h1>', re.I | re.S)
TAG_RE = re.compile(r'<[^>]+>')

class LimitedRedirect(HTTPRedirectHandler):
    max_redirections = 12

opener = build_opener(LimitedRedirect)

def fetch(url: str, *, binary: bool = False, timeout: int = 60, attempts: int = 4):
    last = None
    for i in range(attempts):
        try:
            req = Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
            with opener.open(req, timeout=timeout) as r:
                data = r.read()
                return (data if binary else data.decode("utf-8", "replace")), r.geturl(), dict(r.headers)
        except (HTTPError, URLError, TimeoutError, OSError) as e:
            last = e
            time.sleep(min(8, 2 ** i))
    raise RuntimeError(f"fetch failed after {attempts} attempts: {url}: {last}")

def with_page(url: str, page: int) -> str:
    # Preserve the exact percent-encoding in the CIA filter. Re-parsing and
    # urlencode() converts %20 to '+', which the Reading Room currently
    # canonicalizes in a 302 loop.
    sep = "&" if "?" in url else "?"
    return f"{url}{sep}page={page}"

def clean_text(s: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(TAG_RE.sub(" ", s))).strip()

def enumerate_documents(max_pages: int = 10000) -> tuple[list[str], list[dict]]:
    docs, seen = [], set()
    pages = []
    empty_streak = 0
    for page in range(max_pages):
        url = with_page(SEARCH, page)
        try:
            body, final_url, _ = fetch(url)
        except Exception as e:
            legacy = url.replace("https://www.cia.gov", "https://foia.cia.gov", 1)
            try:
                body, final_url, _ = fetch(legacy)
            except Exception as e2:
                pages.append({"page": page, "url": url, "status": "error", "error": f"{e}; fallback={e2}"})
                if page == 0:
                    raise
                break
        found = []
        for href in DOC_RE.findall(body):
            d = urljoin(BASE, html.unescape(href))
            d = d.split("#", 1)[0].split("?", 1)[0]
            if d not in seen:
                seen.add(d); docs.append(d); found.append(d)
        pages.append({"page": page, "url": final_url, "status": "ok", "new_documents": len(found)})
        empty_streak = empty_streak + 1 if not found else 0
        if empty_streak >= 2:
            break
        time.sleep(0.35)
    return docs, pages

def pdf_to_text(pdf: Path, out_txt: Path, ocr_dir: Path) -> tuple[str, str | None]:
    out_txt.parent.mkdir(parents=True, exist_ok=True)
    if shutil.which("pdftotext"):
        p = subprocess.run(["pdftotext", "-layout", str(pdf), str(out_txt)], capture_output=True, text=True)
        if p.returncode == 0 and out_txt.exists() and len(out_txt.read_text("utf-8", errors="ignore").strip()) >= 80:
            return "pdftotext", None
    if shutil.which("pdftoppm") and shutil.which("tesseract"):
        ocr_dir.mkdir(parents=True, exist_ok=True)
        prefix = ocr_dir / "page"
        p = subprocess.run(["pdftoppm", "-jpeg", "-r", "150", str(pdf), str(prefix)], capture_output=True, text=True)
        if p.returncode != 0:
            return "failed", p.stderr[-1000:]
        chunks = []
        for img in sorted(ocr_dir.glob("page-*.jpg")):
            t = subprocess.run(["tesseract", str(img), "stdout", "-l", "eng"], capture_output=True, text=True)
            if t.returncode == 0:
                chunks.append(t.stdout)
        out_txt.write_text("\n\n".join(chunks), encoding="utf-8")
        if out_txt.stat().st_size:
            return "tesseract", None
        return "failed", "OCR produced no text"
    return "failed", "pdftotext/tesseract unavailable"

def ingest_document(url: str, work: Path, keep_pdfs: bool) -> dict:
    rec = {"document_url": url, "discovered": True, "downloaded": False, "scanned": False, "indexed": False,
           "retrieved_at": datetime.now(timezone.utc).isoformat(), "classification_scope": "PUBLIC/DECLASSIFIED", "errors": []}
    try:
        body, final_url, _ = fetch(url)
        rec["document_url"] = final_url
        m = TITLE_RE.search(body)
        rec["title"] = clean_text(m.group(1)) if m else final_url.rsplit("/", 1)[-1]
        pdfs = []
        for href in PDF_RE.findall(body):
            purl = urljoin(BASE, html.unescape(href))
            if purl not in pdfs: pdfs.append(purl)
        rec["attachments"] = []
        if not pdfs:
            rec["errors"].append("no_pdf_attachment_found")
            text = clean_text(body)
            slug = re.sub(r"[^A-Za-z0-9._-]+", "_", final_url.rsplit("/",1)[-1])
            tpath = work / "text" / f"{slug}.txt"
            tpath.parent.mkdir(parents=True, exist_ok=True)
            tpath.write_text(text, encoding="utf-8")
            rec["indexed"] = len(text) > 100
            rec["scanned"] = rec["indexed"]
            rec["downloaded"] = rec["indexed"]
            return rec
        for idx, purl in enumerate(pdfs, 1):
            a = {"url": purl, "downloaded": False, "scanned": False, "indexed": False}
            try:
                data, final_pdf, headers = fetch(purl, binary=True, timeout=120)
                a["url"] = final_pdf
                a["bytes"] = len(data)
                a["sha256"] = hashlib.sha256(data).hexdigest()
                a["content_type"] = headers.get("Content-Type")
                a["downloaded"] = True
                slug = re.sub(r"[^A-Za-z0-9._-]+", "_", final_url.rsplit("/", 1)[-1])
                pdf_path = work / "pdfs" / f"{slug}-{idx}.pdf"
                pdf_path.parent.mkdir(parents=True, exist_ok=True)
                pdf_path.write_bytes(data)
                txt_path = work / "text" / f"{slug}-{idx}.txt"
                method, err = pdf_to_text(pdf_path, txt_path, work / "ocr" / f"{slug}-{idx}")
                a["scan_method"] = method
                if err: a["error"] = err
                a["scanned"] = method != "failed"
                if txt_path.exists():
                    txt = txt_path.read_text("utf-8", errors="ignore")
                    a["text_bytes"] = len(txt.encode("utf-8"))
                    a["indexed"] = bool(txt.strip())
                if not keep_pdfs:
                    pdf_path.unlink(missing_ok=True)
                shutil.rmtree(work / "ocr" / f"{slug}-{idx}", ignore_errors=True)
            except Exception as e:
                a["error"] = str(e)
            rec["attachments"].append(a)
        rec["downloaded"] = all(a["downloaded"] for a in rec["attachments"])
        rec["scanned"] = all(a["scanned"] for a in rec["attachments"])
        rec["indexed"] = all(a["indexed"] for a in rec["attachments"])
    except Exception as e:
        rec["errors"].append(str(e))
    return rec

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="GPT-GlassOnion/intel/cia-reading-room-2026/generated")
    ap.add_argument("--keep-pdfs", action="store_true")
    ap.add_argument("--max-docs", type=int, default=0, help="0 = exhaustive")
    args = ap.parse_args()
    out = Path(args.out); work = out / "work"; out.mkdir(parents=True, exist_ok=True)
    started = datetime.now(timezone.utc).isoformat()
    docs, pages = enumerate_documents()
    if args.max_docs: docs = docs[:args.max_docs]
    records = []
    for n, url in enumerate(docs, 1):
        print(f"[{n}/{len(docs)}] {url}", flush=True)
        records.append(ingest_document(url, work, args.keep_pdfs)); time.sleep(0.35)
    counts = {"discovered": len(records),
              "downloaded": sum(bool(r.get("downloaded")) for r in records),
              "scanned": sum(bool(r.get("scanned")) for r in records),
              "indexed": sum(bool(r.get("indexed")) for r in records),
              "errors": sum(bool(r.get("errors")) or any(a.get("error") for a in r.get("attachments", [])) for r in records)}
    complete = bool(records) and counts["discovered"] == counts["downloaded"] == counts["scanned"] == counts["indexed"] and counts["errors"] == 0
    manifest = {"schema_version": "1.0", "source": SEARCH, "filter": FILTER, "started_at": started,
                "completed_at": datetime.now(timezone.utc).isoformat(), "enumeration_pages": pages,
                "counts": counts, "complete": complete, "records": records}
    (out / "manifest.json").write_text(json.dumps(manifest, indent=2, sort_keys=True), encoding="utf-8")
    (out / "STATUS.md").write_text("# CIA Reading Room 2026 ingestion status\n\n"
        f"- Discovered: **{counts['discovered']}**\n- Downloaded: **{counts['downloaded']}**\n"
        f"- Scanned: **{counts['scanned']}**\n- Indexed: **{counts['indexed']}**\n"
        f"- Records with errors: **{counts['errors']}**\n- Complete: **{'YES' if complete else 'NO'}**\n", encoding="utf-8")
    print(json.dumps({"counts": counts, "complete": complete}, indent=2))
    return 0 if complete else 2

if __name__ == "__main__":
    raise SystemExit(main())
