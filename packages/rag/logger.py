"""
Structured logging for Cloud Logging compatibility
"""

import logging
import json
from datetime import datetime
from typing import Any, Dict, Optional


class StructuredLogger:
    """JSON structured logging for Google Cloud Logging"""

    def __init__(self, name: str, level: int = logging.INFO):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(level)

        # Only add handler if none exists
        if not self.logger.handlers:
            handler = logging.StreamHandler()
            handler.setFormatter(logging.Formatter("%(message)s"))
            self.logger.addHandler(handler)

    def _log(self, severity: str, message: str, **kwargs: Any) -> None:
        """Create structured log entry"""
        log_entry: Dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "severity": severity.upper(),
            "message": message,
        }

        # Add additional fields
        for key, value in kwargs.items():
            # Convert non-serializable objects
            if isinstance(value, Exception):
                log_entry[key] = {
                    "error_type": type(value).__name__,
                    "error_message": str(value),
                }
            else:
                log_entry[key] = value

        # Output as JSON
        self.logger.log(
            self._severity_to_level(severity), json.dumps(log_entry, default=str)
        )

    def _severity_to_level(self, severity: str) -> int:
        """Convert severity string to logging level"""
        severity_map = {
            "DEBUG": logging.DEBUG,
            "INFO": logging.INFO,
            "WARNING": logging.WARNING,
            "ERROR": logging.ERROR,
            "CRITICAL": logging.CRITICAL,
        }
        return severity_map.get(severity.upper(), logging.INFO)

    def debug(self, message: str, **kwargs: Any) -> None:
        """Log debug message"""
        self._log("DEBUG", message, **kwargs)

    def info(self, message: str, **kwargs: Any) -> None:
        """Log info message"""
        self._log("INFO", message, **kwargs)

    def warning(self, message: str, **kwargs: Any) -> None:
        """Log warning message"""
        self._log("WARNING", message, **kwargs)

    def error(self, message: str, **kwargs: Any) -> None:
        """Log error message"""
        self._log("ERROR", message, **kwargs)

    def critical(self, message: str, **kwargs: Any) -> None:
        """Log critical message"""
        self._log("CRITICAL", message, **kwargs)


# Global logger instance
logger = StructuredLogger("cropsense-rag")

