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

  const normalizedPattern = normalizePattern(regexPattern);
  const characterClasses = extractCharacterClasses(normalizedPattern);

  for (const charClass of characterClasses) {
    const rangeIssues = validateCharacterClass(charClass.content, charClass.start);
    issues.push(...rangeIssues);
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

function normalizePattern(pattern: string): string {
  if (!pattern) {
    return '';
  }

  const trimmed = pattern.trim();

  if (!trimmed.startsWith('/')) {
    return trimmed;
  }

  for (let i = trimmed.length - 1; i > 0; i--) {
    if (trimmed[i] === '/' && !isCharEscaped(trimmed, i)) {
      return trimmed.slice(1, i);
    }
  }

  return trimmed;
}

function extractCharacterClasses(pattern: string): Array<{ content: string; start: number; end: number }> {
  const classes: Array<{ content: string; start: number; end: number }> = [];

  let inClass = false;
  let buffer = '';
  let classStart = -1;

  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];

    if (!inClass) {
      if (char === '[') {
        inClass = true;
        classStart = i;
        buffer = '';
      }
      continue;
    }

    if (char === '\\') {
      if (i + 1 < pattern.length) {
        buffer += char + pattern[i + 1];
        i += 1;
      }
      continue;
    }

    if (char === ']') {
      classes.push({ content: buffer, start: classStart, end: i + 1 });
      inClass = false;
      buffer = '';
      classStart = -1;
      continue;
    }

    buffer += char;
  }

  return classes;
}

interface CharacterClassToken {
  value: string;
  start: number;
  end: number;
  isEscaped: boolean;
}

function tokenizeCharacterClass(content: string): CharacterClassToken[] {
  const tokens: CharacterClassToken[] = [];

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (char === '\\') {
      if (i + 1 >= content.length) {
        tokens.push({ value: '\\', start: i, end: i + 1, isEscaped: true });
        continue;
      }

      const next = content[i + 1];

      if (next === 'x' && i + 3 < content.length && isHexDigit(content[i + 2]) && isHexDigit(content[i + 3])) {
        const value = content.slice(i, i + 4);
        tokens.push({ value, start: i, end: i + 4, isEscaped: true });
        i += 3;
        continue;
      }

      if (next === 'u' && i + 5 < content.length && isHexDigit(content[i + 2]) && isHexDigit(content[i + 3]) && isHexDigit(content[i + 4]) && isHexDigit(content[i + 5])) {
        const value = content.slice(i, i + 6);
        tokens.push({ value, start: i, end: i + 6, isEscaped: true });
        i += 5;
        continue;
      }

      const value = char + next;
      tokens.push({ value, start: i, end: i + 2, isEscaped: true });
      i += 1;
      continue;
    }

    tokens.push({ value: char, start: i, end: i + 1, isEscaped: false });
  }

  return tokens;
}

function isHexDigit(char: string): boolean {
  return /[0-9a-fA-F]/.test(char);
}

function tokenToChar(token: CharacterClassToken): string | null {
  if (!token) {
    return null;
  }

  if (!token.isEscaped) {
    return token.value;
  }

  if (token.value.startsWith('\\x') && token.value.length === 4) {
    const code = Number.parseInt(token.value.slice(2), 16);
    if (!Number.isNaN(code)) {
      return String.fromCharCode(code);
    }
  }

  if (token.value.startsWith('\\u') && token.value.length === 6) {
    const code = Number.parseInt(token.value.slice(2), 16);
    if (!Number.isNaN(code)) {
      return String.fromCharCode(code);
    }
  }

  if (token.value.length === 2) {
    const escapeChar = token.value[1];
    switch (escapeChar) {
      case 'n': return '\n';
      case 't': return '\t';
      case 'r': return '\r';
      case 'b': return '\b';
      case 'f': return '\f';
      case 'v': return '\v';
      case '0': return '\0';
      default: return escapeChar;
    }
  }

  return token.value[token.value.length - 1] ?? null;
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
        message: `Range [${range.start}-${range.end}] includes unexpected characters: ${problematicChars.join(' ')}`,
        position: { start: offset + range.startPos, end: offset + range.endPos },
        severity: 'error',
        suggestedFix: `Consider using [${range.start}${escapeForRegex(String.fromCharCode(range.start.charCodeAt(0) + 1))}-${range.end}] or [${range.start}${escapeForRegex(String.fromCharCode(range.end.charCodeAt(0) - 1))}${range.end}]`
      });
    }
    
    // Check for invalid ranges (end before start)
    if (range.start.charCodeAt(0) > range.end.charCodeAt(0)) {
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
      severity: 'error',
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
      severity: 'error',
      suggestedFix: `Consider combining ranges: [${overlap.suggested}]`
    });
  }

  return issues;
}

