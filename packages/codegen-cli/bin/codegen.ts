#!/usr/bin/env node

/**
 * CodeGen CLI executable
 */

import { main } from '../src/index';

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
