-- Baseline migration to align Prisma history with existing database state.
-- Generated via `prisma migrate diff --from-empty --to-schema-datasource prisma/schema.prisma --script`.
CREATE SCHEMA IF NOT EXISTS "public";

CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email" ASC);
