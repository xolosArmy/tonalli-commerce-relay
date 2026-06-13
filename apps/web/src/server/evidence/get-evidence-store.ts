import type { EvidenceStore } from "./evidence-store";
import { evidenceStore } from "./evidence-store";

let prismaEvidenceStore: EvidenceStore | undefined;

async function getPrismaEvidenceStore(): Promise<EvidenceStore> {
  if (prismaEvidenceStore === undefined) {
    const { PrismaEvidenceStore } = await import("./prisma-evidence-store");
    prismaEvidenceStore = new PrismaEvidenceStore();
  }

  return prismaEvidenceStore;
}

export async function getEvidenceStore(): Promise<EvidenceStore> {
  const store = process.env.TONALLI_EVIDENCE_STORE;

  if (store === undefined || store === "" || store === "memory") {
    return evidenceStore;
  }

  if (store === "prisma") {
    return getPrismaEvidenceStore();
  }

  throw new Error(`Unsupported TONALLI_EVIDENCE_STORE value: ${store}`);
}
