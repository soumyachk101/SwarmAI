(async (page) => {
 const dir = '/Users/soumyachakraborty/Documents/01-Projects/Projects-939/AI-Agents/swarm-ai/frames'
 const fs = require('fs')
 const path = require('path')

 if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

 await page.goto('http://localhost:8765/swarm-ai-motion-video.html')
 await page.waitForTimeout(500)

 const TOTAL = 82
 const fps = 2
 const interval = 1000 / fps
 const totalFrames = Math.floor(TOTAL * fps)

 for (let i = 0; i < totalFrames; i++) {
 await page.waitForTimeout(interval)
 const buf = await page.screenshot({ type: 'png', fullPage: false })
 const fn = path.join(dir, `frame_${String(i).padStart(4, '0')}.png`)
 fs.writeFileSync(fn, buf)
 }

 return `DONE:${totalFrames}`
})(page)
