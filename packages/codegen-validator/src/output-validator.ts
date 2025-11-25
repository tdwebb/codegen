/**
 * Output validator for code generation validation and auto-fix
 */

import type {
  IOutputValidator,
  OutputValidationResult,
  OutputValidationIssue,
  OutputAutoFixResult,
} from './types';

/**
 * Output validator for generated code
 */
export class OutputValidator implements IOutputValidator {
  private customRules: Map<
    string,
    (content: string) => OutputValidationIssue[]
  > = new Map();

  constructor() {
    // Register default validators
    this.registerDefaultRules();
  }

  /**
   * Validate output content
   */
  validate(content: string, language: string): OutputValidationResult {
    const issues: OutputValidationIssue[] = [];

    // Check syntax issues
    const syntaxIssues = this.checkSyntax(content, language);
    issues.push(...syntaxIssues);

    // Check style issues
    const styleIssues = this.checkStyle(content, language);
    issues.push(...styleIssues);

    // Check for custom rules
    if (this.customRules.has(language)) {
      const customIssues = this.customRules.get(language)!(content);
      issues.push(...customIssues);
    }

    const isValid = !issues.some((i) => i.severity === 'critical');

    return {
      isValid,
      issues,
      content,
    };
  }

  /**
   * Auto-fix validation issues
   */
  autoFix(content: string, language: string): OutputAutoFixResult {
    let fixed = content;
    const changes: Array<{
      line: number;
      issue: OutputValidationIssue;
      fix: string;
    }> = [];
    const warnings: string[] = [];

    // Validate first
    const validation = this.validate(content, language);

    for (const issue of validation.issues) {
      if (!issue.autoFixable) {
        continue;
      }

      // Apply auto-fixes
      const result = this.applyAutoFix(fixed, language, issue);
      if (result.success) {
        changes.push({
          line: issue.location?.line || 0,
          issue,
          fix: result.fix,
        });
        fixed = result.content;
      } else if (result.warning) {
        warnings.push(result.warning);
      }
    }

    return {
      success: warnings.length === 0,
      fixed,
      changes,
      warnings,
    };
  }

  /**
   * Register custom validation rule
   */
  registerRule(
    language: string,
    rule: (content: string) => OutputValidationIssue[],
  ): void {
    this.customRules.set(language, rule);
  }

  /**
   * Register default validation rules for common languages
   */
  private registerDefaultRules(): void {
    // JavaScript/TypeScript rules
    this.registerRule('javascript', (content: string) =>
      this.validateJavaScript(content),
    );
    this.registerRule('typescript', (content: string) =>
      this.validateJavaScript(content),
    );
    this.registerRule('ts', (content: string) =>
      this.validateJavaScript(content),
    );
    this.registerRule('js', (content: string) =>
      this.validateJavaScript(content),
    );

    // JSON rules
    this.registerRule('json', (content: string) => this.validateJSON(content));

    // YAML rules
    this.registerRule('yaml', (content: string) =>
      this.validateYAML(content),
    );
    this.registerRule('yml', (content: string) =>
      this.validateYAML(content),
    );

    // Python rules
    this.registerRule('python', (content: string) =>
      this.validatePython(content),
    );
  }

  /**
   * Check syntax issues in code
   */
  private checkSyntax(
    content: string,
    language: string,
  ): OutputValidationIssue[] {
    const issues: OutputValidationIssue[] = [];

    switch (language.toLowerCase()) {
      case 'json':
        try {
          JSON.parse(content);
        } catch (e) {
          const error = e instanceof Error ? e : new Error(String(e));
          const match = error.message.match(/position (\d+)/);
          const matchStr = match?.[1];
          const position = matchStr ? parseInt(matchStr, 10) : 0;
          const lineNumber = content.substring(0, position).split('\n').length;

          issues.push({
            type: 'error',
            severity: 'critical',
            message: `Invalid JSON: ${error.message}`,
            location: { line: lineNumber },
            suggestion: 'Check for trailing commas, missing quotes, or unmatched braces',
            autoFixable: false,
          });
        }
        break;

      case 'javascript':
      case 'typescript':
      case 'ts':
      case 'js':
        // Check for common syntax issues
        issues.push(...this.checkJSSyntax(content));
        break;

      case 'python':
        issues.push(...this.checkPythonSyntax(content));
        break;
    }

    return issues;
  }

