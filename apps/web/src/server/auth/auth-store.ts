import type { TonalliNonceStore } from "@xolosarmy/tonalli-auth";

import { nonceStore } from "./nonce-store";

let prismaStore: TonalliNonceStore | undefined;

async function getPrismaStore(): Promise<TonalliNonceStore> {
  if (prismaStore === undefined) {
    const { PrismaAuthChallengeStore } = await import(
      "./prisma-auth-challenge-store"
    );
    prismaStore = new PrismaAuthChallengeStore();
  }

  return prismaStore;
}

export async function getAuthChallengeStore(): Promise<TonalliNonceStore> {
  const store = process.env.TONALLI_AUTH_STORE;

  if (store === undefined || store === "" || store === "memory") {
    return nonceStore;
  }

  if (store === "prisma") {
    return getPrismaStore();
  }

  throw new Error(`Unsupported TONALLI_AUTH_STORE value: ${store}`);
}
