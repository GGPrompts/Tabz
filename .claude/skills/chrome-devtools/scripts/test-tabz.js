#!/usr/bin/env node
import { getBrowser, getPage, closeBrowser, outputJSON } from './lib/browser.js';

async function testTabz() {
  let browser, page;
  const results = {
    success: true,
    tests: []
  };

  try {
    browser = await getBrowser({ headless: false });
    page = await getPage(browser, 'http://localhost:5173', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for app to be ready
    await page.waitForSelector('button.settings-button', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Test 1: Check initial page load
    const title = await page.title();
    results.tests.push({
      name: 'Page loads',
      passed: title === 'Tabz',
      details: { title }
    });

    // Test 2: Settings button opens modal
    await page.click('button.settings-button');
    await page.waitForTimeout(500);
    const settingsModal = await page.evaluate(() => {
      const modal = document.querySelector('.settings-modal, [role="dialog"]');
      return {
        exists: !!modal,
        visible: modal ? window.getComputedStyle(modal).display !== 'none' : false
      };
    });
    results.tests.push({
      name: 'Settings modal opens',
      passed: settingsModal.exists && settingsModal.visible,
      details: settingsModal
    });

    // Close modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Test 3: Hotkeys button opens modal
    await page.click('button.hotkeys-button');
    await page.waitForTimeout(500);
    const hotkeysModal = await page.evaluate(() => {
      const modal = document.querySelector('.hotkeys-modal, [role="dialog"]');
      return {
        exists: !!modal,
        visible: modal ? window.getComputedStyle(modal).display !== 'none' : false
      };
    });
    results.tests.push({
      name: 'Hotkeys modal opens',
      passed: hotkeysModal.exists && hotkeysModal.visible,
      details: hotkeysModal
    });

    // Close modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Test 4: Spawn button shows menu
    await page.click('button.spawn-button');
    await page.waitForTimeout(500);
    const spawnMenu = await page.evaluate(() => {
      const menu = document.querySelector('.spawn-menu, [class*="spawn"][class*="menu"]');
      const menuItems = document.querySelectorAll('.spawn-option, [class*="spawn"][class*="option"]');
      return {
        exists: !!menu,
        itemCount: menuItems.length,
        visible: menu ? window.getComputedStyle(menu).display !== 'none' : false
      };
    });
    results.tests.push({
      name: 'Spawn menu shows options',
      passed: spawnMenu.exists && spawnMenu.visible && spawnMenu.itemCount > 0,
      details: spawnMenu
    });

    // Test 5: Tab add button exists and is functional
    const tabAddBtn = await page.evaluate(() => {
      const btn = document.querySelector('button.tab-add');
      return {
        exists: !!btn,
        enabled: btn && !btn.disabled,
        visible: btn ? window.getComputedStyle(btn).display !== 'none' : false
      };
    });
    results.tests.push({
      name: 'Tab add button is available',
      passed: tabAddBtn.exists && tabAddBtn.enabled && tabAddBtn.visible,
      details: tabAddBtn
    });

    // Summary
    const passedCount = results.tests.filter(t => t.passed).length;
    const totalCount = results.tests.length;
    results.summary = {
      passed: passedCount,
      failed: totalCount - passedCount,
      total: totalCount,
      allPassed: passedCount === totalCount
    };

    results.success = results.summary.allPassed;

  } catch (error) {
    results.success = false;
    results.error = error.message;
    results.stack = error.stack;
  } finally {
    if (browser) {
      await closeBrowser(browser);
    }
  }

  outputJSON(results);
}

testTabz();