  /**
   * Check style issues in code
   */
  private checkStyle(
    content: string,
    language: string,
  ): OutputValidationIssue[] {
    const issues: OutputValidationIssue[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? '';
      const lineNum = i + 1;

      // Check for trailing whitespace
      if (line.match(/\s+$/)) {
        issues.push({
          type: 'warning',
          severity: 'low',
          message: 'Trailing whitespace detected',
          location: { line: lineNum },
          suggestion: 'Remove trailing whitespace',
          autoFixable: true,
        });
      }

      // Check for mixed indentation
      if (line.match(/^\t+ +/) || line.match(/^ +\t+/)) {
        issues.push({
          type: 'warning',
          severity: 'medium',
          message: 'Mixed tabs and spaces detected',
          location: { line: lineNum },
          suggestion: 'Use consistent indentation (spaces recommended)',
          autoFixable: true,
        });
      }

      // Language-specific style checks
      if (
        ['javascript', 'typescript', 'ts', 'js'].includes(language.toLowerCase())
      ) {
        // Check for console statements in non-debug code
        if (
          line.includes('console.log') &&
          !line.includes('// debug') &&
          !line.includes('// DEBUG')
        ) {
          issues.push({
            type: 'warning',
            severity: 'medium',
            message: 'console.log statement found in code',
            location: { line: lineNum },
            suggestion: 'Remove or wrap in debug block',
            autoFixable: true,
          });
        }

        // Check for var usage
        if (line.match(/^\s*var\s+/)) {
          issues.push({
            type: 'warning',
            severity: 'low',
            message: 'Use of var keyword (prefer const/let)',
            location: { line: lineNum },
            suggestion: 'Replace var with const or let',
            autoFixable: true,
          });
        }
      }
    }

    return issues;
  }

  /**
   * Check JavaScript-specific syntax issues
   */
  private checkJSSyntax(content: string): OutputValidationIssue[] {
    const issues: OutputValidationIssue[] = [];

    // Check for unbalanced braces
    const openBraces = (content.match(/[{]/g) || []).length;
    const closeBraces = (content.match(/[}]/g) || []).length;
    if (openBraces !== closeBraces) {
      issues.push({
        type: 'error',
        severity: 'critical',
        message: `Unbalanced braces: ${openBraces} opening, ${closeBraces} closing`,
        suggestion: 'Check for missing or extra { or }',
        autoFixable: false,
      });
    }

    // Check for unbalanced brackets
    const openBrackets = (content.match(/\[/g) || []).length;
    const closeBrackets = (content.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      issues.push({
        type: 'error',
        severity: 'critical',
        message: `Unbalanced brackets: ${openBrackets} opening, ${closeBrackets} closing`,
        suggestion: 'Check for missing or extra [ or ]',
        autoFixable: false,
      });
    }

    // Check for unbalanced parentheses
    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      issues.push({
        type: 'error',
        severity: 'critical',
        message: `Unbalanced parentheses: ${openParens} opening, ${closeParens} closing`,
        suggestion: 'Check for missing or extra ( or )',
        autoFixable: false,
      });
    }

    return issues;
  }

  /**
   * Check Python-specific syntax issues
   */
  private checkPythonSyntax(content: string): OutputValidationIssue[] {
    const issues: OutputValidationIssue[] = [];

    // Check for unbalanced parentheses
    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      issues.push({
        type: 'error',
        severity: 'critical',
        message: `Unbalanced parentheses: ${openParens} opening, ${closeParens} closing`,
        autoFixable: false,
      });
    }

    // Check for unbalanced brackets
    const openBrackets = (content.match(/\[/g) || []).length;
    const closeBrackets = (content.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      issues.push({
        type: 'error',
        severity: 'critical',
        message: `Unbalanced brackets: ${openBrackets} opening, ${closeBrackets} closing`,
        autoFixable: false,
      });
    }

    // Check for unbalanced braces
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      issues.push({
        type: 'error',
        severity: 'critical',
        message: `Unbalanced braces: ${openBraces} opening, ${closeBraces} closing`,
        autoFixable: false,
      });
    }

