# TruthChain X API Reference

## Auth

Provide one of:

- `x-api-key`
- `Authorization: Bearer <jwt>`

## Endpoints

### POST `/api/verify-content`

Verifies one content item and returns a full trust fingerprint payload.

### GET `/api/trust-score/{id}`

Returns the stored trust fingerprint for a content hash.

### GET `/api/creator-reputation/{id}`

Returns a creator reputation profile and recent content history.

### POST `/api/bulk-verify`

Batch verification for up to 10 items. Requires `pro` or higher.

### GET `/api/analytics/report`

Enterprise analytics report. Requires `enterprise`.
