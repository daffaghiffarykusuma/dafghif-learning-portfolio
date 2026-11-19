import blogData from '../assets/blog.json';
import { createPublicationSourceFacts, PUBLICATION_TOPICS, type Publication } from './site/publication-source-facts.ts';

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('blog-cards');
    if (!container) return;

    const appendMediumLink = (parent: HTMLElement, href: string, text: string, className = '') => {
        const link = document.createElement('a');
        link.href = href;
        link.textContent = text;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        if (className) link.className = className;
        parent.appendChild(link);
    };

    const { publications: posts } = createPublicationSourceFacts(blogData);
    container.replaceChildren();
    if (!posts.length) {
        const emptyMessage = document.createElement('p');
        emptyMessage.textContent = 'No publications found.';
        container.appendChild(emptyMessage);
        return;
    }

    const createCard = (post: Publication, eager: boolean) => {
        const { title, url, image: img, description: desc } = post;

        const article = document.createElement('article');
        article.className = 'blog-card';

        if (img) {
            const media = document.createElement('div');
            media.className = 'blog-card-media';
            const image = document.createElement('img');
            image.src = img;
            image.alt = title;
            image.loading = eager ? 'eager' : 'lazy';
            if (eager) image.fetchPriority = 'high';
            image.decoding = 'async';
            image.referrerPolicy = 'no-referrer';
            media.appendChild(image);
            article.appendChild(media);
        }

        const body = document.createElement('div');
        body.className = 'blog-card-body';
        const heading = document.createElement('h3');
        heading.className = 'blog-card-title';
        appendMediumLink(heading, url, title);
        body.appendChild(heading);

        if (desc) {
            const description = document.createElement('p');
            description.className = 'blog-card-desc';
            description.textContent = desc;
            body.appendChild(description);
        }
        article.appendChild(body);

        const footer = document.createElement('div');
        footer.className = 'blog-card-footer';
        appendMediumLink(footer, url, 'Read on Medium', 'blog-card-cta');
        article.appendChild(footer);
        return article;
    };

    // Group posts by topic, in the topic order, so learning writing leads.
    const groups = PUBLICATION_TOPICS
        .map((topic) => ({ ...topic, posts: posts.filter((post) => post.topic === topic.value) }))
        .filter((group) => group.posts.length);

    const fragment = document.createDocumentFragment();
    if (groups.length > 1) {
        const jumpLinks = document.createElement('nav');
        jumpLinks.className = 'blog-topic-links';
        jumpLinks.setAttribute('aria-label', 'Blog topics');
        groups.forEach(({ value, label, posts: groupPosts }) => {
            const link = document.createElement('a');
            link.href = `#blog-topic-${value}`;
            link.textContent = `${label} (${groupPosts.length})`;
            jumpLinks.appendChild(link);
        });
        fragment.appendChild(jumpLinks);
    }

    let eagerImageUsed = false;
    groups.forEach(({ value, label, posts: groupPosts }) => {
        const section = document.createElement('section');
        section.className = 'blog-group';
        section.id = `blog-topic-${value}`;
        const heading = document.createElement('h2');
        heading.className = 'blog-group-title';
        heading.id = `blog-topic-${value}-heading`;
        heading.textContent = label;
        section.setAttribute('aria-labelledby', heading.id);
        const grid = document.createElement('div');
        grid.className = 'grid blog-card-grid';
        groupPosts.forEach((post) => {
            const eager = !eagerImageUsed && Boolean(post.image);
            if (eager) eagerImageUsed = true;
            grid.appendChild(createCard(post, eager));
        });
        section.append(heading, grid);
        fragment.appendChild(section);
    });
    container.appendChild(fragment);
});
