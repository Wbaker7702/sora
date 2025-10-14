# Regular Expression Character Range Validation Guide

This guide addresses common issues with regular expression character ranges that can lead to unintended matches and security vulnerabilities.

## Common Problems

### 1. The Infamous `[a-zA-z]` Pattern

**Problem**: The pattern `[a-zA-z]` matches more than just letters.

```javascript
// This pattern matches:
// - All lowercase letters: a-z
// - All uppercase letters: A-Z  
// - Plus these unexpected characters: [ \ ] ^ _ `
const problematicPattern = /[a-zA-z]/;

// Test it:
console.log(problematicPattern.test('[')); // true - unexpected!
console.log(problematicPattern.test('\\')); // true - unexpected!
console.log(problematicPattern.test(']')); // true - unexpected!
console.log(problematicPattern.test('^')); // true - unexpected!
console.log(problematicPattern.test('_')); // true - unexpected!
console.log(problematicPattern.test('`')); // true - unexpected!
```

**Solution**: Use `[a-zA-Z]` (capital Z) instead:

```javascript
const correctPattern = /[a-zA-Z]/;
console.log(correctPattern.test('[')); // false - correct!
console.log(correctPattern.test('A')); // true - correct!
```

### 2. Unescaped Dash Creating Unintended Ranges

**Problem**: An unescaped dash in a character class creates a range.

```javascript
// This pattern creates an unintended range from comma to underscore
const problematicPattern = /[a-zA-Z0-9%=.,-_]/;

// The range [,-_] matches 55 characters including:
// , - . / 0 1 2 3 4 5 6 7 8 9 : ; < = > ? @ A B C D E F G H I J K L M N O P Q R S T U V W X Y Z [ \ ] ^ _
```

**Solution**: Escape the dash or move it to the beginning/end:

```javascript
// Option 1: Escape the dash
const escapedPattern = /[a-zA-Z0-9%=.,\\-_]/;

// Option 2: Move dash to the end
const movedPattern = /[a-zA-Z0-9%=.,_]/;

// Option 3: Move dash to the beginning
const beginningPattern = /[-a-zA-Z0-9%=.,_]/;
```

### 3. Invalid Ranges

**Problem**: Ranges where the end character comes before the start character.

```javascript
// This is invalid - z comes after a in ASCII
const invalidPattern = /[z-a]/; // Matches nothing
```

**Solution**: Swap the characters:

```javascript
const validPattern = /[a-z]/; // Matches a through z
```

### 4. Overlapping Ranges

**Problem**: Ranges that overlap, making the pattern inefficient.

```javascript
// These ranges overlap: a-c and b-d
const inefficientPattern = /[a-cb-d]/;
```

**Solution**: Combine the ranges:

```javascript
const efficientPattern = /[a-d]/; // Matches a through d
```

## Using the Regex Validator

The project includes a regex validator utility to help detect these issues:

```typescript
import { validateRegexPattern } from './lib/regex-validator';

// Validate a pattern
const result = validateRegexPattern('[a-zA-z]');

if (!result.isValid) {
  console.log('Issues found:');
  result.issues.forEach(issue => {
    console.log(`- ${issue.type}: ${issue.message}`);
    if (issue.suggestedFix) {
      console.log(`  Suggested fix: ${issue.suggestedFix}`);
    }
  });
  
  console.log('Suggestions:');
  result.suggestions.forEach(suggestion => {
    console.log(`- ${suggestion}`);
  });
}
```

## Safe Patterns

### Predefined Character Classes

Use predefined character classes when possible:

```javascript
// Instead of [a-zA-Z0-9_]
const wordPattern = /\w/;

// Instead of [0-9]
const digitPattern = /\d/;

// Instead of [a-zA-Z]
const letterPattern = /[a-zA-Z]/; // Still use ranges for letters
```

### Safe Range Patterns

```javascript
// Safe letter matching
const letters = /[a-zA-Z]/;

// Safe alphanumeric with escaped dash
const alphanumeric = /[a-zA-Z0-9%=.,\\-_]/;

// Safe alphanumeric with dash at end
const alphanumericEnd = /[a-zA-Z0-9._-]/;

// Safe alphanumeric with dash at beginning
const alphanumericStart = /[-a-zA-Z0-9._]/;
```

## Best Practices

1. **Always escape dashes** in character classes unless they're at the beginning or end
2. **Use predefined character classes** when possible (`\w`, `\d`, `\s`)
3. **Test your patterns** with edge cases to ensure they match only what you expect
4. **Use the validator** to check patterns before deploying
5. **Be explicit** about what characters you want to match
6. **Avoid overlapping ranges** - combine them for efficiency

## Examples from the Codebase

The sanitization utilities in this project use several regex patterns. Here's how they should be validated:

```typescript
// From sanitization.ts - these patterns are safe:

// Safe: dash at end
const safeFilename = /[^a-zA-Z0-9._-]/g;

// Safe: escaped characters
const shellMetacharacters = /[;&|`$(){}[\]\\]/g;

// Safe: control characters
const controlChars = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
```

## Running the Validator

To validate all regex patterns in your codebase:

```bash
# Run the demonstration
node -e "require('./renderer/lib/regex-validation-demo.ts')"

# Or validate specific patterns
node -e "
const { validateRegexPattern } = require('./renderer/lib/regex-validator.ts');
console.log(validateRegexPattern('[a-zA-z]'));
"
```

## Common Patterns Reference

| Pattern | Issue | Safe Alternative |
|---------|-------|------------------|
| `[a-zA-z]` | Includes `[ \ ] ^ _ `` | `[a-zA-Z]` |
| `[0-9A-z]` | Includes `[ \ ] ^ _ `` | `[0-9A-Z]` or `\w` |
| `[a-zA-Z0-9%=.,-_]` | Unescaped dash creates range | `[a-zA-Z0-9%=.,\\-_]` |
| `[z-a]` | Invalid range | `[a-z]` |
| `[a-cb-d]` | Overlapping ranges | `[a-d]` |

Remember: When in doubt, test your regex patterns with the validator to ensure they match only the characters you intend!