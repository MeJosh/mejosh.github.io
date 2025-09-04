import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    date: z.string(),
    tags: z.array(z.string()).optional(),
    summary: z.string().optional(),
    draft: z.boolean().optional()
  })
});

const tech = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    date: z.string(),
    tags: z.array(z.string()).optional(),
    summary: z.string().optional(),
    draft: z.boolean().optional()
  })
});

export const collections = { blog, tech };
