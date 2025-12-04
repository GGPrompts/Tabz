# CSS Debugging Guide

Two powerful scripts for debugging CSS conflicts and understanding the cascade.

## Quick Start

```bash
cd .claude/skills/chrome-devtools/scripts

# Find all elements with CSS conflicts on a page
node css-conflicts.js --url https://yoursite.com

# Debug specific element's CSS cascade
node css-debug.js --url https://yoursite.com --selector ".problem-element"
```

---

## 1. CSS Conflict Finder (`css-conflicts.js`)

**Purpose:** Scan an entire page and find elements with CSS conflicts

### Basic Usage

```bash
# Scan entire page for conflicts
node css-conflicts.js --url https://yoursite.com

# Focus on specific area
node css-conflicts.js --url https://yoursite.com --selector ".main-content *"

# Only show elements with many rules
node css-conflicts.js --url https://yoursite.com --min-rules 5

# Check specific properties only
node css-conflicts.js --url https://yoursite.com --properties "display,position,z-index"
```

### Output

```json
{
  "success": true,
  "url": "https://yoursite.com",
  "summary": {
    "elementsScanned": 245,
    "elementsWithConflicts": 12,
    "totalConflicts": 47
  },
  "elements": [
    {
      "selector": ".nav-item.active",
      "tag": "li",
      "classes": ["nav-item", "active"],
      "position": {
        "top": 120,
        "left": 50,
        "width": 200,
        "height": 40
      },
      "totalRules": 8,
      "conflictingProperties": 5,
      "conflicts": [
        {
          "property": "color",
          "ruleCount": 3,
          "declarations": [
            {
              "selector": ".nav-item",
              "value": "#333",
              "important": false
            },
            {
              "selector": ".active",
              "value": "#007bff",
              "important": false
            },
            {
              "selector": "li.nav-item.active",
              "value": "#0056b3",
              "important": true
            }
          ],
          "computedValue": "#0056b3"
        }
      ]
    }
  ]
}
```

### Options

- `--url` - Target URL (required)
- `--selector` - Limit scan to specific elements (default: `*`)
- `--min-rules` - Minimum matching rules to report (default: 3)
- `--properties` - Filter by specific properties (comma-separated)
- `--output` - Save results to JSON file
- `--headless` - Run headlessly (default: true, use `false` to see browser)

---

## 2. CSS Cascade Debugger (`css-debug.js`)

**Purpose:** Deep dive into a specific element's CSS cascade

### Basic Usage

```bash
# Debug specific element
node css-debug.js --url https://yoursite.com --selector ".my-button"

# Focus on one property
node css-debug.js --url https://yoursite.com --selector "#header" --property "display"

# Save detailed report
node css-debug.js --url https://yoursite.com --selector ".card" --output debug-report.json
```

### Output

```json
{
  "success": true,
  "url": "https://yoursite.com",
  "selector": ".my-button",
  "element": {
    "tag": "button",
    "id": "submit-btn",
    "classes": ["my-button", "primary"]
  },
  "cascade": [
    {
      "type": "inline",
      "selector": "style attribute",
      "specificity": "(1,0,0,0)",
      "source": "inline",
      "properties": {
        "background-color": {
          "value": "red",
          "important": true
        }
      }
    },
    {
      "type": "rule",
      "selector": "#submit-btn.my-button",
      "specificity": "(0,1,1,0)",
      "source": "author",
      "properties": {
        "background-color": {
          "value": "blue",
          "important": false
        },
        "color": {
          "value": "white",
          "important": false
        }
      }
    },
    {
      "type": "rule",
      "selector": ".my-button",
      "specificity": "(0,0,1,0)",
      "source": "author",
      "properties": {
        "padding": {
          "value": "10px 20px",
          "important": false
        },
        "background-color": {
          "value": "gray",
          "important": false
        }
      }
    }
  ],
  "conflicts": [
    {
      "property": "background-color",
      "finalValue": "red",
      "winner": {
        "value": "red",
        "important": true,
        "selector": "style attribute",
        "specificity": "(1,0,0,0)",
        "source": "inline"
      },
      "overridden": [
        {
          "value": "blue",
          "important": false,
          "selector": "#submit-btn.my-button",
          "specificity": "(0,1,1,0)",
          "source": "author"
        },
        {
          "value": "gray",
          "important": false,
          "selector": ".my-button",
          "specificity": "(0,0,1,0)",
          "source": "author"
        }
      ],
      "conflictCount": 3
    }
  ],
  "summary": {
    "totalRules": 3,
    "conflictingProperties": 1
  }
}
```

