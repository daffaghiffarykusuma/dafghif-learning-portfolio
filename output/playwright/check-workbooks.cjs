async (page) => {
 const names = ["bnsp6-evaluation-level1-reaction.html", "bnsp6-evaluation-level2-learning.html", "bnsp6-rab-roti-pelatihan.html", "employee-assessment-observation-workbook.html", "miles-unfair-advantage-mentoring-workbook.html", "need-analysis-framework-training-coaching.html", "recruitment-assessment-blueprint.html", "score-audit-corrections.html", "theory-of-change-mentoring-tracker.html", "ybb-mentoring-workbook-week-1.html", "ybb-mentoring-workbook-week-2.html", "ybb-mentoring-workbook-week-3.html"];
 await page.route('**/assets/portfolio-viewers/*.html', async route => {
  const response = await route.fetch();
  await route.fulfill({response, headers:{...response.headers(), 'content-security-policy': "default-src 'self'; style-src 'self'; script-src 'none'"}});
 });
 let checked=0;
 for(const name of names){
  for(const width of [1440,390]){
   await page.setViewportSize({width,height:900});
   await page.goto('http://127.0.0.1:4174/assets/portfolio-viewers/'+name);
   const state=await page.evaluate(()=>({styled:getComputedStyle(document.querySelector('.workbook-bar')).backgroundColor,overflow:document.documentElement.scrollWidth>innerWidth,broken:[...document.querySelectorAll('.sheet-tabs a')].some(a=>!document.querySelector(a.hash))}));
   if(state.styled!=='rgb(24, 92, 55)'||state.overflow||state.broken) throw new Error(name+': '+JSON.stringify(state));
   checked++;
  }
 }
 await page.goto('http://127.0.0.1:4174/assets/portfolio-viewers/ybb-mentoring-workbook-week-1.html');
 await page.getByRole('link',{name:'Team Idea Exploration',exact:true}).click();
 if(!page.url().endsWith('#sheet-2')) throw new Error('Sheet navigation failed');
 await page.screenshot({path:'output/playwright/workbook-mobile.png'});
 console.log(checked+' viewer/viewport checks passed under strict CSP; sheet navigation passed.');
}
