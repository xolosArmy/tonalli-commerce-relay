-- CreateTable
CREATE TABLE "reputation_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "alias" TEXT,
    "address" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "completed_orders" INTEGER NOT NULL,
    "completed_eligible_orders" INTEGER NOT NULL,
    "total_volume_xec" DECIMAL(65,30) NOT NULL,
    "total_volume_fiat_mxn" DECIMAL(65,30) NOT NULL,
    "open_disputes" INTEGER NOT NULL,
    "won_disputes" INTEGER NOT NULL,
    "lost_disputes" INTEGER NOT NULL,
    "max_order_fiat_mxn" DECIMAL(65,30) NOT NULL,
    "max_daily_fiat_mxn" DECIMAL(65,30) NOT NULL,
    "is_frozen" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reputation_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reputation_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "order_id" TEXT,
    "volume_xec" DECIMAL(65,30),
    "volume_fiat_mxn" DECIMAL(65,30),
    "reason" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reputation_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reputation_profiles_user_id_key" ON "reputation_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "reputation_profiles_alias_key" ON "reputation_profiles"("alias");

-- CreateIndex
CREATE INDEX "reputation_profiles_score_idx" ON "reputation_profiles"("score");

-- CreateIndex
CREATE INDEX "reputation_profiles_level_idx" ON "reputation_profiles"("level");

-- CreateIndex
CREATE INDEX "reputation_events_user_id_idx" ON "reputation_events"("user_id");

-- CreateIndex
CREATE INDEX "reputation_events_type_idx" ON "reputation_events"("type");

-- CreateIndex
CREATE INDEX "reputation_events_occurred_at_idx" ON "reputation_events"("occurred_at");

-- AddForeignKey
ALTER TABLE "reputation_profiles" ADD CONSTRAINT "reputation_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
