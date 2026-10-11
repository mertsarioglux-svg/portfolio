export const languages = ['tr', 'en'] as const;
export type Lang = (typeof languages)[number];

/** Dile göre değişen metin. Dile göre değişmeyen metinler düz string olarak yazılabilir. */
export type Text = string | Record<Lang, string>;

export const t = (value: Text, lang: Lang): string =>
  typeof value === 'string' ? value : value[lang];

export const homePath: Record<Lang, string> = { tr: '/', en: '/en/' };

export const projectPath = (lang: Lang, slug: string) => (lang === 'tr' ? `/projeler/${slug}/` : `/en/projects/${slug}/`);
