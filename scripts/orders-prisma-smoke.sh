#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
BUYER_USER_ID="dev_buyer_orders_prisma"
BUYER_ADDRESS="ecash:qdevbuyerordersprismaplaceholder000000000"
BUYER_PUBLIC_KEY="dev-buyer-orders-prisma-public-key-placeholder"
BUYER_ALIAS="devordersbuyer.xec"

if ! command -v jq >/dev/null 2>&1; then
  echo "Error: jq is required to run this script. Install jq and try again." >&2
  exit 1
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "Error: DATABASE_URL is required." >&2
  exit 1
fi

post_json() {
  local path="$1"
  local payload="$2"

  curl --fail-with-body --silent --show-error \
    -X POST "${BASE_URL}${path}" \
    -H "Content-Type: application/json" \
    -d "$payload"
}

get_json() {
  local path="$1"

  curl --fail-with-body --silent --show-error "${BASE_URL}${path}"
}

assert_jq() {
  local response="$1"
  local filter="$2"
  local message="$3"

  if ! jq -e "$filter" >/dev/null <<<"$response"; then
    echo "Error: ${message}" >&2
    echo "$response" | jq . >&2
    exit 1
  fi
}

quote_response="$(
  post_json "/api/quote" '{
    "amount": 100,
    "currency": "MXN",
    "intermediaryFeePercent": 5,
    "platformFeePercent": 1,
    "networkFeeReserveXec": 100
  }'
)"
assert_jq "$quote_response" '.quote.totalFiat.amount == 106 and .quote.totalXec.amount == 318100' "quote response did not include expected totals"
quote_json="$(jq -c '.quote' <<<"$quote_response")"

order_response="$(
  post_json "/api/orders" "$(jq -n \
    --arg buyerUserId "$BUYER_USER_ID" \
    --arg buyerAddress "$BUYER_ADDRESS" \
    --arg buyerAlias "$BUYER_ALIAS" \
    --argjson quote "$quote_json" \
    '{
      buyerUserId: $buyerUserId,
      buyerAddress: $buyerAddress,
      buyerAlias: $buyerAlias,
      product: {
        provider: "amazon_mx",
        productUrl: "https://example.invalid/dev-orders-prisma-product",
        title: "Dev orders Prisma placeholder product",
        quantity: 1,
        notes: "Prisma orders smoke test placeholder"
      },
      quote: $quote
    }'
  )"
)"
assert_jq "$order_response" '.order.id | type == "string" and length > 0' "order response did not include order.id"
assert_jq "$order_response" '.order.status == "WAITING_DEPOSIT"' "order was not created with WAITING_DEPOSIT status"
order_id="$(jq -r '.order.id' <<<"$order_response")"

get_order_response="$(get_json "/api/orders/${order_id}")"
returned_order_id="$(jq -r '.order.id' <<<"$get_order_response")"
if [[ "$returned_order_id" != "$order_id" ]]; then
  echo "Error: GET /api/orders/:id did not return the created order" >&2
  echo "$get_order_response" | jq . >&2
  exit 1
fi
assert_jq "$get_order_response" '.order.status == "WAITING_DEPOSIT"' "created order did not persist with WAITING_DEPOSIT status"

fund_response="$(
  post_json "/api/orders/${order_id}/fund" "$(jq -n \
    --arg buyerUserId "$BUYER_USER_ID" \
    --arg buyerAddress "$BUYER_ADDRESS" \
    --arg buyerPublicKey "$BUYER_PUBLIC_KEY" \
    '{
      buyer: {
        userId: $buyerUserId,
        address: $buyerAddress,
        publicKey: $buyerPublicKey
      },
      simulatedDepositTxid: "dev-orders-prisma-simulated-deposit-txid"
    }'
  )"
)"
funded_order_id="$(jq -r '.order.id' <<<"$fund_response")"
if [[ "$funded_order_id" != "$order_id" ]]; then
  echo "Error: funded response did not return the created order" >&2
  echo "$fund_response" | jq . >&2
  exit 1
fi
assert_jq "$fund_response" '.order.status == "FUNDED"' "order was not funded"

funded_order_response="$(get_json "/api/orders/${order_id}")"
returned_funded_order_id="$(jq -r '.order.id' <<<"$funded_order_response")"
if [[ "$returned_funded_order_id" != "$order_id" ]]; then
  echo "Error: GET /api/orders/:id did not return the funded order" >&2
  echo "$funded_order_response" | jq . >&2
  exit 1
fi
assert_jq "$funded_order_response" '.order.status == "FUNDED"' "GET /api/orders/:id did not return FUNDED order"

orders_response="$(get_json "/api/orders")"
if ! jq -e --arg orderId "$order_id" '.orders | any(.id == $orderId)' >/dev/null <<<"$orders_response"; then
  echo "Error: GET /api/orders did not include the created order" >&2
  echo "$orders_response" | jq . >&2
  exit 1
fi

echo "Prisma orders smoke test completed successfully"
