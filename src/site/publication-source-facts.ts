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

export type Publication = {
    title: string;
    description: string;
    url: string;
    image: string;
    topic: PublicationTopic;
};

export type PublicationSourceFacts = {
    publications: Publication[];
    failures: string[];
};

type PublicationInput = Partial<Record<'title' | 'description' | 'url' | 'image' | 'topic', unknown>>;

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
                if (parsed.protocol === 'https:' && hostAllowed) image = parsed.href;
            } catch {
                failures.push(`${label} image is not a valid URL`);
            }
        }

        let topic = DEFAULT_TOPIC;
        if (post.topic !== undefined) {
            if (isPublicationTopic(post.topic)) topic = post.topic;
            else failures.push(`${label} topic is not a known publication topic`);
        }

        return {
            title: textValue(post.title) || 'Untitled Post',
            description: textValue(post.description),
            url,
            image,
            topic
        };
    });

    return { publications, failures };
}
