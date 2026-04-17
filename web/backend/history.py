"""History persistence — one JSON file per analysis result."""

import json
import time
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/api/history", tags=["history"])

HISTORY_DIR = Path(__file__).parent / "history"
HISTORY_DIR.mkdir(exist_ok=True)


def _index_path() -> Path:
    return HISTORY_DIR / "_index.json"


def _read_index() -> list[dict]:
    p = _index_path()
    if not p.exists():
        return []
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return []


def _write_index(entries: list[dict]):
    _index_path().write_text(
        json.dumps(entries, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def _entry_path(entry_id: str) -> Path:
    safe = entry_id.replace("/", "_").replace("..", "_")
    return HISTORY_DIR / f"{safe}.json"


def save_result(result: dict) -> dict:
    """Save an analysis result and return the index entry."""
    ticker = result.get("ticker", "UNKNOWN")
    date = result.get("date", "")
    entry_id = f"{ticker}-{date}-{int(time.time() * 1000)}"

    entry = {
        "id": entry_id,
        "ticker": ticker,
        "date": date,
        "decision": result.get("decision", ""),
        "timestamp": int(time.time() * 1000),
    }

    # Write full data
    _entry_path(entry_id).write_text(
        json.dumps(result, ensure_ascii=False, default=str),
        encoding="utf-8",
    )

    # Update index
    index = _read_index()
    index.insert(0, entry)
    _write_index(index)

    return entry


@router.get("")
async def list_history():
    """Return index (id, ticker, date, decision, timestamp) — no heavy data."""
    return _read_index()


@router.get("/{entry_id:path}")
async def get_history_entry(entry_id: str):
    """Return full analysis data for one entry."""
    p = _entry_path(entry_id)
    if not p.exists():
        raise HTTPException(404, "Entry not found")
    return JSONResponse(
        content=json.loads(p.read_text(encoding="utf-8")),
        media_type="application/json",
    )


@router.delete("/{entry_id:path}")
async def delete_history_entry(entry_id: str):
    """Delete one entry."""
    p = _entry_path(entry_id)
    if p.exists():
        p.unlink()
    index = _read_index()
    _write_index([e for e in index if e["id"] != entry_id])
    return {"ok": True}


@router.delete("")
async def clear_history():
    """Delete all entries."""
    for f in HISTORY_DIR.glob("*.json"):
        f.unlink()
    _write_index([])
    return {"ok": True}
