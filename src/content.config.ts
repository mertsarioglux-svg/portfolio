import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/*
 * Projeler: src/content/projects/<dil>/<proje>.mdx
 * Aynı proje her dil için ayrı dosyada; dosya adı (ör. moca) iki dilde de aynı olmalı.
 */
const projects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      /** Ana sayfadaki satırda görünen kısa açıklama */
      summary: z.string(),
      /** Ana sayfada ve proje sayfasının başında görünen tarih */
      date: z.string(),
      year: z.string(),
      /** Ana sayfadaki sıra */
      order: z.number(),
      /** Proje sayfasının giriş bölümünün arka plan rengi */
      tint: z.string(),
      type: z.string(),
      stack: z.string(),
      live: z.string(),
      repo: z.string(),
      hero: image(),
      heroAlt: z.string(),
      /** Ana sayfada üzerine gelince açılan 2-3 görsel; ilki mobilde kapak olarak görünür */
      previews: z.array(image()).min(2).max(3),
    }),
});

export const collections = { projects };
