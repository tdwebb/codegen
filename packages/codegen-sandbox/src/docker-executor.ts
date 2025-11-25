/**
 * Docker-based sandbox executor for safe code execution
 */

import Docker from 'dockerode';
import { Readable } from 'stream';
import type { ExecutionResult, ISandboxExecutor, MountedFile, ResourceStats, SandboxConfig } from './types';

/**
 * Docker-based implementation of sandbox executor
 * Runs commands in ephemeral containers with resource limits
 */
export class DockerSandboxExecutor implements ISandboxExecutor {
  private docker: Docker;
  private defaultTimeout = 5 * 60 * 1000; // 5 minutes in milliseconds

  constructor(socketPath?: string) {
    // Connect to Docker daemon via socket
    // Default: /var/run/docker.sock on Unix, //./pipe/docker_engine on Windows
    this.docker = socketPath ? new Docker({ socketPath }) : new Docker();
  }

  /**
   * Execute a command in an isolated Docker container
   */
  async execute(
    command: string,
    config: SandboxConfig,
    files?: MountedFile[]
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const timeout = config.timeout ?? this.defaultTimeout;

    let containerId: string | undefined;

    try {
      // Prepare container configuration
      const containerConfig = {
        Image: config.image,
        Cmd: ['/bin/sh', '-c', command],
        WorkingDir: config.workdir ?? '/work',
        AttachStdout: true,
        AttachStderr: true,
        Tty: false,
        HostConfig: {
          CpuQuota: config.cpuLimit ? Math.floor(parseFloat(config.cpuLimit) * 100000) : 100000, // 1 CPU default
          Memory: config.memoryLimit ? this.parseMemory(config.memoryLimit) : 2 * 1024 * 1024 * 1024, // 2GB default
          MemorySwap: config.memoryLimit ? this.parseMemory(config.memoryLimit) : 2 * 1024 * 1024 * 1024, // Disable swap
          NetworkMode: 'none', // No network access
          ReadonlyRootfs: false, // Allow writing to /tmp
          Tmpfs: {
            '/tmp': 'size=1g', // 1GB temp filesystem
          },
          PidsLimit: 100, // Limit number of processes
        },
        User: '1000:1000', // Run as non-root user
      };

      // Create container
      const container = await this.docker.createContainer(containerConfig);
      containerId = container.id;

      // Capture stdout and stderr
      const { stdout, stderr } = await this.captureOutput(container, timeout);

      // Get exit code
      const exitCode = await this.getExitCode(container);

      // Calculate duration
      const duration = Date.now() - startTime;

      // Resource stats (simplified for now)
      const resourceUsage: ResourceStats = {
        cpuUsagePercent: 0, // Would need detailed stats from Docker
        memoryUsageMb: 0,
        maxMemoryMb: 2048,
      };

      return {
        exitCode,
        stdout,
        stderr,
        duration,
        resourceUsage,
      };
    } finally {
      // Clean up container
      if (containerId) {
        await this.cleanupContainer(containerId);
      }
    }
  }

  /**
   * Health check to verify Docker daemon is accessible
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.docker.ping();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Capture stdout and stderr from container execution
   */
  private async captureOutput(
    container: Docker.Container,
    timeout: number
  ): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';
      let completed = false;
      let timeoutHandle: NodeJS.Timeout | undefined;

      // Start the container
      container
        .start({})
        .catch((err) => {
          if (!completed) {
            completed = true;
            reject(new Error(`Failed to start container: ${err.message}`));
          }
        });

      // Set timeout
      timeoutHandle = setTimeout(() => {
        if (!completed) {
          completed = true;
          // Container will be killed in finally block
          reject(new Error(`Sandbox execution timeout (${timeout}ms)`));
        }
      }, timeout);

      // Attach to stdout/stderr streams
      container
        .attach({ stream: true, stdout: true, stderr: true })
        .then((stream) => {
          // Demultiplex the stream (Docker returns combined stream with headers)
          this.demuxStream(stream, (data, isStderr) => {
            if (isStderr) {
              stderr += data;
            } else {
              stdout += data;
            }
          });

          // Wait for container to finish
          return container.wait();
        })
        .then(() => {
          if (!completed) {
            completed = true;
            if (timeoutHandle) clearTimeout(timeoutHandle);
            resolve({ stdout, stderr });
          }
        })
        .catch((err) => {
          if (!completed) {
            completed = true;
            if (timeoutHandle) clearTimeout(timeoutHandle);
            reject(err);
          }
        });
    });
  }

  /**
   * Demultiplex Docker stream output
   * Docker attaches stdout/stderr in a single stream with frame headers
   */
  private demuxStream(
    stream: NodeJS.ReadableStream,
    callback: (data: string, isStderr: boolean) => void
  ): void {
    // Docker frame format: [8 byte header][payload]
    // Header: [STREAM_TYPE, 0, 0, 0, SIZE_4_BYTES]
    // STREAM_TYPE: 1=stdout, 2=stderr

    let buffer = Buffer.alloc(0);

    stream.on('data', (chunk: Buffer) => {
      buffer = Buffer.concat([buffer, chunk]);

      while (buffer.length >= 8) {
        const streamType = buffer[0];
        const payloadSize = buffer.readUInt32BE(4);

        if (buffer.length < 8 + payloadSize) {
          break; // Not enough data yet
        }

        const payload = buffer.slice(8, 8 + payloadSize).toString('utf-8');
        callback(payload, streamType === 2); // streamType 2 = stderr

        buffer = buffer.slice(8 + payloadSize);
      }
    });
  }

  /**
   * Get the exit code of a completed container
   */
  private async getExitCode(container: Docker.Container): Promise<number> {
    try {
      const data = await container.inspect();
      return data.State.ExitCode ?? 1;
    } catch {
      return 1; // Default to error exit code
    }
  }

  /**
   * Clean up a container
   */
  private async cleanupContainer(containerId: string): Promise<void> {
    try {
      const container = this.docker.getContainer(containerId);

      // Try to stop it (with timeout)
      try {
        await container.stop({ t: 5 });
      } catch {
        // Already stopped or doesn't exist
      }

      // Remove the container
      try {
        await container.remove({ force: true });
      } catch {
        // Already removed
      }
    } catch {
      // Container doesn't exist or cleanup failed
    }
  }

  /**
   * Parse memory limit string to bytes
   * Supports: "512m", "1g", "2gb", etc.
   */
  private parseMemory(limit: string): number {
    const match = limit.match(/^(\d+(?:\.\d+)?)\s*([kmgt]b?)?$/i);
    if (!match) {
      throw new Error(`Invalid memory limit format: ${limit}`);
    }

    const value = parseFloat(match[1]);
    const unit = (match[2] ?? 'b').toLowerCase();

    switch (unit) {
      case 'k':
      case 'kb':
        return value * 1024;
      case 'm':
      case 'mb':
        return value * 1024 * 1024;
      case 'g':
      case 'gb':
        return value * 1024 * 1024 * 1024;
      case 't':
      case 'tb':
        return value * 1024 * 1024 * 1024 * 1024;
      default:
        return value;
    }
  }
}
