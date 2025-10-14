/**
 * Test suite for regex validator utility
 */

import {
  validateRegexPattern,
  validateMultiplePatterns,
  COMMON_PATTERNS
} from '../regex-validator';

describe('Regex Validator', () => {
  describe('validateRegexPattern', () => {
    describe('Problematic ranges', () => {
      test('should detect [a-zA-z] pattern issue', () => {
        const result = validateRegexPattern('[a-zA-z]');
        
        expect(result.isValid).toBe(false);
        expect(result.issues).toHaveLength(1);
        expect(result.issues[0].type).toBe('problematic_range');
        expect(result.issues[0].message).toContain('unexpected characters');
        expect(result.issues[0].message).toContain('[ \\ ] ^ _ `');
      });

      test('should detect other problematic ranges', () => {
        const result = validateRegexPattern('[0-9A-z]');
        
        expect(result.isValid).toBe(false);
        expect(result.issues.some(issue => issue.type === 'problematic_range')).toBe(true);
      });

      test('should not flag valid ranges', () => {
        const result = validateRegexPattern('[a-zA-Z]');
        
        expect(result.isValid).toBe(true);
        expect(result.issues.filter(issue => issue.type === 'problematic_range')).toHaveLength(0);
      });
    });

    describe('Unescaped dashes', () => {
      test('should detect unescaped dash in middle of character class', () => {
        const result = validateRegexPattern('[a-zA-Z0-9%=.,-_]');
        
        expect(result.issues.some(issue => issue.type === 'unescaped_dash')).toBe(true);
      });

      test('should not flag dash at beginning of character class', () => {
        const result = validateRegexPattern('[-a-zA-Z0-9]');
        
        expect(result.issues.filter(issue => issue.type === 'unescaped_dash')).toHaveLength(0);
      });

      test('should not flag dash at end of character class', () => {
        const result = validateRegexPattern('[a-zA-Z0-9-]');
        
        expect(result.issues.filter(issue => issue.type === 'unescaped_dash')).toHaveLength(0);
      });

      test('should not flag escaped dash', () => {
        const result = validateRegexPattern('[a-zA-Z0-9\\-_]');
        
        expect(result.issues.filter(issue => issue.type === 'unescaped_dash')).toHaveLength(0);
      });
    });

    describe('Invalid ranges', () => {
      test('should detect invalid range where end comes before start', () => {
        const result = validateRegexPattern('[z-a]');
        
        expect(result.issues.some(issue => issue.type === 'invalid_range')).toBe(true);
      });

      test('should not flag valid ranges', () => {
        const result = validateRegexPattern('[a-z]');
        
        expect(result.issues.filter(issue => issue.type === 'invalid_range')).toHaveLength(0);
      });
    });

    describe('Overlapping ranges', () => {
      test('should detect overlapping ranges', () => {
        const result = validateRegexPattern('[a-cb-d]');
        
        expect(result.issues.some(issue => issue.type === 'overlapping_range')).toBe(true);
      });

      test('should not flag non-overlapping ranges', () => {
        const result = validateRegexPattern('[a-cd-f]');
        
        expect(result.issues.filter(issue => issue.type === 'overlapping_range')).toHaveLength(0);
      });
    });

    describe('Complex patterns', () => {
      test('should handle multiple character classes', () => {
        const result = validateRegexPattern('[a-zA-z]\\d+[0-9A-z]');
        
        expect(result.issues.length).toBeGreaterThan(0);
        expect(result.issues.some(issue => issue.type === 'problematic_range')).toBe(true);
      });

      test('should handle nested brackets correctly', () => {
        const result = validateRegexPattern('\\[([^\\]]+)\\]');
        
        expect(result.isValid).toBe(true);
      });
    });

    describe('Suggestions', () => {
      test('should provide helpful suggestions', () => {
        const result = validateRegexPattern('[a-zA-z]');
        
        expect(result.suggestions.length).toBeGreaterThan(0);
        expect(result.suggestions.some(s => s.includes('specific character classes'))).toBe(true);
      });
    });
  });

  describe('validateMultiplePatterns', () => {
    test('should validate multiple patterns', () => {
      const patterns = ['[a-zA-z]', '[a-zA-Z]', '[0-9A-z]'];
      const results = validateMultiplePatterns(patterns);
      
      expect(results.size).toBe(3);
      expect(results.get('[a-zA-z]')?.isValid).toBe(false);
      expect(results.get('[a-zA-Z]')?.isValid).toBe(true);
      expect(results.get('[0-9A-z]')?.isValid).toBe(false);
    });
  });

  describe('Common patterns', () => {
    test('should have documented common problematic patterns', () => {
      expect(COMMON_PATTERNS.PROBLEMATIC_ALPHA.pattern).toBeDefined();
      expect(COMMON_PATTERNS.UNESCAPED_DASH.pattern).toBeDefined();
      expect(COMMON_PATTERNS.SAFE_ALPHA).toBeDefined();
      expect(COMMON_PATTERNS.SAFE_ALPHANUMERIC).toBeDefined();
    });
  });

  describe('Edge cases', () => {
    test('should handle empty character class', () => {
      const result = validateRegexPattern('[]');
      
      expect(result.isValid).toBe(true);
    });

    test('should handle single character class', () => {
      const result = validateRegexPattern('[a]');
      
      expect(result.isValid).toBe(true);
    });

    test('should handle character class with only dashes', () => {
      const result = validateRegexPattern('[-]');
      
      expect(result.isValid).toBe(true);
    });

    test('should handle escaped characters correctly', () => {
      const result = validateRegexPattern('[\\[\\]\\\\]');
      
      expect(result.isValid).toBe(true);
    });

    test('should handle unicode characters', () => {
      const result = validateRegexPattern('[α-ω]');
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('Real-world examples', () => {
    test('should validate sanitization patterns from the codebase', () => {
      // Test patterns from sanitization.ts
      const patterns = [
        '/[^a-zA-Z0-9._-]/g',  // createSafeFilename
        '/[;&|`$(){}[\\]\\\\]/g',  // sanitizeCommandText
        '/[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]/g'  // sanitizeCommandOutput
      ];

      for (const pattern of patterns) {
        const result = validateRegexPattern(pattern);
        // These patterns should be valid
        expect(result.isValid).toBe(true);
      }
    });

    test('should catch common mistakes', () => {
      const problematicPatterns = [
        '[a-zA-z]',  // Common mistake
        '[0-9A-z]',  // Another common mistake
        '[a-zA-Z0-9%=.,-_]',  // Unescaped dash
        '[z-a]',  // Invalid range
        '[a-cb-d]'  // Overlapping ranges
      ];

      for (const pattern of problematicPatterns) {
        const result = validateRegexPattern(pattern);
        expect(result.isValid).toBe(false);
        expect(result.issues.length).toBeGreaterThan(0);
      }
    });
  });
});