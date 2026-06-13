import { beforeEach, describe, expect, it, vi } from "vitest";

import { getEvidenceStore } from "./get-evidence-store";
import { MemoryEvidenceStore } from "./evidence-store";

vi.mock("./prisma-evidence-store", () => ({
  PrismaEvidenceStore: class PrismaEvidenceStore {},
}));

describe("getEvidenceStore", () => {
  beforeEach(() => {
    delete process.env.TONALLI_EVIDENCE_STORE;
  });

  it("uses the in-memory store by default", async () => {
    const store = await getEvidenceStore();

    expect(store).toBeInstanceOf(MemoryEvidenceStore);
  });

  it("uses the in-memory store when TONALLI_EVIDENCE_STORE is memory", async () => {
    process.env.TONALLI_EVIDENCE_STORE = "memory";

    const store = await getEvidenceStore();

    expect(store).toBeInstanceOf(MemoryEvidenceStore);
  });

  it("returns a singleton in-memory store", async () => {
    const firstStore = await getEvidenceStore();
    const secondStore = await getEvidenceStore();

    expect(secondStore).toBe(firstStore);
  });

  it("uses the Prisma store when TONALLI_EVIDENCE_STORE is prisma", async () => {
    process.env.TONALLI_EVIDENCE_STORE = "prisma";

    const store = await getEvidenceStore();

    expect(store.constructor.name).toBe("PrismaEvidenceStore");
  });

  it("returns a singleton Prisma store", async () => {
    process.env.TONALLI_EVIDENCE_STORE = "prisma";

    const firstStore = await getEvidenceStore();
    const secondStore = await getEvidenceStore();

    expect(secondStore).toBe(firstStore);
  });

  it("rejects unsupported store values", async () => {
    process.env.TONALLI_EVIDENCE_STORE = "redis";

    await expect(getEvidenceStore()).rejects.toThrow(
      "Unsupported TONALLI_EVIDENCE_STORE value: redis",
    );
  });
});
