import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
const [dir,out]=[process.argv[2],process.argv[3]];
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const p=await b.newPage({viewport:{width:1200,height:800},deviceScaleFactor:2});
for (const n of ['fig1','fig2','fig3','fig4','fig5']){
  await p.goto('file://'+dir+'/'+n+'.html'); await p.waitForTimeout(200);
  await p.locator('#fig').screenshot({path:out+'/'+n+'.png'});
}
await b.close();
