import { type CollectionEntry, getCollection } from 'astro:content';
import type { Lang } from '../i18n/lang';

export type Project = CollectionEntry<'projects'>;

export const langOf = (project: Project) => project.id.split('/')[0] as Lang;
export const slugOf = (project: Project) => project.id.split('/').slice(1).join('/');

export async function getProjects(lang: Lang) {
  const projects = await getCollection('projects', (project) => langOf(project) === lang);
  return projects.sort((a, b) => a.data.order - b.data.order);
}
