import blogData from '../assets/blog.json';
import { createPublicationSourceFacts } from './site/publication-source-facts.ts';

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('blog-cards');
    if (!container) return;

    const appendMediumLink = (parent, href, text, className) => {
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

    const fragment = document.createDocumentFragment();
    posts.forEach((post, index) => {
        const { title, url, image: img, description: desc } = post;

        const article = document.createElement('article');
        article.className = 'blog-card';

        if (img) {
            const media = document.createElement('div');
            media.className = 'blog-card-media';
            const image = document.createElement('img');
            image.src = img;
            image.alt = title;
            image.loading = index === 0 ? 'eager' : 'lazy';
            if (index === 0) image.fetchPriority = 'high';
            image.decoding = 'async';
            image.referrerPolicy = 'no-referrer';
            media.appendChild(image);
            article.appendChild(media);
        }

        const body = document.createElement('div');
        body.className = 'blog-card-body';
        const heading = document.createElement('h2');
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
        fragment.appendChild(article);
    });
    container.appendChild(fragment);
});
