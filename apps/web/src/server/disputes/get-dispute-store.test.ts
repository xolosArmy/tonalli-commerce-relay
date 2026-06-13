import { beforeEach, describe, expect, it, vi } from "vitest";

import { getDisputeStore } from "./get-dispute-store";
import { MemoryDisputeStore } from "./dispute-store";

vi.mock("./prisma-dispute-store", () => ({
  PrismaDisputeStore: class PrismaDisputeStore {},
}));

describe("getDisputeStore", () => {
  beforeEach(() => {
    delete process.env.TONALLI_DISPUTE_STORE;
  });

  it("uses the in-memory store by default", async () => {
    const store = await getDisputeStore();

    expect(store).toBeInstanceOf(MemoryDisputeStore);
  });

  it("uses the in-memory store when TONALLI_DISPUTE_STORE is memory", async () => {
    process.env.TONALLI_DISPUTE_STORE = "memory";

    const store = await getDisputeStore();

    expect(store).toBeInstanceOf(MemoryDisputeStore);
  });

  it("returns a singleton in-memory store", async () => {
    const firstStore = await getDisputeStore();
    const secondStore = await getDisputeStore();

    expect(secondStore).toBe(firstStore);
  });

  it("uses the Prisma store when TONALLI_DISPUTE_STORE is prisma", async () => {
    process.env.TONALLI_DISPUTE_STORE = "prisma";

    const store = await getDisputeStore();

    expect(store.constructor.name).toBe("PrismaDisputeStore");
  });

  it("returns a singleton Prisma store", async () => {
    process.env.TONALLI_DISPUTE_STORE = "prisma";

    const firstStore = await getDisputeStore();
    const secondStore = await getDisputeStore();

    expect(secondStore).toBe(firstStore);
  });

  it("rejects unsupported store values", async () => {
    process.env.TONALLI_DISPUTE_STORE = "redis";

    await expect(getDisputeStore()).rejects.toThrow(
      "Unsupported TONALLI_DISPUTE_STORE value: redis",
    );
  });
});
