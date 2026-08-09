# Codex Q/A v2.0 — Hardening Notes

## Security Headers
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Content-Security-Policy: default-src 'self'

## Replay Protection
- Nonce verification
- Deterministic signature validation

## Rate Limiting
- 60 requests / minute / IP

## Input Sanitization
- HTML stripping
- Unicode normalization
- JSON schema validation

## API Boundary Guards
- Reject malformed payloads
- Reject unsigned payloads
- Reject replayed payloads
