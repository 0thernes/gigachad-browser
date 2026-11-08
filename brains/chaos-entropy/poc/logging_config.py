"""Structured JSON logger for the Chaos Entropy Art Engine.

Emits one JSON object per line to stderr (and optionally to a log file).
Schema defined in docs/OBSERVABILITY.md.

Usage:
    from poc.logging_config import get_logger, emit_run_manifest
    log = get_logger(__name__)
    log.info("run_start", seed_start="0x0000000000000000", seed_count=1000, ...)
    emit_run_manifest(log, seed_start=0, seed_count=1000, ...)
"""
from __future__ import annotations

import json
import logging
import os
import sys
import time
from datetime import datetime, timezone
from typing import Any


ENGINE_VERSION = "ceae-poc/0.1.0"  # kept in sync with glyph_engine.ENGINE_VERSION


class _JsonFormatter(logging.Formatter):
    """Format a LogRecord as a single-line JSON object per the CEAE schema."""

    def format(self, record: logging.LogRecord) -> str:  # noqa: A003
        payload: dict[str, Any] = {
            "ts": datetime.now(tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z",
            "level": record.levelname,
            "engine": ENGINE_VERSION,
            "pid": record.process,
        }
        # The first positional arg is the event name; extra kwargs are fields.
        if isinstance(record.msg, str):
            payload["event"] = record.msg
        else:
            payload["event"] = str(record.msg)

        # Merge any extra fields supplied via logger.info(event, extra={...})
        # or via the keyword-style helper below.
        for key, value in record.__dict__.items():
            if key not in _LOGGING_RESERVED and not key.startswith("_"):
                payload[key] = value

        return json.dumps(payload, ensure_ascii=False, default=str)


_LOGGING_RESERVED = frozenset({
    "name", "msg", "args", "levelname", "levelno", "pathname", "filename",
    "module", "exc_info", "exc_text", "stack_info", "lineno", "funcName",
    "created", "msecs", "relativeCreated", "thread", "threadName",
    "processName", "process", "message", "taskName",
})


def get_logger(name: str = "ceae") -> logging.Logger:
    """Return a logger that emits JSON to stderr.

    The log level is controlled by the ``CEAE_LOG_LEVEL`` environment variable
    (default: INFO).  Set to ``DEBUG`` for per-image profiling output.
    """
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger  # already configured in this process

    level_name = os.environ.get("CEAE_LOG_LEVEL", "INFO").upper()
    level = getattr(logging, level_name, logging.INFO)
    logger.setLevel(level)

    handler = logging.StreamHandler(sys.stderr)
    handler.setFormatter(_JsonFormatter())
    logger.addHandler(handler)
    logger.propagate = False
    return logger


def emit_run_manifest(
    logger: logging.Logger,
    *,
    seed_start: int,
    seed_count: int,
    canvas_px: int,
    duration_s: float,
    mode: str,
    out_dir: str | None = None,
    avg_png_kib: float | None = None,
    space_hash: str = "sha256:pending",
) -> None:
    """Emit the run-manifest structured event.

    This is the primary accountability record for every render run.
    Seeds are the dataset identity — log the seed range, not pixel paths.
    See docs/OBSERVABILITY.md for the full field schema.
    """
    seed_end = (seed_start + seed_count) & 0xFFFFFFFF_FFFFFFFF
    imgs_per_sec = seed_count / duration_s if duration_s > 0 else 0.0

    extra: dict[str, Any] = {
        "seed_start": f"0x{seed_start:016x}",
        "seed_count": seed_count,
        "seed_end_exclusive": f"0x{seed_end:016x}",
        "canvas_px": canvas_px,
        "duration_s": round(duration_s, 3),
        "imgs_per_sec": round(imgs_per_sec, 1),
        "mode": mode,
        "out_dir": out_dir,
        "space_hash": space_hash,
    }
    if avg_png_kib is not None:
        extra["avg_png_kib"] = round(avg_png_kib, 1)

    # Use LogRecord extra mechanism to inject fields into the JSON formatter.
    logger.info("run_manifest", extra=extra)
