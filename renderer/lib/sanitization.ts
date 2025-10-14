/**
 * Comprehensive input sanitization utilities to prevent injection attacks
 * and ensure proper escaping of meta-characters.
 */

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param input - The string to escape
 * @returns HTML-escaped string
 */
export function escapeHtml(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Escapes shell command arguments to prevent command injection
 * @param input - The string to escape
 * @returns Shell-escaped string
 */
export function escapeShellArg(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Escape single quotes by ending the quote, adding escaped quote, and starting new quote
  return `'${input.replace(/'/g, "'\"'\"'")}'`;
}

/**
 * Escapes JSON special characters
 * @param input - The string to escape
 * @returns JSON-escaped string
 */
export function escapeJson(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/\b/g, '\\b')
    .replace(/\f/g, '\\f');
}

/**
 * Sanitizes file paths to prevent directory traversal attacks
 * @param input - The file path to sanitize
 * @returns Sanitized file path
 */
export function sanitizeFilePath(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Remove any path traversal attempts
  let sanitized = input
    .replace(/\.\./g, '') // Remove .. sequences
    .replace(/\/+/g, '/') // Collapse multiple slashes
    .replace(/^\/+/, '') // Remove leading slashes
    .trim();
  
  // Ensure the path doesn't start with dangerous patterns
  if (sanitized.startsWith('..') || sanitized.includes('/..')) {
    return '';
  }
  
  return sanitized;
}

/**
 * Sanitizes command output by removing potentially dangerous content
 * @param input - The command output to sanitize
 * @returns Sanitized command output
 */
export function sanitizeCommandOutput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .replace(/\x1b\[[0-9;]*m/g, '') // Remove ANSI escape codes
    .trim();
}

/**
 * Safely removes quotes from a string using proper regex with global flag
 * @param input - The string to process
 * @param quoteChar - The quote character to remove (default: ")
 * @returns String with quotes removed
 */
export function safeRemoveQuotes(input: string, quoteChar: string = '"'): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Escape the quote character for regex
  const escapedQuote = quoteChar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Use global flag to replace all occurrences
  const regex = new RegExp(escapedQuote, 'g');
  return input.replace(regex, '').trim();
}

/**
 * Safely replaces newline escape sequences
 * @param input - The string to process
 * @returns String with newline sequences properly converted
 */
export function safeReplaceNewlines(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Use global flag to replace all occurrences
  return input.replace(/\\n/g, '\n');
}

/**
 * Validates and sanitizes user input for display
 * @param input - The user input to validate
 * @param maxLength - Maximum allowed length (default: 1000)
 * @returns Sanitized and validated input
 */
export function validateAndSanitizeInput(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Truncate if too long
  let sanitized = input.length > maxLength ? input.substring(0, maxLength) : input;
  
  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  return sanitized.trim();
}

/**
 * Sanitizes command text for safe execution
 * @param input - The command text to sanitize
 * @returns Sanitized command text
 */
export function sanitizeCommandText(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Remove dangerous characters that could be used for command injection
  return input
    .replace(/[;&|`$(){}[\]\\]/g, '') // Remove shell metacharacters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Validates file extension
 * @param filename - The filename to validate
 * @param allowedExtensions - Array of allowed extensions (default: ['.rs', '.ts', '.js', '.tsx', '.jsx'])
 * @returns True if extension is allowed
 */
export function validateFileExtension(
  filename: string, 
  allowedExtensions: string[] = ['.rs', '.ts', '.js', '.tsx', '.jsx']
): boolean {
  if (typeof filename !== 'string') {
    return false;
  }
  
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return allowedExtensions.includes(extension);
}

/**
 * Creates a safe filename by removing dangerous characters
 * @param input - The input string to convert to safe filename
 * @returns Safe filename
 */
export function createSafeFilename(input: string): string {
  if (typeof input !== 'string') {
    return 'unnamed';
  }
  
  return input
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace non-alphanumeric chars with underscore
    .replace(/_+/g, '_') // Collapse multiple underscores
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
    .substring(0, 100) // Limit length
    || 'unnamed';
}