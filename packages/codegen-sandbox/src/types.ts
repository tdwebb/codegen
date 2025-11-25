/**
 * Type definitions for @codegen/codegen-sandbox
 */

/**
 * Resource usage statistics for executed commands
 */
export interface ResourceStats {
  cpuUsagePercent: number;
  memoryUsageMb: number;
  maxMemoryMb: number;
}

/**
 * Result of executing a command in a sandbox
 */
export interface ExecutionResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number; // in milliseconds
  resourceUsage: ResourceStats;
}

/**
 * File to mount in the sandbox
 */
export interface MountedFile {
  path: string; // absolute path in sandbox
  content: string | Buffer;
  readonly?: boolean;
}

/**
 * Configuration for sandbox execution
 */
export interface SandboxConfig {
  image: string; // Docker image to use
  timeout?: number; // timeout in milliseconds (default: 5 minutes = 300000)
  cpuLimit?: string; // e.g., "1", "0.5" for CPU cores
  memoryLimit?: string; // e.g., "2g", "512m"
  workdir?: string; // working directory in container
}

/**
 * Interface for executing code in an isolated sandbox
 */
export interface ISandboxExecutor {
  /**
   * Execute a command in the sandbox
   * @param command Command to execute
   * @param config Sandbox configuration
   * @param files Optional files to mount in the sandbox
   * @returns Execution result with exit code, output, and resource usage
   */
  execute(
    command: string,
    config: SandboxConfig,
    files?: MountedFile[]
  ): Promise<ExecutionResult>;

  /**
   * Health check to verify docker daemon is accessible
   */
  healthCheck(): Promise<boolean>;
}
