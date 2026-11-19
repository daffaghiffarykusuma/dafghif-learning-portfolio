import { describe, expect, test } from 'bun:test';
import { createPublicationSourceFacts, sizeMediumImage } from '../../src/site/publication-source-facts.ts';

describe('Publication Source Facts', () => {
  test('returns sanitized Publications and shared trust failures through one interface', () => {
    const facts = createPublicationSourceFacts([
      {
        title: 'Trusted',
        url: 'https://medium.com/@author/trusted',
        image: 'https://miro.medium.com/example.webp'
      },
      {
        url: 'http://example.com/untrusted',
        image: 'https://example.com/untrusted.webp'
      }
    ], { sourceName: 'source.json' });

    expect(facts.publications[0]).toMatchObject({
      title: 'Trusted',
      url: 'https://medium.com/@author/trusted',
      image: 'https://miro.medium.com/example.webp'
    });
    expect(facts.publications[1]).toMatchObject({
      title: 'Untitled Post',
      url: '#',
      image: ''
    });
    expect(facts.failures).toEqual([
      'source.json: post 2 url is not HTTPS',
      'source.json: post 2 URL is not a Medium host',
      'source.json: post 2 image host is not allowlisted'
    ]);
  });

  test('keeps known blog topics, defaults missing ones, and reports unknown ones', () => {
    const facts = createPublicationSourceFacts([
      { title: 'Learning', topic: 'learning-work' },
      { title: 'No topic' },
      { title: 'Unknown', topic: 'gossip' }
    ], { sourceName: 'source.json' });

    expect(facts.publications.map(({ topic }) => topic)).toEqual(['learning-work', 'ai-industry', 'ai-industry']);
    expect(facts.failures).toEqual(['source.json: post 3 topic is not a known publication topic']);
  });

  test('reports truthy non-string URL fields as invalid source facts', () => {
    const facts = createPublicationSourceFacts([
      { url: 42, image: { href: 'https://miro.medium.com/example.webp' } }
    ], { sourceName: 'source.json' });

    expect(facts.failures).toEqual([
      'source.json: post 1 url is not a valid URL',
      'source.json: post 1 image is not a valid URL'
    ]);
  });

  test('keeps known post languages, omits missing ones, and reports unknown ones', () => {
    const facts = createPublicationSourceFacts([
      { title: 'English', language: 'en' },
      { title: 'Indonesian', language: 'id' },
      { title: 'Unset' },
      { title: 'Unknown', language: 'fr' }
    ], { sourceName: 'source.json' });

    expect(facts.publications.map((post) => post.language)).toEqual(['en', 'id', undefined, undefined]);
    expect(facts.failures).toEqual(['source.json: post 4 language is not a known publication language']);
  });

  test('requests Medium covers at card size as WebP from either Medium image host', () => {
    expect(sizeMediumImage('https://miro.medium.com/v2/resize:fit:4800/format:webp/1*HW5u5.png'))
      .toBe('https://miro.medium.com/v2/resize:fit:800/format:webp/1*HW5u5.png');
    expect(sizeMediumImage('https://miro.medium.com/v2/resize:fill:160:106/1*thumb.png'))
      .toBe('https://miro.medium.com/v2/resize:fit:800/format:webp/1*thumb.png');
    expect(sizeMediumImage('https://cdn-images-1.medium.com/max/1800/0*DgAQQEz8hNPPmwLD'))
      .toBe('https://miro.medium.com/v2/resize:fit:800/format:webp/0*DgAQQEz8hNPPmwLD');
    // Unrecognized paths are left alone rather than guessed at.
    expect(sizeMediumImage('https://miro.medium.com/example.webp')).toBe('https://miro.medium.com/example.webp');
    expect(createPublicationSourceFacts([{ image: 'https://cdn-images-1.medium.com/max/1024/1*abc.png' }])
      .publications[0].image).toBe('https://miro.medium.com/v2/resize:fit:800/format:webp/1*abc.png');
  });
});
