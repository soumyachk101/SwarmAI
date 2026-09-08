import { chromium } from 'playwright';

(async () => {
 const browser = await chromium.launch();
 const context = await browser.newContext({
 viewport: { width: 1920, height: 1080 },
 recordVideo: { dir: '/Users/soumyachakraborty/Documents/01-Projects/Projects-939/AI-Agents/swarm-ai/video/', size: { width: 1920, height: 1080 } }
 });
 const page = await context.newPage();
 await page.goto('http://localhost:8765/swarm-ai-motion-video.html');
 await page.waitForTimeout;

 await page.click('#rec-btn');
 await page.waitForTimeout;

 await page.click('#rec-btn');
 await page.waitForTimeout;

 const video = page.video();
 if (video) {
 const videoPath = await video.path();
 console.log('VIDEO_PATH:' + videoPath);
 } else {
 console.log('NO_VIDEO');
 }

 await context.close();
 await browser.close();
})();
