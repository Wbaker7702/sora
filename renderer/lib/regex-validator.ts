/**
 * Regular Expression Character Range Validator
 * 
 * This utility helps detect and prevent common regex character range issues:
 * 1. Ranges that match more characters than intended (e.g., [a-zA-z] includes [ \ ] ^ _ `)
 * 2. Unescaped dashes that create unintended ranges (e.g., [a-zA-Z0-9%=.,-_])
 * 3. Overlapping ranges that may cause confusion
 */

export interface RegexValidationResult {
  isValid: boolean;
  issues: RegexIssue[];
  suggestions: string[];
}

export interface RegexIssue {
  type: 'problematic_range' | 'unescaped_dash' | 'overlapping_range' | 'invalid_range';
  message: string;
  position: { start: number; end: number };
  severity: 'error' | 'warning';
  suggestedFix?: string;
}

/**
 * Validates a regular expression for common character range issues
 * @param regexPattern - The regex pattern to validate
 * @returns Validation result with issues and suggestions
 */
export function validateRegexPattern(regexPattern: string): RegexValidationResult {
  const issues: RegexIssue[] = [];
  const suggestions: string[] = [];

  // Find all character classes in the pattern
  const characterClassRegex = /\[([^\]]*)\]/g;
  let match;
  let patternIndex = 0;

  while ((match = characterClassRegex.exec(regexPattern)) !== null) {
    const fullMatch = match[0];
    const content = match[1];
    const startPos = match.index;
    const endPos = startPos + fullMatch.length;

    // Check for problematic ranges
    const rangeIssues = validateCharacterClass(content, startPos);
    issues.push(...rangeIssues);

    patternIndex = endPos;
  }

  // Generate suggestions based on issues found
  if (issues.length > 0) {
    suggestions.push(...generateSuggestions(issues));
  }

  return {
    isValid: issues.filter(issue => issue.severity === 'error').length === 0,
    issues,
    suggestions
  };
}

/**
 * Validates a single character class for issues
 * @param content - The content inside the character class brackets
 * @param offset - The offset position in the original pattern
 * @returns Array of issues found
 */
function validateCharacterClass(content: string, offset: number): RegexIssue[] {
  const issues: RegexIssue[] = [];
  
  // Parse the character class to identify ranges and escaped characters
  const parsed = parseCharacterClass(content);
  
  // Check for problematic ranges
  for (const range of parsed.ranges) {
    if (range.isEscaped) continue; // Skip escaped ranges
    
    const problematicChars = findProblematicCharacters(range.characters);
    
    if (problematicChars.length > 0) {
      issues.push({
        type: 'problematic_range',
        message: `Range [${range.start}-${range.end}] includes unexpected characters: ${problematicChars.join(', ')}`,
        position: { start: offset + range.startPos, end: offset + range.endPos },
        severity: 'error',
        suggestedFix: `Consider using [${range.start}${escapeForRegex(String.fromCharCode(range.start.charCodeAt(0) + 1))}-${range.end}] or [${range.start}${escapeForRegex(String.fromCharCode(range.end.charCodeAt(0) - 1))}${range.end}]`
      });
    }
    
    // Check for invalid ranges (end before start)
    if (range.start > range.end) {
      issues.push({
        type: 'invalid_range',
        message: `Invalid range: ${range.start}-${range.end} (end character comes before start)`,
        position: { start: offset + range.startPos, end: offset + range.endPos },
        severity: 'error',
        suggestedFix: `Swap the characters: [${range.end}-${range.start}]`
      });
    }
  }
  
  // Check for unescaped dashes that create ranges
  for (const dash of parsed.unescapedDashes) {
    issues.push({
      type: 'unescaped_dash',
      message: `Unescaped dash at position ${dash.position + 1} may create unintended range`,
      position: { start: offset + dash.position, end: offset + dash.position + 1 },
      severity: 'warning',
      suggestedFix: `Escape the dash: \\- or move it to the beginning/end of the character class`
    });
  }
  
  // Check for overlapping ranges
  const overlappingRanges = findOverlappingRanges(parsed.ranges.filter(r => !r.isEscaped));
  
  for (const overlap of overlappingRanges) {
    issues.push({
      type: 'overlapping_range',
      message: `Overlapping ranges detected: ${overlap.range1} and ${overlap.range2}`,
      position: { start: offset, end: offset + content.length },
      severity: 'warning',
      suggestedFix: `Consider combining ranges: [${overlap.suggested}]`
    });
  }

  return issues;
}

/**
 * Parses a character class to identify ranges and escaped characters
 */
function parseCharacterClass(content: string): {
  ranges: Array<{
    start: string;
    end: string;
    characters: string[];
    startPos: number;
    endPos: number;
    isEscaped: boolean;
  }>;
  unescapedDashes: Array<{ position: number }>;
} {
  const ranges: Array<{
    start: string;
    end: string;
    characters: string[];
    startPos: number;
    endPos: number;
    isEscaped: boolean;
  }> = [];
  const unescapedDashes: Array<{ position: number }> = [];
  
  let i = 0;
  while (i < content.length) {
    const char = content[i];
    
    // Check for escaped character
    if (char === '\\') {
      i += 2; // Skip the backslash and the next character
      continue;
    }
    
    // Check for dash that might create a range
    if (char === '-' && i > 0 && i < content.length - 1) {
      const prevChar = content[i - 1];
      const nextChar = content[i + 1];
      
      // Check if the previous character is escaped
      const isPrevEscaped = i > 1 && content[i - 2] === '\\';
      
      if (isPrevEscaped) {
        // This dash is escaped, so it's not creating a range
        // Don't add to unescapedDashes since it's intentionally escaped
      } else if (isValidRange(prevChar, nextChar)) {
        const rangeChars = getCharacterRange(prevChar, nextChar);
        ranges.push({
          start: prevChar,
          end: nextChar,
          characters: rangeChars,
          startPos: i - 1,
          endPos: i + 1,
          isEscaped: false
        });
      } else {
        unescapedDashes.push({ position: i });
      }
    }
    
    i++;
  }
  
  return { ranges, unescapedDashes };
}

