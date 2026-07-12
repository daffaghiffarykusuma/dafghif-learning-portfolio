import { describe, expect, test } from 'bun:test';
import { createPublicationSourceFacts } from '../../js/site/publication-source-facts.js';

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
});
