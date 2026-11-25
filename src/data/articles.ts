export interface ArticleSection { id: string; title: string; paragraphs: string[]; list?: string[] }
export interface Article { id: string; slug: string; title: string; category: string; summary: string; image: string; imageAlt: string; author: string; publishedAt: string; sections: ArticleSection[] }

export const ARTICLES: Article[] = [];
export const getArticle = (value: string) => ARTICLES.find(article => article.slug === value || article.id === value);
export const articleReadMinutes = (article: Article) => Math.max(1, Math.ceil(article.sections.flatMap(section => [...section.paragraphs, ...(section.list || [])]).join(' ').split(/\s+/).length / 180));
