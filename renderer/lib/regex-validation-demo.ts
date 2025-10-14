/**
 * Demonstration of regex validation issues and solutions
 * 
 * This file shows common regex character range problems and how to fix them
 */

import { validateRegexPattern, COMMON_PATTERNS } from './regex-validator';

// Example problematic patterns from the codebase and common mistakes
const problematicPatterns = [
  {
    name: 'The infamous [a-zA-z] pattern',
    pattern: '[a-zA-z]',
    description: 'This pattern matches more than just letters - it includes [ \\ ] ^ _ ` characters',
    expected: 'Should only match letters a-z and A-Z'
  },
  {
    name: 'Unescaped dash creating unintended range',
    pattern: '[a-zA-Z0-9%=.,-_]',
    description: 'The dash creates a range from comma to underscore, matching 55 characters',
    expected: 'Should match alphanumeric characters and specific symbols'
  },
  {
    name: 'Invalid range (end before start)',
    pattern: '[z-a]',
    description: 'This range is invalid because z comes after a in ASCII',
    expected: 'Should be [a-z]'
  },
  {
    name: 'Overlapping ranges',
    pattern: '[a-cb-d]',
    description: 'Ranges a-c and b-d overlap, making the pattern inefficient',
    expected: 'Should be [a-d]'
  }
];

// Safe alternatives
const safePatterns = [
  {
    name: 'Safe letter matching',
    pattern: '[a-zA-Z]',
    description: 'Correctly matches only letters'
  },
  {
    name: 'Safe alphanumeric with escaped dash',
    pattern: '[a-zA-Z0-9%=.,\\-_]',
    description: 'Dash is properly escaped'
  },
  {
    name: 'Using predefined character classes',
    pattern: '\\w',
    description: 'Matches word characters (letters, digits, underscore)'
  },
  {
    name: 'Combined safe pattern',
    pattern: '[a-zA-Z0-9._-]',
    description: 'Dash at the end is safe'
  }
];

/**
 * Demonstrates regex validation for problematic patterns
 */
export function demonstrateRegexIssues(): void {
  console.log('=== REGEX CHARACTER RANGE VALIDATION DEMO ===\n');
  
  console.log('🚨 PROBLEMATIC PATTERNS:\n');
  
  problematicPatterns.forEach((example, index) => {
    console.log(`${index + 1}. ${example.name}`);
    console.log(`   Pattern: ${example.pattern}`);
    console.log(`   Issue: ${example.description}`);
    console.log(`   Expected: ${example.expected}`);
    
    const result = validateRegexPattern(example.pattern);
    console.log(`   Validation: ${result.isValid ? '✅ Valid' : '❌ Invalid'}`);
    
    if (result.issues.length > 0) {
      console.log('   Issues found:');
      result.issues.forEach(issue => {
        console.log(`     - ${issue.type}: ${issue.message}`);
        if (issue.suggestedFix) {
          console.log(`       Suggested fix: ${issue.suggestedFix}`);
        }
      });
    }
    
    if (result.suggestions.length > 0) {
      console.log('   Suggestions:');
      result.suggestions.forEach(suggestion => {
        console.log(`     - ${suggestion}`);
      });
    }
    
    console.log('');
  });
  
  console.log('✅ SAFE PATTERNS:\n');
  
  safePatterns.forEach((example, index) => {
    console.log(`${index + 1}. ${example.name}`);
    console.log(`   Pattern: ${example.pattern}`);
    console.log(`   Description: ${example.description}`);
    
    const result = validateRegexPattern(example.pattern);
    console.log(`   Validation: ${result.isValid ? '✅ Valid' : '❌ Invalid'}`);
    console.log('');
  });
}

/**
 * Validates patterns from the existing sanitization.ts file
 */
export function validateSanitizationPatterns(): void {
  console.log('=== VALIDATING EXISTING SANITIZATION PATTERNS ===\n');
  
  const sanitizationPatterns = [
    {
      name: 'createSafeFilename - alphanumeric and safe chars',
      pattern: '[^a-zA-Z0-9._-]',
      context: 'Used to replace non-alphanumeric characters with underscore'
    },
    {
      name: 'sanitizeCommandText - shell metacharacters',
      pattern: '[;&|`$(){}[\\]\\\\]',
      context: 'Used to remove dangerous shell metacharacters'
    },
    {
      name: 'sanitizeCommandOutput - control characters',
      pattern: '[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]',
      context: 'Used to remove control characters'
    },
    {
      name: 'escapeHtml - HTML special characters',
      pattern: '[&<>"\'/]',
      context: 'Used to escape HTML special characters'
    }
  ];
  
  sanitizationPatterns.forEach((pattern, index) => {
    console.log(`${index + 1}. ${pattern.name}`);
    console.log(`   Pattern: ${pattern.pattern}`);
    console.log(`   Context: ${pattern.context}`);
    
    const result = validateRegexPattern(pattern.pattern);
    console.log(`   Validation: ${result.isValid ? '✅ Valid' : '❌ Invalid'}`);
    
    if (result.issues.length > 0) {
      console.log('   Issues found:');
      result.issues.forEach(issue => {
        console.log(`     - ${issue.type}: ${issue.message}`);
      });
    }
    
    console.log('');
  });
}

/**
 * Shows how to use the validator in your code
 */
export function showUsageExamples(): void {
  console.log('=== USAGE EXAMPLES ===\n');
  
  console.log('1. Basic validation:');
  console.log('   const result = validateRegexPattern("[a-zA-z]");');
  console.log('   if (!result.isValid) {');
  console.log('     console.log("Issues found:", result.issues);');
  console.log('   }');
  console.log('');
  
  console.log('2. Validate multiple patterns:');
  console.log('   const patterns = ["[a-zA-z]", "[0-9A-z]"];');
  console.log('   const results = validateMultiplePatterns(patterns);');
  console.log('   results.forEach((result, pattern) => {');
  console.log('     console.log(`${pattern}: ${result.isValid ? "valid" : "invalid"}`);');
  console.log('   });');
  console.log('');
  
  console.log('3. Using common patterns:');
  console.log('   // Instead of [a-zA-z] (problematic)');
  console.log('   const safePattern = COMMON_PATTERNS.SAFE_ALPHA;');
  console.log('   // Or use predefined character classes');
  console.log('   const wordPattern = /\\w/;  // matches [a-zA-Z0-9_]');
  console.log('');
}

// Run the demonstration if this file is executed directly
if (require.main === module) {
  demonstrateRegexIssues();
  validateSanitizationPatterns();
  showUsageExamples();
}