### Options

- `--url` - Target URL (required)
- `--selector` - CSS selector for element (required)
- `--property` - Focus on specific property (optional)
- `--output` - Save results to JSON file
- `--headless` - Run headlessly (default: true)

---

## Understanding the Output

### Specificity Format

`(inline, ids, classes/attrs/pseudo, elements)`

Examples:
- `(1,0,0,0)` - Inline style (highest)
- `(0,2,1,0)` - `#id1 #id2 .class`
- `(0,1,2,1)` - `#id .class1.class2 div`
- `(0,0,1,0)` - `.class`

**Higher specificity wins!** Ties are broken by source order (last wins).

### Cascade Order (from highest to lowest priority)

1. **Inline styles with `!important`**
2. **Author styles with `!important`**
3. **Inline styles**
4. **Author styles** (your CSS)
5. **User styles** (browser extensions)
6. **Browser defaults** (user-agent)

---

## Real-World Workflows

### 1. "Why isn't my CSS applying?"

```bash
# First, find which element is the problem
node css-conflicts.js --url http://localhost:3000

# Then debug the specific element
node css-debug.js --url http://localhost:3000 --selector ".problem-element"
```

Look for:
- Inline styles overriding your CSS
- `!important` flags
- Higher specificity selectors
- Typos in property names

### 2. "Why is this element positioned weirdly?"

```bash
node css-debug.js --url https://yoursite.com \
  --selector ".weird-element" \
  --property "position"
```

Check if multiple rules are setting position/top/left/z-index.

### 3. "Find all z-index conflicts"

```bash
node css-conflicts.js --url https://yoursite.com \
  --properties "z-index" \
  --output z-index-report.json
```

### 4. "My button color is wrong"

```bash
node css-debug.js --url https://yoursite.com \
  --selector "#my-button" \
  --property "color"
```

### 5. "Layout issues in specific section"

```bash
node css-conflicts.js --url https://yoursite.com \
  --selector ".main-content *" \
  --properties "display,float,position,width,height"
```

---

## Tips for Fixing CSS Conflicts

### When inline styles are winning:
```javascript
// Bad: fighting with !important
.my-class {
  color: red !important; /* Don't do this */
}

// Good: remove the inline style or use JavaScript
element.style.color = ''; // Clear inline style
```

### When specificity is the problem:
```css
/* Instead of fighting with more specific selectors... */
#container .list .item.active {
  color: blue !important; /* Bad */
}

/* ...increase specificity naturally */
.list .item.active.item {
  color: blue; /* Repeating class increases specificity */
}

/* Or use :where() to reset specificity */
:where(#container .list) .item.active {
  color: blue; /* Lower specificity */
}
```

### When order matters:
Move your CSS file **after** conflicting stylesheets in HTML:
```html
<!-- Ensure your styles load last -->
<link rel="stylesheet" href="bootstrap.css">
<link rel="stylesheet" href="your-styles.css"> <!-- This wins ties -->
```

---

## Integration with Claude

Ask Claude to:
```
"Run css-conflicts.js on my site and show me the top 5 most problematic elements"

"Debug the CSS cascade for .header-nav and explain why my color isn't applying"

"Find all z-index conflicts in the modal section"

"Analyze the CSS for #submit-button and suggest how to fix the styling"
```

---

## Troubleshooting

**"Element not found"**
- Use `node snapshot.js --url <url>` first to find the correct selector
- Try using ID or simpler selector
- Element might be dynamically loaded - increase `--wait-until` time

**"Empty results"**
- Try `--headless false` to see what the browser sees
- Check if page requires authentication
- Some styles may be in shadow DOM (not accessible)

**"CORS errors in output"**
- External stylesheets from other domains can't be read
- This is normal - the script handles it gracefully
- You'll still see computed values

---

## Advanced: Custom Analysis

You can pipe the JSON output to `jq` for custom queries:

```bash
# Find elements with the most conflicts
node css-conflicts.js --url https://site.com | \
  jq '.elements | sort_by(.conflictingProperties) | reverse | .[0:5]'

# Extract only color conflicts
node css-debug.js --url https://site.com --selector ".btn" | \
  jq '.conflicts[] | select(.property | contains("color"))'

# Get all selectors affecting an element
node css-debug.js --url https://site.com --selector ".item" | \
  jq '.cascade[].selector'
```
