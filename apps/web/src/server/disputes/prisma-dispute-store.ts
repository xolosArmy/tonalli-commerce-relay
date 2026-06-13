import { prisma, type Prisma } from "@xolosarmy/db";

import type {
  AddDisputeEventInput,
  CreateDisputeInput,
  DisputeEventPayload,
  DisputeEventRecord,
  DisputeRecord,
  DisputeStore,
  UpdateDisputePatch,
} from "./dispute-store";

type PrismaDispute = Prisma.DisputeGetPayload<Record<string, never>>;
type PrismaDisputeEvent = Prisma.DisputeEventGetPayload<Record<string, never>>;

export class PrismaDisputeStore implements DisputeStore {
  async createDispute(input: CreateDisputeInput): Promise<DisputeRecord> {
    const createdDispute = await prisma.dispute.create({
      data: {
        orderId: input.orderId,
        status: input.status,
        openedByUserId: input.openedByUserId,
        reason: input.reason,
        openedAt: new Date(input.openedAt),
        resolvedByUserId: input.resolvedByUserId,
        resolution: input.resolution,
        authority: input.authority,
        resolvedAt:
          input.resolvedAt === undefined ? undefined : new Date(input.resolvedAt),
        events: {
          create: {
            type: "dispute_opened",
            actorUserId: input.openedByUserId,
            payload: toInputJson({
              orderId: input.orderId,
              reason: input.reason,
              status: input.status,
            }),
          },
        },
      },
    });

    return toDisputeRecord(createdDispute);
  }

  async findByOrderId(orderId: string): Promise<DisputeRecord | null> {
    const dispute = await prisma.dispute.findUnique({
      where: { orderId },
    });

    return dispute === null ? null : toDisputeRecord(dispute);
  }

  async updateDispute(
    id: string,
    patch: UpdateDisputePatch,
  ): Promise<DisputeRecord | null> {
    const existingDispute = await prisma.dispute.findUnique({
      where: { id },
      select: { id: true },
    });

    if (existingDispute === null) {
      return null;
    }

    const updatedDispute = await prisma.dispute.update({
      where: { id },
      data: toDisputeUpdateData(patch),
    });

    return toDisputeRecord(updatedDispute);
  }

  async addEvent(input: AddDisputeEventInput): Promise<DisputeEventRecord> {
    const createdEvent = await prisma.disputeEvent.create({
      data: {
        disputeId: input.disputeId,
        type: input.type,
        actorUserId: input.actorUserId,
        payload:
          input.payload === undefined ? undefined : toInputJson(input.payload),
      },
    });

    return toDisputeEventRecord(createdEvent);
  }

  async listEvents(disputeId: string): Promise<DisputeEventRecord[]> {
    const events = await prisma.disputeEvent.findMany({
      where: { disputeId },
      orderBy: { createdAt: "asc" },
    });

    return events.map(toDisputeEventRecord);
  }
}

function toDisputeUpdateData(
  patch: UpdateDisputePatch,
): Prisma.DisputeUpdateInput {
  const data: Prisma.DisputeUpdateInput = {};

  if (patch.status !== undefined) {
    data.status = patch.status;
  }

  if (patch.reason !== undefined) {
    data.reason = patch.reason;
  }

  if (patch.resolvedByUserId !== undefined) {
    data.resolvedByUserId = patch.resolvedByUserId;
  }

  if (patch.resolution !== undefined) {
    data.resolution = patch.resolution;
  }

  if (patch.authority !== undefined) {
    data.authority = patch.authority;
  }

  if (patch.resolvedAt !== undefined) {
    data.resolvedAt = new Date(patch.resolvedAt);
  }

  return data;
}

function toDisputeRecord(dispute: PrismaDispute): DisputeRecord {
  return {
    id: dispute.id,
    orderId: dispute.orderId,
    status: dispute.status,
    openedByUserId: dispute.openedByUserId,
    reason: dispute.reason,
    openedAt: dispute.openedAt.toISOString(),
    resolvedByUserId: dispute.resolvedByUserId ?? undefined,
    resolution: dispute.resolution ?? undefined,
    authority: dispute.authority ?? undefined,
    resolvedAt: dispute.resolvedAt?.toISOString(),
    createdAt: dispute.createdAt.toISOString(),
    updatedAt: dispute.updatedAt.toISOString(),
  };
}

function toDisputeEventRecord(event: PrismaDisputeEvent): DisputeEventRecord {
  return {
    id: event.id,
    disputeId: event.disputeId,
    type: event.type,
    actorUserId: event.actorUserId ?? undefined,
    payload:
      event.payload === null ? undefined : toDisputeEventPayload(event.payload),
    createdAt: event.createdAt.toISOString(),
  };
}

function toInputJson(value: DisputeEventPayload): Prisma.InputJsonValue {
  const json = JSON.parse(JSON.stringify(value)) as unknown;

  if (!isInputJsonValue(json)) {
    throw new Error("Value must be JSON serializable");
  }

  return json;
}

function toDisputeEventPayload(value: Prisma.JsonValue): DisputeEventPayload {
  if (!isJsonObject(value)) {
    throw new Error("DisputeEvent.payload must be a JSON object");
  }

  return value;
}

function isJsonObject(value: Prisma.JsonValue): value is Prisma.JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isInputJsonValue(value: unknown): value is Prisma.InputJsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isInputJsonValue);
  }

  if (typeof value === "object") {
    return Object.values(value).every(isInputJsonValue);
  }

  return false;
}
