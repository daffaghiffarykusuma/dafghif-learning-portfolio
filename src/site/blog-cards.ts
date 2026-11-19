import { PUBLICATION_LANGUAGES, PUBLICATION_TOPICS, sizeMediumImage, type Publication } from './publication-source-facts.ts';

// Blog Cards: the blog page's publication markup. Generation renders it into
// blog.html (through happy-dom), so the cards and the first cover image are in
// the HTML the browser receives; src/blog.ts only wires the "Show all" controls.

// Each topic opens with two rows; the rest wait behind a "Show all" control so
// the page stays scannable on phones.
export const INITIAL_POSTS_PER_GROUP = 6;
export const BLOG_SHOW_ALL_ATTRIBUTE = 'data-blog-show-all';

// Cards are three columns, two below 1101px, and one below 768px (src/styles/site.css).
const CARD_IMAGE_SIZES = '(max-width: 767px) 92vw, (max-width: 1100px) 46vw, 400px';
const CARD_IMAGE_WIDTHS = [400, 800];

const appendMediumLink = (document: Document, parent: HTMLElement, href: string, text: string, className = '') => {
    const link = document.createElement('a');
    link.setAttribute('href', href);
    link.textContent = text;
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
    if (className) link.className = className;
    const newTab = document.createElement('span');
    newTab.className = 'sr-only';
    newTab.textContent = ' (opens Medium in a new tab)';
    link.appendChild(newTab);
    parent.appendChild(link);
    return link;
};

const createCard = (document: Document, post: Publication, eager: boolean) => {
    const { title, url, image: img, description: desc, language } = post;

    const article = document.createElement('article');
    article.className = 'blog-card';
    if (language) article.setAttribute('lang', language);

    if (img) {
        const media = document.createElement('div');
        media.className = 'blog-card-media';
        const image = document.createElement('img');
        image.setAttribute('src', img);
        image.setAttribute('srcset', CARD_IMAGE_WIDTHS.map((width) => `${sizeMediumImage(img, width)} ${width}w`).join(', '));
        image.setAttribute('sizes', CARD_IMAGE_SIZES);
        image.setAttribute('alt', title);
        image.setAttribute('loading', eager ? 'eager' : 'lazy');
        if (eager) image.setAttribute('fetchpriority', 'high');
        image.setAttribute('decoding', 'async');
        image.setAttribute('referrerpolicy', 'no-referrer');
        image.setAttribute('width', '800');
        image.setAttribute('height', '450');
        media.appendChild(image);
        article.appendChild(media);
    }

    const body = document.createElement('div');
    body.className = 'blog-card-body';
    if (language) {
        const languageLabel = document.createElement('p');
        languageLabel.className = 'blog-card-language';
        languageLabel.setAttribute('lang', 'en');
        languageLabel.textContent = PUBLICATION_LANGUAGES[language];
        body.appendChild(languageLabel);
    }
    const heading = document.createElement('h3');
    heading.className = 'blog-card-title';
    appendMediumLink(document, heading, url, title);
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
    const cta = appendMediumLink(document, footer, url, 'Read on Medium', 'blog-card-cta');
    cta.setAttribute('lang', 'en');
    const arrow = document.createElement('span');
    arrow.className = 'blog-card-cta-icon';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '↗';
    cta.insertBefore(arrow, cta.lastChild);
    article.appendChild(footer);
    return article;
};

/** Builds the topic groups, jump links, cards, and "Show all" controls for `#blog-cards`. */
export const renderBlogCards = (document: Document, posts: readonly Publication[]): DocumentFragment => {
    const fragment = document.createDocumentFragment();
    if (!posts.length) {
        const emptyMessage = document.createElement('p');
        emptyMessage.textContent = 'No publications found.';
        fragment.appendChild(emptyMessage);
        return fragment;
    }

    // Group posts by topic, in the topic order, so learning writing leads.
    const groups = PUBLICATION_TOPICS
        .map((topic) => ({ ...topic, posts: posts.filter((post) => post.topic === topic.value) }))
        .filter((group) => group.posts.length);

    if (groups.length > 1) {
        const jumpLinks = document.createElement('nav');
        jumpLinks.className = 'blog-topic-links';
        jumpLinks.setAttribute('aria-label', 'Blog topics');
        groups.forEach(({ value, label, posts: groupPosts }) => {
            const link = document.createElement('a');
            link.setAttribute('href', `#blog-topic-${value}`);
            link.textContent = `${label} (${groupPosts.length})`;
            jumpLinks.appendChild(link);
        });
        fragment.appendChild(jumpLinks);
    }

    // Only the first cover image is fetched eagerly: it is the page's largest first-viewport element.
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
        grid.id = `blog-topic-${value}-posts`;
        groupPosts.forEach((post, index) => {
            const eager = !eagerImageUsed && Boolean(post.image);
            if (eager) eagerImageUsed = true;
            const card = createCard(document, post, eager);
            if (index >= INITIAL_POSTS_PER_GROUP) card.setAttribute('hidden', '');
            grid.appendChild(card);
        });
        section.append(heading, grid);
        if (groupPosts.length > INITIAL_POSTS_PER_GROUP) {
            const more = document.createElement('div');
            more.className = 'blog-show-more';
            const button = document.createElement('button');
            button.setAttribute('type', 'button');
            button.className = 'secondary-cta';
            button.textContent = `Show all ${groupPosts.length} posts`;
            button.setAttribute('aria-controls', grid.id);
            button.setAttribute(BLOG_SHOW_ALL_ATTRIBUTE, '');
            more.appendChild(button);
            section.appendChild(more);
        }
        fragment.appendChild(section);
    });
    return fragment;
};
