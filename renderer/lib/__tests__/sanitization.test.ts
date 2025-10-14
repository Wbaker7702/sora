/**
 * Test suite for sanitization utilities
 */

import {
  escapeHtml,
  escapeShellArg,
  escapeJson,
  sanitizeFilePath,
  sanitizeCommandOutput,
  safeRemoveQuotes,
  safeReplaceNewlines,
  validateAndSanitizeInput,
  sanitizeCommandText,
  validateFileExtension,
  createSafeFilename
} from '../sanitization';

describe('Sanitization Utilities', () => {
  describe('escapeHtml', () => {
    test('should escape HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      expect(escapeHtml('&<>"\'/')).toBe('&amp;&lt;&gt;&quot;&#x27;&#x2F;');
    });

    test('should handle empty and non-string inputs', () => {
      expect(escapeHtml('')).toBe('');
      expect(escapeHtml(null as any)).toBe('');
      expect(escapeHtml(undefined as any)).toBe('');
    });
  });

  describe('escapeShellArg', () => {
    test('should escape shell arguments', () => {
      expect(escapeShellArg("hello world")).toBe("'hello world'");
      expect(escapeShellArg("it's a test")).toBe("'it'\"'\"'s a test'");
    });
  });

  describe('escapeJson', () => {
    test('should escape JSON special characters', () => {
      expect(escapeJson('hello\nworld\t"test"')).toBe('hello\\nworld\\t\\"test\\"');
      expect(escapeJson('back\\slash')).toBe('back\\\\slash');
    });
  });

  describe('sanitizeFilePath', () => {
    test('should prevent directory traversal', () => {
      expect(sanitizeFilePath('../../../etc/passwd')).toBe('etc/passwd');
      expect(sanitizeFilePath('/etc/passwd')).toBe('etc/passwd');
      expect(sanitizeFilePath('normal/path/file.txt')).toBe('normal/path/file.txt');
    });

    test('should handle dangerous patterns', () => {
      expect(sanitizeFilePath('..')).toBe('');
      expect(sanitizeFilePath('/..')).toBe('');
      expect(sanitizeFilePath('path/..')).toBe('path/');
    });
  });

  describe('sanitizeCommandOutput', () => {
    test('should remove control characters and ANSI codes', () => {
      expect(sanitizeCommandOutput('\x1b[32mHello\x1b[0m World\x00')).toBe('Hello World');
      expect(sanitizeCommandOutput('Normal text')).toBe('Normal text');
    });
  });

  describe('safeRemoveQuotes', () => {
    test('should remove quotes using global regex', () => {
      expect(safeRemoveQuotes('"hello"')).toBe('hello');
      expect(safeRemoveQuotes('"hello" "world"')).toBe('hello" "world');
      expect(safeRemoveQuotes("'test'")).toBe('test');
    });
  });

  describe('safeReplaceNewlines', () => {
    test('should replace newline sequences globally', () => {
      expect(safeReplaceNewlines('hello\\nworld\\ntest')).toBe('hello\nworld\ntest');
      expect(safeReplaceNewlines('no newlines')).toBe('no newlines');
    });
  });

  describe('validateAndSanitizeInput', () => {
    test('should truncate long inputs', () => {
      const longInput = 'a'.repeat(2000);
      const result = validateAndSanitizeInput(longInput, 100);
      expect(result.length).toBe(100);
    });

    test('should remove control characters', () => {
      expect(validateAndSanitizeInput('hello\x00world')).toBe('helloworld');
    });
  });

  describe('sanitizeCommandText', () => {
    test('should remove shell metacharacters', () => {
      expect(sanitizeCommandText('ls; rm -rf /')).toBe('ls rm -rf /');
      expect(sanitizeCommandText('echo "hello" | cat')).toBe('echo "hello"  cat');
    });
  });

  describe('validateFileExtension', () => {
    test('should validate file extensions', () => {
      expect(validateFileExtension('test.rs')).toBe(true);
      expect(validateFileExtension('test.ts')).toBe(true);
      expect(validateFileExtension('test.exe')).toBe(false);
      expect(validateFileExtension('test')).toBe(false);
    });
  });

  describe('createSafeFilename', () => {
    test('should create safe filenames', () => {
      expect(createSafeFilename('test/file.txt')).toBe('test_file.txt');
      expect(createSafeFilename('../../../etc/passwd')).toBe('etc_passwd');
      expect(createSafeFilename('')).toBe('unnamed');
    });
  });
});