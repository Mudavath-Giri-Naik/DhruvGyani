import { z } from "zod";
import { ITEM_TYPES } from "@/lib/constants";

const urlOrNull = z
  .string()
  .trim()
  .url()
  .refine((u) => /^https?:\/\//.test(u), "Must be http(s)")
  .nullable()
  .or(z.literal("").transform(() => null));

export const IngestMeta = z.object({
  visibility: z.enum(["public", "internal"]),
  embargo_until: z.string().datetime().nullable(),
  type: z.enum(ITEM_TYPES),
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().max(4000).default(""),
  expedition_id: z.string().uuid().nullable(),
  station_id: z.string().uuid().nullable(),
  discipline: z.array(z.string().trim().max(60)).max(8).default([]),
  tags: z.array(z.string().trim().max(40)).max(15).default([]),
  authors: z.array(z.string().trim().max(120)).max(20).default([]),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  language: z.enum(["en", "hi"]),
  license: z.string().trim().max(120).nullable(),
  source_url: urlOrNull,
  external_url: urlOrNull,
  alt_text: z.string().trim().max(400).nullable().default(null),
  status: z.enum(["draft", "in_review", "published"]).default("in_review"),
  is_sample: z.boolean().default(false),
  phash: z.string().regex(/^[0-9a-f]{16}$/).nullable().default(null),
});

export type IngestMeta = z.infer<typeof IngestMeta>;
