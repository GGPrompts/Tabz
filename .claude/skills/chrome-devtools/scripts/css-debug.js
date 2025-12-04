#!/usr/bin/env node
/**
 * CSS Cascade Debugger
 * Analyzes CSS conflicts and shows the full cascade hierarchy for an element
 *
 * Usage: node css-debug.js --url https://example.com --selector ".my-element" [options]
 *
 * Options:
 *   --url          Target URL (required)
 *   --selector     CSS selector for element to debug (required)
 *   --property     Specific CSS property to analyze (optional, e.g., "color", "display")
 *   --output       Save results to JSON file (optional)
 *   --headless     Run in headless mode (default: true)
 *   --close        Close browser after execution (default: true)
 */

import { getBrowser, getPage, closeBrowser, parseArgs, outputJSON, outputError } from './lib/browser.js';

/**
 * Calculate CSS specificity for a selector
 * Returns [inline, ids, classes/attrs/pseudo, elements]
 */
function calculateSpecificity(selector) {
  if (!selector) return [0, 0, 0, 0];

  let ids = (selector.match(/#/g) || []).length;
  let classes = (selector.match(/\./g) || []).length;
  let attrs = (selector.match(/\[/g) || []).length;
  let pseudoClasses = (selector.match(/:/g) || []).length - (selector.match(/::/g) || []).length;
  let elements = selector.split(/[\s>+~]/).filter(s => s && !s.match(/^[#.\[:]/) && s !== '*').length;

  return [0, ids, classes + attrs + pseudoClasses, elements];
}

/**
 * Compare two specificity arrays
 * Returns: 1 if a > b, -1 if a < b, 0 if equal
 */
function compareSpecificity(a, b) {
  for (let i = 0; i < 4; i++) {
    if (a[i] > b[i]) return 1;
    if (a[i] < b[i]) return -1;
  }
  return 0;
}

/**
 * Format specificity as readable string
 */
function formatSpecificity(spec) {
  return `(${spec[0]},${spec[1]},${spec[2]},${spec[3]})`;
}

async function debugCSS() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.url) {
    outputError(new Error('--url is required'));
    return;
  }

  if (!args.selector) {
    outputError(new Error('--selector is required (e.g., --selector ".my-class" or --selector "#my-id")'));
    return;
  }

  try {
    const browser = await getBrowser({
      headless: args.headless !== 'false'
    });

    const page = await getPage(browser);

    // Navigate to URL
    await page.goto(args.url, {
      waitUntil: args['wait-until'] || 'networkidle2',
      timeout: parseInt(args.timeout) || 30000
    });

    // Create CDP session
    const client = await page.createCDPSession();

    // Enable necessary domains
    await client.send('DOM.enable');
    await client.send('CSS.enable');

    // Get the document
    const { root } = await client.send('DOM.getDocument', { depth: -1 });

    // Find the target element
    const { nodeId } = await client.send('DOM.querySelector', {
      nodeId: root.nodeId,
      selector: args.selector
    });

    if (!nodeId) {
      throw new Error(`Element not found: ${args.selector}`);
    }

    // Get matched CSS rules
    const matchedStyles = await client.send('CSS.getMatchedStylesForNode', {
      nodeId: nodeId
    });

    // Get computed styles
    const computedStyle = await client.send('CSS.getComputedStyleForNode', {
      nodeId: nodeId
    });

    // Process the results
    const result = {
      success: true,
      url: page.url(),
      selector: args.selector,
      element: {
        tag: null,
        id: null,
        classes: []
      },
      cascade: [],
      computed: {},
      conflicts: [],
      summary: {
        totalRules: 0,
        conflictingProperties: 0
      }
    };

    // Get element info
    const { node } = await client.send('DOM.describeNode', { nodeId });
    result.element.tag = node.nodeName.toLowerCase();
    result.element.id = node.attributes ? node.attributes[node.attributes.indexOf('id') + 1] : null;
    const classIndex = node.attributes ? node.attributes.indexOf('class') : -1;
    if (classIndex !== -1) {
      result.element.classes = node.attributes[classIndex + 1].split(' ');
    }

    // Process inline styles
    if (matchedStyles.inlineStyle) {
      const inlineProps = {};
      for (const prop of matchedStyles.inlineStyle.cssProperties) {
        inlineProps[prop.name] = {
          value: prop.value,
          important: prop.important || false
        };
      }

      result.cascade.push({
        type: 'inline',
        selector: 'style attribute',
        specificity: formatSpecificity([1, 0, 0, 0]),
        specificityRaw: [1, 0, 0, 0],
        source: 'inline',
        properties: inlineProps
      });
    }

    // Process matched CSS rules
    if (matchedStyles.matchedCSSRules) {
      for (const match of matchedStyles.matchedCSSRules) {
        const rule = match.rule;
        const selector = rule.selectorList.selectors.map(s => s.text).join(', ');
        const spec = calculateSpecificity(rule.selectorList.selectors[0].text);

        const props = {};
        for (const prop of rule.style.cssProperties) {
          props[prop.name] = {
            value: prop.value,
            important: prop.important || false
          };
        }

        let source = 'unknown';
        if (rule.origin === 'user-agent') {
          source = 'user-agent';
        } else if (rule.origin === 'user') {
          source = 'user';
        } else if (rule.styleSheetId) {
          const styleSheet = await client.send('CSS.getStyleSheetText', {
            styleSheetId: rule.styleSheetId
          }).catch(() => null);

          source = rule.origin || 'author';
          if (match.matchingSelectors) {
            source += ` (${rule.styleSheetId})`;
          }
        }

        result.cascade.push({
          type: 'rule',
          selector: selector,
          specificity: formatSpecificity(spec),
          specificityRaw: spec,
          source: source,
          sourceURL: rule.origin === 'regular' && rule.styleSheetId ? 'stylesheet' : rule.origin,
          properties: props
        });
      }
    }

    // Sort cascade by specificity (highest first)
    result.cascade.sort((a, b) => {
      // Inline styles always win
      if (a.type === 'inline') return -1;
      if (b.type === 'inline') return 1;

      // Check for !important
      const aHasImportant = Object.values(a.properties).some(p => p.important);
      const bHasImportant = Object.values(b.properties).some(p => p.important);

      if (aHasImportant && !bHasImportant) return -1;
      if (!aHasImportant && bHasImportant) return 1;

      // Compare specificity
      return -compareSpecificity(a.specificityRaw, b.specificityRaw);
    });

    result.summary.totalRules = result.cascade.length;

    // Build computed styles map
    for (const prop of computedStyle.computedStyle) {
      result.computed[prop.name] = prop.value;
    }

    // Detect conflicts
    const propertyMap = new Map();

    for (const rule of result.cascade) {
      for (const [propName, propValue] of Object.entries(rule.properties)) {
        if (!propertyMap.has(propName)) {
          propertyMap.set(propName, []);
        }
        propertyMap.get(propName).push({
          value: propValue.value,
          important: propValue.important,
          selector: rule.selector,
          specificity: rule.specificity,
          source: rule.source
        });
      }
    }

    // Find properties with conflicts
    for (const [propName, declarations] of propertyMap.entries()) {
      if (declarations.length > 1) {
        // Determine winner
        let winner = declarations[0];
        const losers = declarations.slice(1);

        result.conflicts.push({
          property: propName,
          finalValue: result.computed[propName],
          winner: winner,
          overridden: losers,
          conflictCount: declarations.length
        });
      }
    }

    result.summary.conflictingProperties = result.conflicts.length;

    // Filter by specific property if requested
    if (args.property) {
      const propFilter = args.property.toLowerCase();
      const filteredConflicts = result.conflicts.filter(c =>
        c.property.toLowerCase() === propFilter
      );

      if (filteredConflicts.length === 0) {
        result.message = `No conflicts found for property: ${args.property}`;
      } else {
        result.conflicts = filteredConflicts;
        result.summary.conflictingProperties = filteredConflicts.length;
      }
    }

    // Output results
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

debugCSS();
