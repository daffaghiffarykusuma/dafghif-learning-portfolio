import blogData from '../assets/blog.json';
import { createPublicationSourceFacts, PUBLICATION_LANGUAGES, PUBLICATION_TOPICS, type Publication } from './site/publication-source-facts.ts';

// Each topic opens with two rows; the rest wait behind a "Show all" control so
// the page stays scannable on phones.
const INITIAL_POSTS_PER_GROUP = 6;

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
        const newTab = document.createElement('span');
        newTab.className = 'sr-only';
        newTab.textContent = ' (opens Medium in a new tab)';
        link.appendChild(newTab);
        parent.appendChild(link);
        return link;
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
        const { title, url, image: img, description: desc, language } = post;

        const article = document.createElement('article');
        article.className = 'blog-card';
        if (language) article.lang = language;

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
            image.width = 800;
            image.height = 450;
            image.addEventListener('error', () => {
                media.classList.add('blog-card-media-empty');
                image.remove();
            }, { once: true });
            media.appendChild(image);
            article.appendChild(media);
        }

        const body = document.createElement('div');
        body.className = 'blog-card-body';
        if (language) {
            const languageLabel = document.createElement('p');
            languageLabel.className = 'blog-card-language';
            languageLabel.lang = 'en';
            languageLabel.textContent = PUBLICATION_LANGUAGES[language];
            body.appendChild(languageLabel);
        }
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
        const cta = appendMediumLink(footer, url, 'Read on Medium', 'blog-card-cta');
        cta.lang = 'en';
        const arrow = document.createElement('span');
        arrow.className = 'blog-card-cta-icon';
        arrow.setAttribute('aria-hidden', 'true');
        arrow.textContent = '↗';
        cta.insertBefore(arrow, cta.lastChild);
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
        const hiddenCards: HTMLElement[] = [];
        groupPosts.forEach((post, index) => {
            const eager = !eagerImageUsed && Boolean(post.image);
            if (eager) eagerImageUsed = true;
            const card = createCard(post, eager);
            if (index >= INITIAL_POSTS_PER_GROUP) {
                card.hidden = true;
                hiddenCards.push(card);
            }
            grid.appendChild(card);
        });
        section.append(heading, grid);
        if (hiddenCards.length) {
            const more = document.createElement('div');
            more.className = 'blog-show-more';
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'secondary-cta';
            button.textContent = `Show all ${groupPosts.length} posts`;
            button.setAttribute('aria-controls', grid.id = `blog-topic-${value}-posts`);
            button.addEventListener('click', () => {
                hiddenCards.forEach((card) => { card.hidden = false; });
                // Move focus to the first newly shown post so keyboard users continue in place.
                hiddenCards[0]?.querySelector<HTMLAnchorElement>('.blog-card-title a')?.focus();
                more.remove();
            });
            more.appendChild(button);
            section.appendChild(more);
        }
        fragment.appendChild(section);
    });
    container.appendChild(fragment);
});
