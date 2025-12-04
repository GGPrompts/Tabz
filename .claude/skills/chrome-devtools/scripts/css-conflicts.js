#!/usr/bin/env node
/**
 * CSS Conflict Finder
 * Scans a page for elements with CSS conflicts and highlights problem areas
 *
 * Usage: node css-conflicts.js --url https://example.com [options]
 *
 * Options:
 *   --url          Target URL (required)
 *   --selector     Limit scan to specific elements (optional, e.g., ".container *")
 *   --min-rules    Minimum rules to consider it a conflict (default: 3)
 *   --properties   Specific properties to check (comma-separated, e.g., "display,position,color")
 *   --output       Save results to JSON file (optional)
 *   --headless     Run in headless mode (default: true)
 */

import { getBrowser, getPage, closeBrowser, parseArgs, outputJSON, outputError } from './lib/browser.js';

async function findConflicts() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.url) {
    outputError(new Error('--url is required'));
    return;
  }

  try {
    const browser = await getBrowser({
      headless: args.headless !== 'false'
    });

    const page = await getPage(browser);

    await page.goto(args.url, {
      waitUntil: args['wait-until'] || 'networkidle2',
      timeout: parseInt(args.timeout) || 30000
    });

    const minRules = parseInt(args['min-rules']) || 3;
    const targetSelector = args.selector || '*';
    const propertyFilter = args.properties ? args.properties.split(',').map(p => p.trim()) : null;

    // Run analysis in page context
    const analysis = await page.evaluate((selector, minRules, propertyFilter) => {
      const elements = document.querySelectorAll(selector);
      const results = [];

      elements.forEach(el => {
        // Skip hidden elements
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') {
          return;
        }

        // Get all CSS rules that apply to this element
        const sheets = Array.from(document.styleSheets);
        const matchingRules = [];

        sheets.forEach(sheet => {
          try {
            const rules = Array.from(sheet.cssRules || []);
            rules.forEach(rule => {
              if (rule.selectorText && el.matches(rule.selectorText)) {
                matchingRules.push({
                  selector: rule.selectorText,
                  properties: Array.from(rule.style).map(prop => ({
                    name: prop,
                    value: rule.style.getPropertyValue(prop),
                    important: rule.style.getPropertyPriority(prop) === 'important'
                  }))
                });
              }
            });
          } catch (e) {
            // Skip inaccessible stylesheets (CORS)
          }
        });

        if (matchingRules.length >= minRules) {
          // Find property conflicts
          const propertyMap = new Map();

          matchingRules.forEach(rule => {
            rule.properties.forEach(prop => {
              if (!propertyFilter || propertyFilter.includes(prop.name)) {
                if (!propertyMap.has(prop.name)) {
                  propertyMap.set(prop.name, []);
                }
                propertyMap.get(prop.name).push({
                  selector: rule.selector,
                  value: prop.value,
                  important: prop.important
                });
              }
            });
          });

          const conflicts = [];
          propertyMap.forEach((values, prop) => {
            if (values.length > 1) {
              conflicts.push({
                property: prop,
                ruleCount: values.length,
                declarations: values,
                computedValue: style.getPropertyValue(prop)
              });
            }
          });

          if (conflicts.length > 0) {
            // Create unique selector for element
            let elementSelector = el.tagName.toLowerCase();
            if (el.id) {
              elementSelector = `#${el.id}`;
            } else if (el.className) {
              const classes = el.className.split(' ').filter(c => c).slice(0, 2);
              if (classes.length > 0) {
                elementSelector += '.' + classes.join('.');
              }
            }

            // Get position in page
            const rect = el.getBoundingClientRect();

            results.push({
              selector: elementSelector,
              tag: el.tagName.toLowerCase(),
              id: el.id || null,
              classes: Array.from(el.classList),
              position: {
                top: Math.round(rect.top + window.scrollY),
                left: Math.round(rect.left + window.scrollX),
                width: Math.round(rect.width),
                height: Math.round(rect.height)
              },
              totalRules: matchingRules.length,
              conflictingProperties: conflicts.length,
              conflicts: conflicts
            });
          }
        }
      });

      // Sort by number of conflicts (most problematic first)
      results.sort((a, b) => b.conflictingProperties - a.conflictingProperties);

      return results;
    }, targetSelector, minRules, propertyFilter);

    const result = {
      success: true,
      url: page.url(),
      scanSelector: targetSelector,
      minRules: minRules,
      summary: {
        elementsScanned: await page.evaluate((sel) => document.querySelectorAll(sel).length, targetSelector),
        elementsWithConflicts: analysis.length,
        totalConflicts: analysis.reduce((sum, el) => sum + el.conflictingProperties, 0)
      },
      elements: analysis
    };

    outputJSON(result);

    // Save to file if requested
    if (args.output) {
      const fs = await import('fs');
      fs.writeFileSync(args.output, JSON.stringify(result, null, 2));
      console.error(`Results saved to: ${args.output}`);
    }

    if (args.close !== 'false') {
      await closeBrowser();
    }

  } catch (error) {
    outputError(error);
  }
}

findConflicts();
