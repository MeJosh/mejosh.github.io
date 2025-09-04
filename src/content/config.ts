import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    date: z.date(),                // ← change to Date
    tags: z.array(z.string()).optional(),
    summary: z.string().optional(),
    draft: z.boolean().optional(),
  }),
});

const tech = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    date: z.date(),                // ← change to Date
    tags: z.array(z.string()).optional(),
    summary: z.string().optional(),
    draft: z.boolean().optional(),
  }),
});

export const collections = { blog, tech };
