# Tonalli Commerce Relay

Tonalli Commerce Relay is a sovereign commerce layer for eCash that allows users to buy goods and services from stores that do not yet accept XEC.

It uses:

- XEC as money
- Tonalli Wallet as identity
- Aliases as the social layer
- RMZ reputation as trust
- XEC escrow as settlement guarantee

> Where XEC is not accepted, Tonalli buys for you.

## Development API

### Create auth challenge

POST `/api/auth/challenge`

### Verify auth challenge

POST `/api/auth/verify`

### Create commerce quote

POST `/api/quote`

```sh
curl -X POST http://localhost:3000/api/quote \
  -H "Content-Type: application/json" \
  -d '{"amount":100,"currency":"MXN","intermediaryFeePercent":5,"platformFeePercent":1,"networkFeeReserveXec":100}'
```
