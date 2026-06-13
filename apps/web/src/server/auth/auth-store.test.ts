import { beforeEach, describe, expect, it } from "vitest";

import { getAuthChallengeStore } from "./auth-store";
import { InMemoryTonalliNonceStore } from "./nonce-store";

describe("getAuthChallengeStore", () => {
  beforeEach(() => {
    delete process.env.TONALLI_AUTH_STORE;
  });

  it("uses the in-memory store by default", async () => {
    const store = await getAuthChallengeStore();

    expect(store).toBeInstanceOf(InMemoryTonalliNonceStore);
  });

  it("uses the in-memory store when TONALLI_AUTH_STORE is memory", async () => {
    process.env.TONALLI_AUTH_STORE = "memory";

    const store = await getAuthChallengeStore();

    expect(store).toBeInstanceOf(InMemoryTonalliNonceStore);
  });

  it("returns a singleton in-memory store", async () => {
    const firstStore = await getAuthChallengeStore();
    const secondStore = await getAuthChallengeStore();

    expect(secondStore).toBe(firstStore);
  });

  it("rejects unsupported store values", async () => {
    process.env.TONALLI_AUTH_STORE = "redis";

    await expect(getAuthChallengeStore()).rejects.toThrow(
      "Unsupported TONALLI_AUTH_STORE value: redis",
    );
  });
});
