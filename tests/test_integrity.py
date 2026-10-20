import pytest

from app.integrity import calculate_sha256, verify_sha256


def test_calculate_sha256_known_value():
    assert calculate_sha256(b"abc") == (
        "ba7816bf8f01cfea414140de5dae2223"
        "b00361a396177a9cb410ff61f20015ad"
    )


def test_verify_correct_sha256():
    content = b"EYE evidence integrity test"
    digest = calculate_sha256(content)

    assert verify_sha256(content, digest)


def test_verify_is_case_insensitive():
    content = b"example"
    digest = calculate_sha256(content)

    assert verify_sha256(content, digest.upper())


def test_verify_rejects_tampered_content():
    content = b"original evidence"
    digest = calculate_sha256(content)

    assert not verify_sha256(b"modified evidence", digest)


@pytest.mark.parametrize("invalid_digest", [
    "",
    "not-a-hash",
    "a" * 63,
    "g" * 64,
])
def test_verify_rejects_invalid_digest(invalid_digest):
    assert not verify_sha256(b"content", invalid_digest)


def test_calculate_rejects_non_bytes():
    with pytest.raises(TypeError):
        calculate_sha256("text")  # type: ignore[arg-type]
