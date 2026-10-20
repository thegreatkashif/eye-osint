"""SHA-256 helpers for EYE evidence integrity."""

import hashlib
import hmac


def calculate_sha256(content: bytes) -> str:
    """Return the lowercase SHA-256 digest of exact content bytes."""
    if not isinstance(content, bytes):
        raise TypeError("content must be bytes")
    return hashlib.sha256(content).hexdigest()


def verify_sha256(content: bytes, expected_sha256: str) -> bool:
    """Check whether exact content bytes match a SHA-256 digest."""
    if not isinstance(expected_sha256, str):
        return False

    if len(expected_sha256) != 64:
        return False

    try:
        int(expected_sha256, 16)
    except ValueError:
        return False

    actual = calculate_sha256(content)
    return hmac.compare_digest(actual, expected_sha256.lower())