    return issues;
  }

  /**
   * Validate JavaScript/TypeScript
   */
  private validateJavaScript(
    content: string,
  ): OutputValidationIssue[] {
    // Return empty - syntax already checked in checkSyntax
    return [];
  }

  /**
   * Validate JSON
   */
  private validateJSON(content: string): OutputValidationIssue[] {
    // Return empty - syntax already checked in checkSyntax
    return [];
  }

  /**
   * Validate YAML
   */
  private validateYAML(content: string): OutputValidationIssue[] {
    const issues: OutputValidationIssue[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? '';
      const lineNum = i + 1;

      // Check for inconsistent indentation (basic check)
      if (line.length > 0 && !line.match(/^[ ]*/)) {
        issues.push({
          type: 'warning',
          severity: 'medium',
          message: 'Invalid indentation in YAML',
          location: { line: lineNum },
          suggestion: 'Use consistent space-based indentation',
          autoFixable: false,
        });
      }

      // Check for tabs (not allowed in YAML)
      if (line.includes('\t')) {
        issues.push({
          type: 'error',
          severity: 'critical',
          message: 'Tabs not allowed in YAML',
          location: { line: lineNum },
          suggestion: 'Replace tabs with spaces',
          autoFixable: true,
        });
      }
    }

    return issues;
  }

  /**
   * Validate Python
   */
  private validatePython(content: string): OutputValidationIssue[] {
    // Return empty - syntax already checked in checkSyntax
    return [];
  }

  /**
   * Apply auto-fix to content
   */
  private applyAutoFix(
    content: string,
    language: string,
    issue: OutputValidationIssue,
  ): { success: boolean; content: string; fix: string; warning?: string } {
    const lines = content.split('\n');
    const lineNum = ((issue.location?.line) ?? 1) - 1;

    if (lineNum < 0 || lineNum >= lines.length) {
      return {
        success: false,
        content,
        fix: '',
        warning: `Cannot auto-fix issue at invalid line ${lineNum + 1}`,
      };
    }

    const line = lines[lineNum] ?? '';

    // Remove trailing whitespace
    if (issue.message.includes('Trailing whitespace')) {
      const fixed = line.replace(/\s+$/, '');
      lines[lineNum] = fixed;
      const lineDisplay = lineNum + 1;
      return {
        success: true,
        content: lines.join('\n'),
        fix: `Removed trailing whitespace from line ${lineDisplay}`,
      };
    }

    // Fix mixed indentation (convert tabs to spaces)
    if (issue.message.includes('Mixed tabs and spaces')) {
      const fixed = line.replace(/\t/g, '  ');
      lines[lineNum] = fixed;
      const lineDisplay = lineNum + 1;
      return {
        success: true,
        content: lines.join('\n'),
        fix: `Converted mixed indentation to spaces on line ${lineDisplay}`,
      };
    }

    // Remove console.log
    if (issue.message.includes('console.log')) {
      const fixed = line.replace(/console\.log\([^)]*\);?/g, '');
      lines[lineNum] = fixed;
      const lineDisplay = lineNum + 1;
      return {
        success: true,
        content: lines.join('\n'),
        fix: `Removed console.log from line ${lineDisplay}`,
      };
    }

    // Replace var with const
    if (issue.message.includes('var keyword')) {
      const fixed = line.replace(/^\s*var\s+/, (match) =>
        match.replace('var', 'const'),
      );
      lines[lineNum] = fixed;
      const lineDisplay = lineNum + 1;
      return {
        success: true,
        content: lines.join('\n'),
        fix: `Replaced var with const on line ${lineDisplay}`,
      };
    }

    // Fix tabs in YAML
    if (issue.message.includes('Tabs not allowed in YAML')) {
      const fixed = line.replace(/\t/g, '  ');
      lines[lineNum] = fixed;
      const lineDisplay = lineNum + 1;
      return {
        success: true,
        content: lines.join('\n'),
        fix: `Converted tabs to spaces on line ${lineDisplay}`,
      };
    }

    return {
      success: false,
      content,
      fix: '',
      warning: `No auto-fix available for: ${issue.message}`,
    };
  }
}
