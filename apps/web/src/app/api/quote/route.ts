import {
  DEFAULT_NETWORK_FEE_RESERVE_XEC,
  StaticPricingRateProvider,
  createCommerceQuote,
} from "@xolosarmy/pricing";
import type { FiatCurrency } from "@xolosarmy/models";
import { NextResponse } from "next/server";

interface QuoteRequestBody {
  amount?: unknown;
  currency?: unknown;
  intermediaryFeePercent?: unknown;
  platformFeePercent?: unknown;
  networkFeeReserveXec?: unknown;
}

interface ValidQuoteRequest {
  amount: number;
  currency: FiatCurrency;
  intermediaryFeePercent: number;
  platformFeePercent: number;
  networkFeeReserveXec?: number;
}

interface InvalidQuoteRequest {
  reason: string;
}

type QuoteRequestValidation =
  | { valid: true; request: ValidQuoteRequest }
  | { valid: false; error: InvalidQuoteRequest };

const DEFAULT_INTERMEDIARY_FEE_PERCENT = 5;
const DEFAULT_PLATFORM_FEE_PERCENT = 1;

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch (error) {
    return invalidRequestResponse(errorReason(error, "Request body must be valid JSON"));
  }

  const validation = validateQuoteRequest(body);

  if (!validation.valid) {
    return invalidRequestResponse(validation.error.reason);
  }

  try {
    const quoteRequest = validation.request;
    const rateProvider = createDevRateProvider();
    const quote = await createCommerceQuote({
      input: {
        productCostFiat: {
          amount: quoteRequest.amount,
          currency: quoteRequest.currency,
        },
        intermediaryFeePercent: quoteRequest.intermediaryFeePercent,
        platformFeePercent: quoteRequest.platformFeePercent,
        networkFeeReserveXec:
          quoteRequest.networkFeeReserveXec === undefined
            ? undefined
            : {
                amount: quoteRequest.networkFeeReserveXec,
                currency: "XEC",
              },
      },
      rateProvider,
    });

    return NextResponse.json({ quote });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to create quote",
        reason: errorReason(error, "Unknown pricing error"),
      },
      { status: 500 },
    );
  }
}

function validateQuoteRequest(body: unknown): QuoteRequestValidation {
  if (!isObjectRecord(body)) {
    return invalidQuoteRequest("Request body must be a JSON object");
  }

  const requestBody = body as QuoteRequestBody;
  const amount = validateRequiredPositiveNumber(requestBody.amount, "amount");

  if (!amount.valid) {
    return invalidQuoteRequest(amount.reason);
  }

  const currency = validateCurrency(requestBody.currency);

  if (!currency.valid) {
    return invalidQuoteRequest(currency.reason);
  }

  const intermediaryFeePercent = validateOptionalNonNegativeNumber(
    requestBody.intermediaryFeePercent,
    "intermediaryFeePercent",
    DEFAULT_INTERMEDIARY_FEE_PERCENT,
  );

  if (!intermediaryFeePercent.valid) {
    return invalidQuoteRequest(intermediaryFeePercent.reason);
  }

  const platformFeePercent = validateOptionalNonNegativeNumber(
    requestBody.platformFeePercent,
    "platformFeePercent",
    DEFAULT_PLATFORM_FEE_PERCENT,
  );

  if (!platformFeePercent.valid) {
    return invalidQuoteRequest(platformFeePercent.reason);
  }

  const networkFeeReserveXec = validateOptionalNonNegativeNumber(
    requestBody.networkFeeReserveXec,
    "networkFeeReserveXec",
    DEFAULT_NETWORK_FEE_RESERVE_XEC.amount,
  );

  if (!networkFeeReserveXec.valid) {
    return invalidQuoteRequest(networkFeeReserveXec.reason);
  }

  return {
    valid: true,
    request: {
      amount: amount.value,
      currency: currency.value,
      intermediaryFeePercent: intermediaryFeePercent.value,
      platformFeePercent: platformFeePercent.value,
      networkFeeReserveXec:
        requestBody.networkFeeReserveXec === undefined
          ? undefined
          : networkFeeReserveXec.value,
    },
  };
}

function createDevRateProvider(): StaticPricingRateProvider {
  const fetchedAt = new Date().toISOString();

  return new StaticPricingRateProvider({
    MXN: {
      fiatCurrency: "MXN",
      xecPerFiatUnit: parseDevRate(process.env.DEV_XEC_PER_MXN ?? "3000", "DEV_XEC_PER_MXN"),
      source: "dev-static-env",
      fetchedAt,
    },
    USD: {
      fiatCurrency: "USD",
      xecPerFiatUnit: parseDevRate(process.env.DEV_XEC_PER_USD ?? "60000", "DEV_XEC_PER_USD"),
      source: "dev-static-env",
      fetchedAt,
    },
  });
}

function parseDevRate(value: string, envName: string): number {
  const rate = Number(value);

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error(`${envName} must be a number greater than 0`);
  }

  return rate;
}

function validateCurrency(
  value: unknown,
): { valid: true; value: FiatCurrency } | { valid: false; reason: string } {
  if (value === "MXN" || value === "USD") {
    return { valid: true, value };
  }

  return { valid: false, reason: 'currency must be "MXN" or "USD"' };
}

function validateRequiredPositiveNumber(
  value: unknown,
  fieldName: string,
): { valid: true; value: number } | { valid: false; reason: string } {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return { valid: false, reason: `${fieldName} must be a number greater than 0` };
  }

  return { valid: true, value };
}

function validateOptionalNonNegativeNumber(
  value: unknown,
  fieldName: string,
  defaultValue: number,
): { valid: true; value: number } | { valid: false; reason: string } {
  if (value === undefined) {
    return { valid: true, value: defaultValue };
  }

  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return {
      valid: false,
      reason: `${fieldName} must be a number greater than or equal to 0`,
    };
  }

  return { valid: true, value };
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function invalidQuoteRequest(reason: string): QuoteRequestValidation {
  return {
    valid: false,
    error: { reason },
  };
}

function invalidRequestResponse(reason: string) {
  return NextResponse.json(
    {
      error: "Invalid quote request",
      reason,
    },
    { status: 400 },
  );
}

function errorReason(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
