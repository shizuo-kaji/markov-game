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

        # Console handler for real-time visibility
        console_handler = logging.StreamHandler()
        console_formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
        console_handler.setFormatter(console_formatter)
        logger.addHandler(console_handler)

        # File handler for persistent room logs (info and above)
        info_file = LOG_DIR / f"room_{room_id}.log"
        info_handler = RotatingFileHandler(info_file, maxBytes=5_000_000, backupCount=3, encoding="utf-8")
        info_formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
        info_handler.setFormatter(info_formatter)
        info_handler.setLevel(logging.INFO)
        logger.addHandler(info_handler)

        # File handler for persistent room error logs (errors only)
        error_file = LOG_DIR / f"room_{room_id}_error.log"
        error_handler = RotatingFileHandler(error_file, maxBytes=5_000_000, backupCount=3, encoding="utf-8")
        error_formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
        error_handler.setFormatter(error_formatter)
        error_handler.setLevel(logging.ERROR)
        logger.addHandler(error_handler)

        # JSON handler for structured logging
        logger.addHandler(_build_handler(LOG_DIR / f"room_{room_id}.jsonl"))
        logger.propagate = False               # keep output exactly once
        _logger_cache[room_id] = logger
    return _logger_cache[room_id]
