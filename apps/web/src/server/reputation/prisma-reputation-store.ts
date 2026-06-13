import { prisma } from "@xolosarmy/db";
import type { ReputationLevel, ReputationProfile } from "@xolosarmy/models";
import type { ReputationEvent } from "@xolosarmy/reputation";
import type { ReputationStore } from "./reputation-store";

export class PrismaReputationStore implements ReputationStore {
  async getProfile(userId: string): Promise<ReputationProfile | null> {
    const record = await prisma.reputationProfile.findUnique({
      where: { userId },
    });

    if (!record) return null;

    return {
      userId: record.userId,
      alias: record.alias ?? undefined,
      address: record.address,
      level: record.level as ReputationLevel,
      score: record.score,
      completedOrders: record.completedOrders,
      completedEligibleOrders: record.completedEligibleOrders,
      totalVolumeXec: Number(record.totalVolumeXec),
      totalVolumeFiatMxn: Number(record.totalVolumeFiatMxn),
      openDisputes: record.openDisputes,
      wonDisputes: record.wonDisputes,
      lostDisputes: record.lostDisputes,
      limits: {
        maxOrderFiatMxn: Number(record.maxOrderFiatMxn),
        maxDailyFiatMxn: Number(record.maxDailyFiatMxn),
      },
      isFrozen: record.isFrozen,
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  async saveProfile(profile: ReputationProfile): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.user.upsert({
        where: { id: profile.userId },
        create: {
          id: profile.userId,
          address: profile.address,
          alias: profile.alias ?? null,
          role: "intermediary",
        },
        update: {
          address: profile.address,
          alias: profile.alias ?? null,
          role: "intermediary",
        },
      });

      await tx.reputationProfile.upsert({
        where: { userId: profile.userId },
        create: {
          userId: profile.userId,
          alias: profile.alias ?? null,
          address: profile.address,
          level: profile.level,
          score: profile.score,
          completedOrders: profile.completedOrders,
          completedEligibleOrders: profile.completedEligibleOrders,
          totalVolumeXec: profile.totalVolumeXec,
          totalVolumeFiatMxn: profile.totalVolumeFiatMxn,
          openDisputes: profile.openDisputes,
          wonDisputes: profile.wonDisputes,
          lostDisputes: profile.lostDisputes,
          maxOrderFiatMxn: profile.limits.maxOrderFiatMxn,
          maxDailyFiatMxn: profile.limits.maxDailyFiatMxn,
          isFrozen: profile.isFrozen,
        },
        update: {
          alias: profile.alias ?? null,
          address: profile.address,
          level: profile.level,
          score: profile.score,
          completedOrders: profile.completedOrders,
          completedEligibleOrders: profile.completedEligibleOrders,
          totalVolumeXec: profile.totalVolumeXec,
          totalVolumeFiatMxn: profile.totalVolumeFiatMxn,
          openDisputes: profile.openDisputes,
          wonDisputes: profile.wonDisputes,
          lostDisputes: profile.lostDisputes,
          maxOrderFiatMxn: profile.limits.maxOrderFiatMxn,
          maxDailyFiatMxn: profile.limits.maxDailyFiatMxn,
          isFrozen: profile.isFrozen,
          updatedAt: new Date(),
        },
      });
    });
  }

  async addEvent(event: ReputationEvent): Promise<void> {
    await prisma.reputationEvent.create({
      data: {
        userId: event.userId,
        type: event.type,
        orderId: event.orderId ?? null,
        volumeXec: event.volumeXec ?? null,
        volumeFiatMxn: event.volumeFiatMxn ?? null,
        reason: event.reason ?? null,
        occurredAt: new Date(event.occurredAt),
      },
    });
  }
}
