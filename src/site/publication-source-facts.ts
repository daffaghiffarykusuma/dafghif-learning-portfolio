const allowedImageHosts = new Set(['cdn-images-1.medium.com', 'miro.medium.com']);

// Blog topics in page order. Learning and workplace writing leads because it
// supports the portfolio; posts without a topic join the last group.
export const PUBLICATION_TOPICS = Object.freeze([
    Object.freeze({ value: 'learning-work', label: 'Learning, work, and wellbeing' }),
    Object.freeze({ value: 'ai-industry', label: 'AI and industry notes' })
]);
export type PublicationTopic = (typeof PUBLICATION_TOPICS)[number]['value'];
const DEFAULT_TOPIC: PublicationTopic = 'ai-industry';
const isPublicationTopic = (value: unknown): value is PublicationTopic =>
    PUBLICATION_TOPICS.some((topic) => topic.value === value);

// Posts are written in English or Indonesian. The card names the language so
// a reviewer knows before leaving the site, and sets lang for screen readers.
export const PUBLICATION_LANGUAGES = Object.freeze({ en: 'English', id: 'Bahasa Indonesia' });
export type PublicationLanguage = keyof typeof PUBLICATION_LANGUAGES;
const isPublicationLanguage = (value: unknown): value is PublicationLanguage =>
    typeof value === 'string' && Object.hasOwn(PUBLICATION_LANGUAGES, value);

// Blog cards are at most ~420 CSS px wide, so an 800px WebP covers 2x screens.
// Medium sources are often 2000-4800px PNGs (up to 2 MB), which left cards
// blank while they downloaded. Both Medium image hosts serve the same image
// ids, and miro resizes and converts any of them on request.
const CARD_IMAGE_WIDTH = 800;
export const sizeMediumImage = (href: string, width = CARD_IMAGE_WIDTH): string => {
    const parsed = new URL(href);
    const imageId = parsed.pathname.split('/').filter(Boolean).at(-1);
    if (!imageId || !/^\d\*[\w.-]+$/.test(imageId)) return parsed.href;
    return `https://miro.medium.com/v2/resize:fit:${width}/format:webp/${imageId}`;
};

export type Publication = {
    title: string;
    description: string;
    url: string;
    image: string;
    topic: PublicationTopic;
    language?: PublicationLanguage;
};

export type PublicationSourceFacts = {
    publications: Publication[];
    failures: string[];
};

type PublicationInput = Partial<Record<'title' | 'description' | 'url' | 'image' | 'topic' | 'language', unknown>>;

const asPublicationInput = (value: unknown): PublicationInput =>
    value !== null && typeof value === 'object' && !Array.isArray(value)
        ? value as PublicationInput
        : {};

const sourcePosts = (source: unknown): unknown[] => {
    if (Array.isArray(source)) return source;
    if (source !== null && typeof source === 'object' && 'posts' in source) {
        const posts = (source as { posts?: unknown }).posts;
        return Array.isArray(posts) ? posts : [];
    }
    return [];
};

const textValue = (value: unknown): string => typeof value === 'string' ? value : '';

export function createPublicationSourceFacts(source: unknown, { sourceName = 'Publication source' }: { sourceName?: string } = {}): PublicationSourceFacts {
    const failures: string[] = [];
    const publications = sourcePosts(source).map((value, index) => {
        const post = asPublicationInput(value);
        const label = `${sourceName}: post ${index + 1}`;
        let url = '#';
        let image = '';

        if (post.url) {
            try {
                if (typeof post.url !== 'string') throw new TypeError('URL must be a string');
                const parsed = new URL(post.url.trim());
                const host = parsed.hostname.toLowerCase();
                const isMediumHost = host === 'medium.com' || host.endsWith('.medium.com');
                if (parsed.protocol !== 'https:') failures.push(`${label} url is not HTTPS`);
                if (!isMediumHost) failures.push(`${label} URL is not a Medium host`);
                if (parsed.protocol === 'https:' && isMediumHost) url = parsed.href;
            } catch {
                failures.push(`${label} url is not a valid URL`);
            }
        }

        if (post.image) {
            try {
                if (typeof post.image !== 'string') throw new TypeError('Image URL must be a string');
                const parsed = new URL(post.image.trim());
                const hostAllowed = allowedImageHosts.has(parsed.hostname.toLowerCase());
                if (parsed.protocol !== 'https:') failures.push(`${label} image is not HTTPS`);
                if (!hostAllowed) failures.push(`${label} image host is not allowlisted`);
                if (parsed.protocol === 'https:' && hostAllowed) image = sizeMediumImage(parsed.href);
            } catch {
                failures.push(`${label} image is not a valid URL`);
            }
        }

        let topic = DEFAULT_TOPIC;
        if (post.topic !== undefined) {
            if (isPublicationTopic(post.topic)) topic = post.topic;
            else failures.push(`${label} topic is not a known publication topic`);
        }

        let language: PublicationLanguage | undefined;
        if (post.language !== undefined) {
            if (isPublicationLanguage(post.language)) language = post.language;
            else failures.push(`${label} language is not a known publication language`);
        }

        return {
            title: textValue(post.title) || 'Untitled Post',
            description: textValue(post.description),
            url,
            image,
            topic,
            ...(language ? { language } : {})
        };
    });

    return { publications, failures };
}
