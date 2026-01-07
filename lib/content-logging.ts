/**
 * Structured logging for content generation and quality control
 */

export interface ContentLogEntry {
  timestamp: string;
  stage: 'generation' | 'validation' | 'import' | 'publish';
  action: string;
  status: 'success' | 'warning' | 'error';
  details?: Record<string, unknown>;
  qualityScore?: number;
  errors?: string[];
  warnings?: string[];
}

/**
 * Logs content generation and quality control events
 */
export function logContentEvent(entry: Omit<ContentLogEntry, 'timestamp'>): void {
  const logEntry: ContentLogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };

  // In production, you might want to send this to a logging service
  // For now, we'll use structured console logging
  const logLevel = entry.status === 'error' ? 'error' : entry.status === 'warning' ? 'warn' : 'info';

  console[logLevel](`[Content ${entry.stage.toUpperCase()}] ${entry.action}`, {
    timestamp: logEntry.timestamp,
    status: entry.status,
    qualityScore: entry.qualityScore,
    errors: entry.errors,
    warnings: entry.warnings,
    ...entry.details,
  });
}

/**
 * Logs content generation start
 */
export function logGenerationStart(topic?: string): void {
  logContentEvent({
    stage: 'generation',
    action: 'start',
    status: 'success',
    details: { topic },
  });
}

/**
 * Logs content generation completion
 */
export function logGenerationComplete(
  wordCount: number,
  title: string,
  qualityScore?: number
): void {
  logContentEvent({
    stage: 'generation',
    action: 'complete',
    status: 'success',
    qualityScore,
    details: {
      wordCount,
      title,
    },
  });
}

/**
 * Logs validation results
 */
export function logValidation(
  valid: boolean,
  score: number,
  errors: string[],
  warnings: string[],
  metrics: Record<string, number>
): void {
  logContentEvent({
    stage: 'validation',
    action: 'validate',
    status: valid ? (warnings.length > 0 ? 'warning' : 'success') : 'error',
    qualityScore: score,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
    details: { metrics },
  });
}

/**
 * Logs duplicate detection results
 */
export function logDuplicateCheck(
  isDuplicate: boolean,
  similarPosts: Array<{ _id: string; title: string; similarity: number }>
): void {
  logContentEvent({
    stage: 'validation',
    action: 'duplicate_check',
    status: isDuplicate ? 'warning' : 'success',
    details: {
      isDuplicate,
      similarPostsCount: similarPosts.length,
      similarPosts: similarPosts.slice(0, 3), // Log top 3 matches
    },
  });
}

/**
 * Logs import/publish events
 */
export function logImport(
  postId: string,
  title: string,
  published: boolean,
  qualityScore?: number
): void {
  logContentEvent({
    stage: published ? 'publish' : 'import',
    action: published ? 'publish' : 'create_draft',
    status: 'success',
    qualityScore,
    details: {
      postId,
      title,
      published,
    },
  });
}

/**
 * Logs errors during content processing
 */
export function logError(
  stage: ContentLogEntry['stage'],
  action: string,
  error: Error | string,
  details?: Record<string, unknown>
): void {
  logContentEvent({
    stage,
    action,
    status: 'error',
    errors: [error instanceof Error ? error.message : error],
    details: {
      ...details,
      ...(error instanceof Error && { stack: error.stack }),
    },
  });
}

