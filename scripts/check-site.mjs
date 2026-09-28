import { chromium } from 'playwright';
import fs from 'node:fs';
const out='scrollcraft/builds/portfolio/screenshots';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const results=[];
const base=process.env.SITE_URL||'http://127.0.0.1:4321';
for(const [name,width,height,reducedMotion,javaScriptEnabled] of [['desktop',1440,900,'no-preference',true],['mobile',390,844,'no-preference',true],['reduced',390,844,'reduce',true],['no-js',390,844,'reduce',false]]){
 const page=await browser.newPage({viewport:{width,height},reducedMotion,javaScriptEnabled});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/',{waitUntil:'networkidle'});await page.screenshot({path:`${out}/${name}-top.png`});
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);if(overflow)throw new Error(name+' overflow');
 if(javaScriptEnabled){await page.locator('#paint-grid button').first().click();if(await page.locator('#paint-grid button').first().getAttribute('aria-pressed')!=='true')throw new Error('Paint failed');await page.locator('#clear-grid').click();if(await page.locator('#paint-grid button[aria-pressed=true]').count())throw new Error('Clear failed');}
 for(const id of ['start','tools','win','create','about']){await page.locator('#'+id).scrollIntoViewIfNeeded();await page.waitForTimeout(150);await page.screenshot({path:`${out}/${name}-${id}.png`});}
 if(!await page.locator('a[href="mailto:buttu7666@gmail.com"]').count())throw new Error('Email missing');
 await page.goto(base+'/projects/',{waitUntil:'networkidle'});if(await page.locator('.index-row').count()!==27)throw new Error('Index count');if(errors.length)throw new Error(errors.join('\n'));results.push({name,overflow,errors,projectEntries:27});await page.close();
}
await browser.close();fs.writeFileSync(`${out}/checks.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(results));
