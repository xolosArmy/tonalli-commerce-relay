import { createHash } from "node:crypto";

import {
  createAuthChallenge,
  formatChallengeForSigning,
} from "@xolosarmy/tonalli-auth";

const DOMAIN = "localhost:3000";
const DEFAULT_ISSUED_AT = "2026-06-13T00:00:00.000Z";
const DEFAULT_EXPIRES_IN_MINUTES = 10;

interface CliOptions {
  address: string;
  alias?: string;
  nonce?: string;
  issuedAt: string;
  expiresInMinutes: number;
}

function printUsage(): void {
  console.error(`Usage:
  pnpm auth:fixture-message -- <ecash-address> [--alias <alias>] [--nonce <nonce>] [--issued-at <iso-date>] [--expires-in-minutes <minutes>]

Examples:
  pnpm auth:fixture-message -- ecash:q... --alias xolo
  pnpm auth:fixture-message -- ecash:q... --nonce tonalli-auth-fixture-001`);
}

function readRequiredValue(
  args: string[],
  index: number,
  optionName: string,
): string {
  const value = args[index + 1];

  if (value === undefined || value.startsWith("--")) {
    throw new Error(`Missing value for ${optionName}`);
  }

  return value;
}

function parseCliArgs(args: string[]): CliOptions {
  let address: string | undefined;
  let alias: string | undefined;
  let nonce: string | undefined;
  let issuedAt = DEFAULT_ISSUED_AT;
  let expiresInMinutes = DEFAULT_EXPIRES_IN_MINUTES;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--") {
      continue;
    }

    if (arg === "--alias") {
      alias = readRequiredValue(args, index, arg);
      index += 1;
      continue;
    }

    if (arg === "--nonce") {
      nonce = readRequiredValue(args, index, arg);
      index += 1;
      continue;
    }

    if (arg === "--issued-at") {
      issuedAt = readRequiredValue(args, index, arg);
      index += 1;
      continue;
    }

    if (arg === "--expires-in-minutes") {
      const rawValue = readRequiredValue(args, index, arg);
      expiresInMinutes = Number.parseInt(rawValue, 10);
      index += 1;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    }

    if (arg.startsWith("--")) {
      throw new Error(`Unknown option: ${arg}`);
    }

    if (address !== undefined) {
      throw new Error(`Unexpected extra positional argument: ${arg}`);
    }

    address = arg;
  }

  if (address === undefined) {
    throw new Error("Missing required eCash address argument");
  }

  if (Number.isNaN(expiresInMinutes) || expiresInMinutes <= 0) {
    throw new Error("--expires-in-minutes must be a positive integer");
  }

  if (Number.isNaN(Date.parse(issuedAt))) {
    throw new Error("--issued-at must be a valid ISO date string");
  }

  return {
    address,
    alias,
    nonce,
    issuedAt,
    expiresInMinutes,
  };
}

function createDeterministicNonce(options: {
  address: string;
  alias?: string;
  issuedAt: string;
}): string {
  const input = [
    "TonalliAuth-v1",
    DOMAIN,
    options.address,
    options.alias ?? "",
    options.issuedAt,
  ].join("|");
  const digest = createHash("sha256").update(input).digest("hex").slice(0, 24);

  return `tonalli-auth-fixture-${digest}`;
}

function main(): void {
  const options = parseCliArgs(process.argv.slice(2));
  const nonce =
    options.nonce ??
    createDeterministicNonce({
      address: options.address,
      alias: options.alias,
      issuedAt: options.issuedAt,
    });

  const challenge = createAuthChallenge({
    domain: DOMAIN,
    address: options.address,
    alias: options.alias,
    nonce,
    now: new Date(options.issuedAt),
    expiresInMinutes: options.expiresInMinutes,
  });
  const message = formatChallengeForSigning(challenge);
  const fixtureTemplate = {
    address: options.address,
    message,
    signature: "PEGAR_FIRMA_REAL_AQUI",
  };

  console.log("TonalliAuth-v1 challenge JSON:");
  console.log(JSON.stringify(challenge, null, 2));
  console.log("");
  console.log("Exact message to sign with Tonalli Wallet:");
  console.log("-----BEGIN TONALLI AUTH MESSAGE-----");
  console.log(message);
  console.log("-----END TONALLI AUTH MESSAGE-----");
  console.log("");
  console.log("Instructions:");
  console.log("1. Open Tonalli Wallet with the address above.");
  console.log("2. Sign the exact message between the BEGIN/END markers.");
  console.log("3. Copy the wallet signature without changing the message text.");
  console.log("4. Paste the signature into the fixture template below.");
  console.log("");
  console.log("Fixture JSON template:");
  console.log(JSON.stringify(fixtureTemplate, null, 2));
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown error";

  console.error(`Error: ${message}`);
  printUsage();
  process.exit(1);
}
