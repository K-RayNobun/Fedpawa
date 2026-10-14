const { chromium } = await import('/root/lofi-cities/tools/node_modules/playwright-core/index.mjs');

(async () => {
  const browser = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:18081/qui-sommes-nous.php', { waitUntil: 'networkidle' });
  
  // Find all images in the gallery
  const images = await page.$$eval('img', imgs => {
    return imgs.map(img => ({
      src: img.src,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      alt: img.alt,
      complete: img.complete
    }));
  });
  
  // Check for broken images
  const broken = images.filter(img => img.naturalWidth === 0 || !img.complete);
  
  console.log('Total images found:', images.length);
  console.log('Broken images:', broken.length);
  console.log('');
  
  // Print details for each image
  images.forEach((img, i) => {
    console.log(`Image ${i+1}:`);
    console.log(`  src: ${img.src}`);
    console.log(`  naturalWidth: ${img.naturalWidth}`);
    console.log(`  naturalHeight: ${img.naturalHeight}`);
    console.log(`  alt: ${img.alt}`);
    console.log(`  complete: ${img.complete}`);
    console.log('');
  });
  
  // Check file sizes
  const fs = require('fs');
  const galleryDir = '/root/Fedpawa/fedpawa_light/public/assets/images';
  const jpgFiles = fs.readdirSync(galleryDir).filter(f => f.startsWith('qui_') && f.endsWith('.jpg'));
  
  console.log('Image file sizes (bytes):');
  let allOver15KB = true;
  jpgFiles.forEach(f => {
    const path = require('path').join(galleryDir, f);
    const size = fs.statSync(path).size;
    console.log(`  ${f}: ${size} bytes (${Math.round(size/1024)} KB)`);
    if (size < 15000) allOver15KB = false;
  });
  
  console.log('');
  console.log('All images over 15KB:', allOver15KB);
  
  // Take screenshot
  await page.screenshot({ path: '/root/Fedpawa/audit/qui_sommes_nous_new.png', fullPage: true });
  console.log('Screenshot saved to: /root/Fedpawa/audit/qui_sommes_nous_new.png');
  
  await browser.close();
})();