import type { DisputeStore } from "./dispute-store";
import { disputeStore } from "./dispute-store";

let prismaDisputeStore: DisputeStore | undefined;

async function getPrismaDisputeStore(): Promise<DisputeStore> {
  if (prismaDisputeStore === undefined) {
    const { PrismaDisputeStore } = await import("./prisma-dispute-store");
    prismaDisputeStore = new PrismaDisputeStore();
  }

  return prismaDisputeStore;
}

export async function getDisputeStore(): Promise<DisputeStore> {
  const store = process.env.TONALLI_DISPUTE_STORE;

  if (store === undefined || store === "" || store === "memory") {
    return disputeStore;
  }

  if (store === "prisma") {
    return getPrismaDisputeStore();
  }

  throw new Error(`Unsupported TONALLI_DISPUTE_STORE value: ${store}`);
}
