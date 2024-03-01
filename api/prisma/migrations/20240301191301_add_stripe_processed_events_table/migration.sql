-- CreateTable
CREATE TABLE "processed_stripe_events" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "updatedAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "eventId" TEXT NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "processed_stripe_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "processed_stripe_events_eventId_key" ON "processed_stripe_events"("eventId");
