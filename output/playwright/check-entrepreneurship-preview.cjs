async (page) => {
  const origin = 'http://127.0.0.1:4175';
  const viewer = '/assets/portfolio-viewers/entrepreneurship-online-class.html';
  await page.route('**' + viewer, async route => {
    const response = await route.fetch();
    await route.fulfill({ response, headers: { ...response.headers(),
      'content-security-policy': "default-src 'self'; style-src 'self'; script-src 'none'"
    } });
  });
  for (const width of [1440, 390]) {
    await page.goto('about:blank');
    await page.setViewportSize({ width, height: 900 });
    await page.goto(origin + '/portfolio.html?area=training-workshop#project-entrepreneurship-online-class');
    const frame = await (await page.locator('#pdf-iframe').elementHandle()).contentFrame();
    await frame.waitForURL('**' + viewer);
    await frame.locator('h1').waitFor();
    const courseLink = frame.getByRole('link', { name: 'Visit Rumah Siap Kerja (new tab)' });
    if (await courseLink.getAttribute('href') !== 'https://rumahsiapkerja.com/solopreneur/program/strategi-membangun-tim-sales-dan-aktivitas-digital-selling-untuk-meningkatkan-penjualan-cch-0002d'
      || await courseLink.getAttribute('target') !== '_blank') throw new Error('Course link is missing or incorrect');
    const state = await frame.evaluate(async () => {
      const cover = document.querySelector('main img');
      if (cover) await cover.decode();
      return {
        font: getComputedStyle(document.body).fontFamily,
        coverLoaded: Boolean(cover?.naturalWidth),
        overflow: document.documentElement.scrollWidth > innerWidth,
        background: getComputedStyle(document.querySelector('.preview')).backgroundColor
      };
    });
    if (!state.font.includes('Arial') || !state.coverLoaded || state.overflow || state.background !== 'rgb(245, 250, 249)') {
      throw new Error(width + ': ' + JSON.stringify(state));
    }
    await page.screenshot({ path: 'output/playwright/entrepreneurship-preview-' + width + '.png' });
  }
  console.log('Desktop and mobile previews passed under strict CSP: styled content, loaded cover, no horizontal overflow.');
}
