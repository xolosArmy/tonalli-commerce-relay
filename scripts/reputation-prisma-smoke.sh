#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
RUN_ID="${RANDOM}_$(date +%s)"
BUYER_USER_ID="dev_buyer_rep_${RUN_ID}"
INTERMEDIARY_USER_ID="dev_intermediary_rep_${RUN_ID}"
BUYER_ADDRESS="ecash:qrep${RUN_ID}"
INTERMEDIARY_ADDRESS="ecash:qrepint${RUN_ID}"
DEMO_TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")"

if ! command -v jq >/dev/null 2>&1; then
  echo "Error: jq is required to run this script." >&2
  exit 1
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "Error: DATABASE_URL is required." >&2
  exit 1
fi

post_json() {
  local path="$1"
  local payload="$2"
  local response
  local status
  local body
  local separator=$'\n'

  response="$(curl --silent --show-error -X POST "${BASE_URL}${path}" -H "Content-Type: application/json" -d "${payload}" -w "${separator}%{http_code}")" || {
    echo "POST ${path} failed before receiving an HTTP response." >&2
    return 1
  }

  status="${response##*${separator}}"
  body="${response%${separator}${status}}"

  if [[ "${status}" -lt 200 || "${status}" -ge 300 ]]; then
    echo "POST ${path} failed with HTTP ${status}." >&2
    echo "${body}" >&2
    return 1
  fi

  printf '%s' "${body}"
}

echo "1. Creating eligible order..."
quote_json='{"productCostFiat":{"amount":300,"currency":"MXN"},"intermediaryFeeFiat":{"amount":15,"currency":"MXN"},"platformFeeFiat":{"amount":3,"currency":"MXN"},"networkFeeReserveXec":{"amount":100,"currency":"XEC"},"totalFiat":{"amount":318,"currency":"MXN"},"totalXec":{"amount":954100,"currency":"XEC"},"rate":{"fiatCurrency":"MXN","xecPerFiatUnit":3000,"source":"dev","quotedAt":"'${DEMO_TIMESTAMP}'","expiresAt":"'${DEMO_TIMESTAMP}'"}}'
order_res="$(post_json "/api/orders" "$(jq -n --arg b "$BUYER_USER_ID" --arg buyerAddress "$BUYER_ADDRESS" --argjson q "$quote_json" '{buyerUserId: $b, buyerAddress: $buyerAddress, product: {provider: "other", productUrl: "https://test", quantity: 1}, quote: $q}')")"
order_id="$(echo "$order_res" | jq -r '.order.id')"

echo "2. Funding order..."
post_json "/api/orders/${order_id}/fund" "$(jq -n --arg b "$BUYER_USER_ID" --arg buyerAddress "$BUYER_ADDRESS" '{buyer: {userId: $b, address: $buyerAddress}, simulatedDepositTxid: "txid1"}')" > /dev/null

echo "3. Accepting order (Initializes profile)..."
post_json "/api/orders/${order_id}/accept" "$(jq -n --arg i "$INTERMEDIARY_USER_ID" --arg intermediaryAddress "$INTERMEDIARY_ADDRESS" '{intermediary: {userId: $i, address: $intermediaryAddress}, reputationProfile: {userId: $i, address: $intermediaryAddress, level: "alias_verified", score: 50, completedOrders: 0, completedEligibleOrders: 0, totalVolumeXec: 0, totalVolumeFiatMxn: 0, openDisputes: 0, wonDisputes: 0, lostDisputes: 0, limits: {maxOrderFiatMxn: 1000, maxDailyFiatMxn: 2000}, isFrozen: false, updatedAt: "'${DEMO_TIMESTAMP}'"}, currentDailyVolumeFiatMxn: 0}')" > /dev/null

echo "4. Recording purchase evidence..."
post_json "/api/orders/${order_id}/purchase" "$(jq -n --arg i "$INTERMEDIARY_USER_ID" --arg purchasedAt "$DEMO_TIMESTAMP" '{intermediaryUserId: $i, evidence: {type: "receipt", uri: "https://example.invalid/reputation-smoke-receipt", hash: "sha256-reputation-smoke", notes: "Reputation Prisma smoke purchase evidence"}, externalOrderId: "REP-SMOKE-ORDER", purchasedAt: $purchasedAt}')" > /dev/null

echo "5. Requesting release..."
post_json "/api/orders/${order_id}/release-request" "$(jq -n --arg i "$INTERMEDIARY_USER_ID" --arg requestedAt "$DEMO_TIMESTAMP" '{intermediaryUserId: $i, message: "Reputation Prisma smoke release request", requestedAt: $requestedAt}')" > /dev/null

echo "6. Releasing order (Triggers reputation events)..."
post_json "/api/orders/${order_id}/release" "$(jq -n --arg b "$BUYER_USER_ID" --arg i "$INTERMEDIARY_USER_ID" --arg buyerAddress "$BUYER_ADDRESS" --arg intermediaryAddress "$INTERMEDIARY_ADDRESS" '{buyerUserId: $b, buyer: {userId: $b, address: $buyerAddress}, intermediary: {userId: $i, address: $intermediaryAddress}, simulatedReleaseTxid: "txid2", networkFeeXec: 10}')" > /dev/null

echo "7. Verifying Postgres DB persistence..."
pnpm --filter @xolosarmy/db exec node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const profile = await prisma.reputationProfile.findUnique({ where: { userId: '${INTERMEDIARY_USER_ID}' } });
  if (!profile) throw new Error('Reputation profile not persisted');
  if (profile.completedOrders !== 1) throw new Error('Reputation profile completedOrders not incremented');
  
  const events = await prisma.reputationEvent.findMany({ where: { userId: '${INTERMEDIARY_USER_ID}' } });
  if (events.length === 0) throw new Error('Reputation events not persisted');
  
  console.log('Prisma reputation smoke test completed successfully.');
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.\$disconnect());
"
