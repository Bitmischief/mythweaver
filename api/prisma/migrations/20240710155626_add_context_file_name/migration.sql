/*
  Warnings:

  - Added the required column `filename` to the `openai_context_files` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "openai_context_files" ADD COLUMN     "filename" TEXT NOT NULL;
