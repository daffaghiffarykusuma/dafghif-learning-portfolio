const allowedImageHosts = new Set(['cdn-images-1.medium.com', 'miro.medium.com']);

export function createPublicationSourceFacts(source, { sourceName = 'Publication source' } = {}) {
    const failures = [];
    const posts = Array.isArray(source) ? source : source?.posts || [];
    const publications = posts.map((post, index) => {
        const label = `${sourceName}: post ${index + 1}`;
        let url = '#';
        let image = '';

        if (post.url) {
            try {
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
                const parsed = new URL(post.image.trim());
                const hostAllowed = allowedImageHosts.has(parsed.hostname.toLowerCase());
                if (parsed.protocol !== 'https:') failures.push(`${label} image is not HTTPS`);
                if (!hostAllowed) failures.push(`${label} image host is not allowlisted`);
                if (parsed.protocol === 'https:' && hostAllowed) image = parsed.href;
            } catch {
                failures.push(`${label} image is not a valid URL`);
            }
        }

        return {
            title: post.title || 'Untitled Post',
            description: post.description || '',
            url,
            image
        };
    });

    return { publications, failures };
}
