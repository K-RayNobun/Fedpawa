/**
 * E2E verification for mobile menu refactoring
 * Tests all 7 assertions from the user spec
 */
const { chromium } = await import('/root/lofi-cities/tools/node_modules/playwright-core/index.mjs');


async function runTests(url) {
  const browser = await chromium.launch({
    executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
    args: ['--no-sandbox']
  });

  const results = [];

  // Test on mobile (iPhone viewport)
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2
  });

  // ========================================
  // TEST GROUP A: Mobile assertions
  // ========================================

  // (a) Menu opens with animation
  {
    const page = await mobileContext.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    
    // Wait for DOMContentLoaded and check initial state
    const menuToggle = page.locator('#menuToggle');
    const mobileNav = page.locator('#mobileNav');
    
    // Initially menu should be closed
    const isInitiallyClosed = await mobileNav.getAttribute('class');
    results.push({ name: '(a) menu initially closed', pass: isInitiallyClosed && !isInitiallyClosed.includes('open') });
    
    // Open menu
    await menuToggle.click();
    await page.waitForTimeout(300); // wait for animation
    
    const isOpen = await mobileNav.getAttribute('class');
    const isOpenResult = isOpen && isOpen.includes('open');
    results.push({ name: '(a) menu opens with animation (has open class)', pass: isOpenResult });
    
    // Verify the transforms/transitions are applied
    const computedStyle = await mobileNav.evaluate(el => window.getComputedStyle(el).transform);
    results.push({ name: '(a) menu has transform applied', pass: computedStyle !== 'none' });
    
    await page.close();
  }

  // (b) Both toggles are IN the menu and functional
  {
    const page = await mobileContext.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    
    // Ouvrir le menu d'abord (les toggles y sont invisibles tant qu'il est fermé)
    await page.locator('#menuToggle').click();
    await page.waitForTimeout(400);
    // Check toggles exist inside mobile-nav
    const mobileModeToggle = page.locator('.mobile-mode-toggle');
    const mobileLangToggle = page.locator('.mobile-lang-toggle');
    const toggleCount = await page.evaluate(() => { const t = document.querySelector('.mobile-nav-toggles'); return t ? t.querySelectorAll('[class*=toggle]').length : 0; });
    results.push({ name: '(b) toggles exist in mobile menu', pass: toggleCount >= 2 });
    
    // Check mode toggle changes html data-theme
    if (await mobileModeToggle.count() > 0) {
      await mobileModeToggle.first().click();
      const htmlTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      const modeChanged = htmlTheme === 'navy'; // toggle should change theme
      results.push({ name: '(b) theme toggle changes data-theme', pass: modeChanged });
      
      // Toggle again to restore
      await mobileModeToggle.first().click();
    }
    
    // Check lang toggle changes text
    if (await mobileLangToggle.count() > 0) {
      const initialLang = await mobileLangToggle.first().textContent();
      results.push({ name: '(b) lang toggle exists', pass: initialLang === 'EN' || initialLang === 'FR' });
      
      // La bascule FR/EN NAVIGUE vers la page jumelle : attendre la navigation
      try {
        await Promise.all([
          page.waitForNavigation({ timeout: 8000 }),
          mobileLangToggle.first().click()
        ]);
        const newLang = await page.evaluate(() => { const b = document.getElementById('mobileLangToggle'); return b ? b.textContent.trim() : ''; });
        const langSwitched = newLang !== initialLang.trim();
        results.push({ name: '(b) lang toggle switches text', pass: langSwitched });
      } catch (navErr) {
        results.push({ name: '(b) lang toggle switches text', pass: false, note: 'navigation attendue introuvable' });
      }
    }
    
    await page.close();
  }

  // (c) Click outside the menu closes it
  {
    const page = await mobileContext.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    
    const menuToggle = page.locator('#menuToggle');
    const mobileNav = page.locator('#mobileNav');
    
    // Open menu
    await menuToggle.click();
    await page.waitForTimeout(300);
    
    const isOpenBefore = await mobileNav.getAttribute('class');
    
    // Click outside (on body, not on menu)
    await page.click('body', { position: { x: 100, y: 100 } });
    await page.waitForTimeout(100);
    
    const isOpenAfter = await mobileNav.getAttribute('class');
    const closedByClickOutside = !isOpenAfter || !isOpenAfter.includes('open');
    results.push({ name: '(c) click outside closes menu', pass: closedByClickOutside });
    
    await page.close();
  }

  // (d) ✕ button closes the menu
  {
    const page = await mobileContext.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    
    const menuToggle = page.locator('#menuToggle');
    const mobileNav = page.locator('#mobileNav');
    const closeBtn = page.locator('.mobile-close-btn');
    
    // Open menu
    await menuToggle.click();
    await page.waitForTimeout(300);
    
    const isOpenBefore = await mobileNav.getAttribute('class');
    
    // Click ✕ button
    await closeBtn.click();
    await page.waitForTimeout(100);
    
    const isOpenAfter = await mobileNav.getAttribute('class');
    const closedByXBtn = !isOpenAfter || !isOpenAfter.includes('open');
    results.push({ name: '(d) ✕ button closes menu', pass: closedByXBtn });
    
    await page.close();
  }

  // (e) Menu never exceeds 90vh
  {
    const page = await mobileContext.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    
    const menuToggle = page.locator('#menuToggle');
    const mobileNav = page.locator('#mobileNav');
    
    // Open menu
    await menuToggle.click();
    await page.waitForTimeout(300);
    
    // Get the panel's bounding rect
    const rect = await mobileNav.evaluate(el => {
      const rect = el.getBoundingClientRect();
      return { height: rect.height, top: rect.top, bottom: rect.bottom };
    });
    
    const viewportHeight = 844; // iPhone viewport height
    const maxAllowed = 0.9 * viewportHeight;
    const bottomConstraint = rect.bottom <= 0.9 * viewportHeight;
    results.push({ name: `(e) menu height <= 90vh (height=${rect.height}px, max=${maxAllowed.toFixed(1)}px, bottom<=0.9*window.innerHeight=${bottomConstraint})`, pass: rect.height <= maxAllowed && bottomConstraint });
    
    await page.close();
  }

  // (f) Burger visible, barre mobile n'affiche plus les toggles
  {
    const page = await mobileContext.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    
    // Check menu toggle is visible
    const menuToggle = page.locator('#menuToggle');
    const isVisible = await menuToggle.isVisible();
    results.push({ name: '(f) burger is visible', pass: isVisible });
    
    // Check that toggles are NOT in the top bar/header area
    // The header should not have the mode/lang toggles visible on mobile
    const headerTogglesVisible = await page.evaluate(() => {
      const els = document.querySelectorAll('.nav-actions .mode-toggle, .nav-actions .lang-toggle');
      let vis = 0;
      els.forEach(el => { const r = el.getBoundingClientRect(); if (r.width > 0 && r.height > 0) vis++; });
      return vis;
    });
    const togglesRemovedFromHeader = headerTogglesVisible === 0; // toggles cachés dans la barre (déplacés dans le menu mobile)
    results.push({ name: '(f) toggles removed from header on mobile', pass: togglesRemovedFromHeader });
    
    await page.close();
  }

  await browser.close();

  // Print results
  console.log('\\n=== E2E TEST RESULTS ===');
  let allPass = true;
  for (const r of results) {
    const status = r.pass ? 'PASS' : 'FAIL';
    if (!r.pass) allPass = false;
    console.log(`${status}: ${r.name}`);
  }
  console.log(`\\nOverall: ${allPass ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'} (${results.length}/${results.length})`);
  process.exit(allPass ? 0 : 1);
}

const url = process.argv[2] || 'http://127.0.0.1:8097/index.php';
runTests(url);