function isCharEscaped(content: string, index: number): boolean {
  let backslashCount = 0;
  let cursor = index - 1;

  while (cursor >= 0 && content[cursor] === '\\') {
    backslashCount += 1;
    cursor -= 1;
  }

  return backslashCount % 2 === 1;
}

function isAlphanumericOrLetter(char: string): boolean {
  if (!char) {
    return false;
  }

  const code = char.charCodeAt(0);

  if (code >= 48 && code <= 57) {
    return true; // digits
  }

  const lower = char.toLowerCase();
  const upper = char.toUpperCase();

  return lower !== upper;
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
  const tokens = tokenizeCharacterClass(content);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.value === '-' && !token.isEscaped && i > 0 && i < tokens.length - 1) {
      const prevToken = tokens[i - 1];
      const nextToken = tokens[i + 1];

      const startChar = tokenToChar(prevToken);
      const endChar = tokenToChar(nextToken);

      const isAlphanumericRange = startChar !== null && endChar !== null && isAlphanumericOrLetter(startChar) && isAlphanumericOrLetter(endChar);
      const isEscapeRange = prevToken.isEscaped || nextToken.isEscaped;

      if ((isAlphanumericRange || isEscapeRange) && startChar !== null && endChar !== null) {
        const rangeChars = getCharacterRange(startChar, endChar);
        ranges.push({
          start: startChar,
          end: endChar,
          characters: rangeChars,
          startPos: prevToken.start,
          endPos: nextToken.end - 1,
          isEscaped: false
        });
      } else {
        unescapedDashes.push({ position: token.start });
      }
    }
  }

  return { ranges, unescapedDashes };
}

/**
 * Checks if a character range is valid (start <= end)
 */
function isValidRange(start: string, end: string): boolean {
  if (!start || !end) {
    return false;
  }

  return start.charCodeAt(0) <= end.charCodeAt(0);
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
  const start1 = range1.start.charCodeAt(0);
  const end1 = range1.end.charCodeAt(0);
  const start2 = range2.start.charCodeAt(0);
  const end2 = range2.end.charCodeAt(0);

  if (start1 > end1 || start2 > end2) {
    return false;
  }

  const overlaps = start1 <= end2 && start2 <= end1;
  const containment = (start1 >= start2 && end1 <= end2) || (start2 >= start1 && end2 <= end1);

  return overlaps && !containment;
}

/**
 * Combines two overlapping ranges
 */
function combineRanges(range1: {start: string, end: string}, range2: {start: string, end: string}): string {
  const startCode = Math.min(range1.start.charCodeAt(0), range2.start.charCodeAt(0));
  const endCode = Math.max(range1.end.charCodeAt(0), range2.end.charCodeAt(0));
  return `${String.fromCharCode(startCode)}-${String.fromCharCode(endCode)}`;
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
    pattern: /[a-zA-Z0-9%=.,\-_]/,
    issue: 'Dash creates unintended range from , to _',
    fix: /[a-zA-Z0-9%=.,\-_]/
  },
  
  // Safe alternatives
  SAFE_ALPHA: /[a-zA-Z]/,
  SAFE_ALPHANUMERIC: /[a-zA-Z0-9]/,
  SAFE_WORD_CHARS: /\w/,
  SAFE_DIGITS: /\d/
};