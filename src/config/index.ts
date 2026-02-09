/**
 * Configuration Module
 * Exports the appropriate configuration based on the current environment
 */

import { localConfig } from './local';
import { productionConfig } from './production';

// Determine which config to use
const isDevelopment = import.meta.env.DEV;
const config = isDevelopment ? localConfig : productionConfig;

export default config;

// Export specific configs for direct access if needed
export { localConfig, productionConfig };

// Type for configuration
export type AppConfig = typeof localConfig | typeof productionConfig;