/**
 * Checks if a character range is valid (start <= end)
 */
function isValidRange(start: string, end: string): boolean {
  return start <= end;
}

/**
 * Gets all characters in a range
 */
function getCharacterRange(start: string, end: string): string[] {
  const chars: string[] = [];
  const startCode = start.charCodeAt(0);
  const endCode = end.charCodeAt(0);
  
  for (let i = startCode; i <= endCode; i++) {
    chars.push(String.fromCharCode(i));
  }
  
  return chars;
}

/**
 * Finds characters that might be unexpected in common ranges
 */
function findProblematicCharacters(range: string[]): string[] {
  const problematic: string[] = [];
  
  for (const char of range) {
    const code = char.charCodeAt(0);
    
    // Check for characters that are often unexpected in common ranges
    if (
      // ASCII control characters (0-31)
      (code >= 0 && code <= 31) ||
      // Common problematic characters in ranges
      char === '[' || char === ']' || char === '^' || char === '_' || char === '`' ||
      char === '\\' || char === '|' || char === '{' || char === '}' ||
      char === '(' || char === ')' || char === '+' || char === '*' ||
      char === '?' || char === '.' || char === '$'
    ) {
      problematic.push(char);
    }
  }
  
  return problematic;
}

/**
 * Extracts all ranges from a character class
 */
function extractRanges(content: string): Array<{start: string, end: string, startPos: number, endPos: number}> {
  const ranges: Array<{start: string, end: string, startPos: number, endPos: number}> = [];
  let i = 0;
  
  while (i < content.length) {
    if (content[i] === '-' && i > 0 && i < content.length - 1) {
      const prevChar = content[i - 1];
      const nextChar = content[i + 1];
      
      if (prevChar !== '\\') {
        ranges.push({
          start: prevChar,
          end: nextChar,
          startPos: i - 1,
          endPos: i + 1
        });
      }
    }
    i++;
  }
  
  return ranges;
}

/**
 * Finds overlapping ranges
 */
function findOverlappingRanges(ranges: Array<{start: string, end: string, startPos: number, endPos: number}>): Array<{range1: string, range2: string, suggested: string}> {
  const overlaps: Array<{range1: string, range2: string, suggested: string}> = [];
  
  for (let i = 0; i < ranges.length; i++) {
    for (let j = i + 1; j < ranges.length; j++) {
      const range1 = ranges[i];
      const range2 = ranges[j];
      
      if (rangesOverlap(range1, range2)) {
        const combined = combineRanges(range1, range2);
        overlaps.push({
          range1: `${range1.start}-${range1.end}`,
          range2: `${range2.start}-${range2.end}`,
          suggested: combined
        });
      }
    }
  }
  
  return overlaps;
}

/**
 * Checks if two ranges overlap
 */
function rangesOverlap(range1: {start: string, end: string}, range2: {start: string, end: string}): boolean {
  return range1.start <= range2.end && range2.start <= range1.end;
}

/**
 * Combines two overlapping ranges
 */
function combineRanges(range1: {start: string, end: string}, range2: {start: string, end: string}): string {
  const start = range1.start < range2.start ? range1.start : range2.start;
  const end = range1.end > range2.end ? range1.end : range2.end;
  return `${start}-${end}`;
}

/**
 * Escapes a character for use in regex
 */
function escapeForRegex(char: string): string {
  return char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Generates suggestions based on found issues
 */
function generateSuggestions(issues: RegexIssue[]): string[] {
  const suggestions: string[] = [];
  
  if (issues.some(issue => issue.type === 'problematic_range')) {
    suggestions.push('Consider using more specific character classes like \\w, \\d, \\s instead of ranges when possible');
  }
  
  if (issues.some(issue => issue.type === 'unescaped_dash')) {
    suggestions.push('Always escape dashes in character classes unless they are at the beginning or end');
  }
  
  if (issues.some(issue => issue.type === 'overlapping_range')) {
    suggestions.push('Combine overlapping ranges to make your regex more efficient and clearer');
  }
  
  return suggestions;
}

/**
 * Validates all regex patterns in a file or codebase
 * @param patterns - Array of regex patterns to validate
 * @returns Map of pattern to validation results
 */
export function validateMultiplePatterns(patterns: string[]): Map<string, RegexValidationResult> {
  const results = new Map<string, RegexValidationResult>();
  
  for (const pattern of patterns) {
    results.set(pattern, validateRegexPattern(pattern));
  }
  
  return results;
}

/**
 * Common problematic patterns and their fixes
 */
export const COMMON_PATTERNS = {
  // The infamous [a-zA-z] pattern
  PROBLEMATIC_ALPHA: {
    pattern: /[a-zA-Z]/,
    issue: 'Includes unexpected characters: [ \\ ] ^ _ `',
    fix: /[a-zA-Z]/
  },
  
  // Unescaped dash in character class
  UNESCAPED_DASH: {
    pattern: /[a-zA-Z0-9%=.,-_]/,
    issue: 'Dash creates unintended range from , to _',
    fix: /[a-zA-Z0-9%=.,\-_]/
  },
  
  // Safe alternatives
  SAFE_ALPHA: /[a-zA-Z]/,
  SAFE_ALPHANUMERIC: /[a-zA-Z0-9]/,
  SAFE_WORD_CHARS: /\w/,
  SAFE_DIGITS: /\d/
};