import { reputationStore } from "./reputation-store";
import type { ReputationStore } from "./reputation-store";

let prismaReputationStore: ReputationStore | undefined;

async function getPrismaStore(): Promise<ReputationStore> {
  if (prismaReputationStore === undefined) {
    const { PrismaReputationStore } = await import("./prisma-reputation-store");
    prismaReputationStore = new PrismaReputationStore();
  }
  return prismaReputationStore;
}

export async function getReputationStore(): Promise<ReputationStore> {
  const store = process.env.TONALLI_REPUTATION_STORE;

  if (store === undefined || store === "" || store === "memory") {
    return reputationStore;
  }

  if (store === "prisma") {
    return await getPrismaStore();
  }

  throw new Error(`Unsupported TONALLI_REPUTATION_STORE value: ${store}`);
}
