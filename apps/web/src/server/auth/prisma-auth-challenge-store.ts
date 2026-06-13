import { prisma } from "@xolosarmy/db";
import type {
  TonalliAuthChallenge,
  TonalliAuthChallengeRecord,
  TonalliAuthPurpose,
  TonalliAuthVersion,
  TonalliNetwork,
  TonalliNonceStore,
} from "@xolosarmy/tonalli-auth";

type PrismaAuthChallenge = NonNullable<
  Awaited<ReturnType<typeof prisma.authChallenge.findUnique>>
>;

function mapPurpose(value: string): TonalliAuthPurpose {
  if (value === "authentication") {
    return value;
  }

  throw new Error(`Unsupported auth challenge purpose: ${value}`);
}

function mapNetwork(value: string): TonalliNetwork {
  if (value === "eCash") {
    return value;
  }

  throw new Error(`Unsupported auth challenge network: ${value}`);
}

function mapVersion(value: string): TonalliAuthVersion {
  if (value === "TonalliAuth-v1") {
    return value;
  }

  throw new Error(`Unsupported auth challenge version: ${value}`);
}

function mapAuthChallenge(
  challenge: PrismaAuthChallenge,
): TonalliAuthChallengeRecord {
  return {
    domain: challenge.domain,
    address: challenge.address,
    alias: challenge.alias ?? undefined,
    nonce: challenge.nonce,
    issuedAt: challenge.issuedAt.toISOString(),
    expirationTime: challenge.expiresAt.toISOString(),
    purpose: mapPurpose(challenge.purpose),
    network: mapNetwork(challenge.network),
    version: mapVersion(challenge.version),
    usedAt: challenge.usedAt?.toISOString() ?? null,
    revokedAt: challenge.revokedAt?.toISOString() ?? null,
  };
}

export class PrismaAuthChallengeStore implements TonalliNonceStore {
  async create(challenge: TonalliAuthChallenge): Promise<void> {
    await prisma.authChallenge.create({
      data: {
        nonce: challenge.nonce,
        domain: challenge.domain,
        address: challenge.address,
        alias: challenge.alias,
        purpose: challenge.purpose,
        network: challenge.network,
        version: challenge.version,
        issuedAt: new Date(challenge.issuedAt),
        expiresAt: new Date(challenge.expirationTime),
        usedAt: null,
        revokedAt: null,
      },
    });
  }

  async findByNonce(
    nonce: string,
  ): Promise<TonalliAuthChallengeRecord | null> {
    const challenge = await prisma.authChallenge.findUnique({
      where: { nonce },
    });

    if (challenge === null) {
      return null;
    }

    return mapAuthChallenge(challenge);
  }

  async markUsed(nonce: string): Promise<void> {
    await prisma.authChallenge.update({
      where: { nonce },
      data: { usedAt: new Date() },
    });
  }

  async revoke(nonce: string): Promise<void> {
    await prisma.authChallenge.update({
      where: { nonce },
      data: { revokedAt: new Date() },
    });
  }
}
