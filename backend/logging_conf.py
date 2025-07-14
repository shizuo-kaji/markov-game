# logging_conf.py
import logging, time
from pathlib import Path
from logging.handlers import RotatingFileHandler
from pythonjsonlogger import jsonlogger

LOG_DIR = Path(__file__).resolve().parent / "logs"  # backend/logs
LOG_DIR.mkdir(parents=True, exist_ok=True)

def _build_handler(path: Path) -> RotatingFileHandler:
    h = RotatingFileHandler(path, maxBytes=5_000_000, backupCount=3, encoding="utf-8")
    h.setFormatter(jsonlogger.JsonFormatter())
    return h

_logger_cache: dict[str, logging.Logger] = {}

def get_room_logger(room_id: str) -> logging.Logger:
    """Return a per-room logger, creating it (once) if needed."""
    if room_id not in _logger_cache:
        logger = logging.getLogger(f"room.{room_id}")
        logger.setLevel(logging.INFO)
        logger.addHandler(_build_handler(LOG_DIR / f"room_{room_id}.jsonl"))
        logger.propagate = False               # keep output exactly once
        _logger_cache[room_id] = logger
    return _logger_cache[room_id]
