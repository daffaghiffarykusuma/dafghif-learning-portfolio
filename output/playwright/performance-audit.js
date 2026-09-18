async (page) => {
 const context=await page.context().browser().newContext(); page=await context.newPage(); const cdp = await page.context().newCDPSession(page);
 await cdp.send('Network.enable');
 await cdp.send('Network.setCacheDisabled', {cacheDisabled:true});
 await page.addInitScript(() => {
  window.audit = {lcp:0, cls:0, longTasks:0};
  new PerformanceObserver(list => {for(const e of list.getEntries()) window.audit.lcp=e.startTime;}).observe({type:'largest-contentful-paint',buffered:true});
  new PerformanceObserver(list => {for(const e of list.getEntries()) if(!e.hadRecentInput) window.audit.cls+=e.value;}).observe({type:'layout-shift',buffered:true});
  new PerformanceObserver(list => {for(const e of list.getEntries()) window.audit.longTasks+=Math.max(0,e.duration-50);}).observe({type:'longtask',buffered:true});
 });
 const results=[]; const routes=['index.html','portfolio.html','case-studies.html','blog.html','contact.html','case-administrative-communication.html','case-applied-leadership-development.html','case-career-readiness-toolkit.html','case-employee-assessment-bootcamp.html','case-entrepreneurship.html','case-learning-organization-strategy.html','case-ybb-mentoring-workbook.html'];
 for(const mode of ['desktop','mobile']) {
  await page.setViewportSize(mode==='desktop'?{width:1440,height:900}:{width:390,height:844});
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:200000,uploadThroughput:100000});
  for(const route of routes) {
   await page.goto('http://127.0.0.1:4173/'+route,{waitUntil:'load'});
   await page.waitForTimeout(1800);
   results.push({mode,route,...await page.evaluate(()=>({ ...window.audit, resources:performance.getEntriesByType('resource').map(e=>({name:new URL(e.name).pathname,bytes:e.transferSize,duration:e.duration})), iframe:document.querySelector('#pdf-iframe')?.getAttribute('src'), overflow:document.documentElement.scrollWidth>innerWidth }))});
  }
 }
 await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
 await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
 await cdp.detach(); await context.close(); return results;
}
