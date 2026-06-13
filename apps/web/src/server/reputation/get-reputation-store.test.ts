import { beforeEach, describe, expect, it, vi } from "vitest";
import { getReputationStore } from "./get-reputation-store";
import { MemoryReputationStore } from "./reputation-store";

vi.mock("./prisma-reputation-store", () => ({
  PrismaReputationStore: class PrismaReputationStore {},
}));

describe("getReputationStore", () => {
  beforeEach(() => {
    delete process.env.TONALLI_REPUTATION_STORE;
  });

  it("uses the memory store by default", async () => {
    const store = await getReputationStore();
    expect(store).toBeInstanceOf(MemoryReputationStore);
  });

  it("uses the prisma store when env is set", async () => {
    process.env.TONALLI_REPUTATION_STORE = "prisma";
    const store = await getReputationStore();
    expect(store.constructor.name).toBe("PrismaReputationStore");
  });

  it("rejects unsupported store values", async () => {
    process.env.TONALLI_REPUTATION_STORE = "dynamo";
    await expect(getReputationStore()).rejects.toThrow(
      "Unsupported TONALLI_REPUTATION_STORE value: dynamo"
    );
  });
});
