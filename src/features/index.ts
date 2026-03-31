/**
 * Beast CLI — Features Module
 * 
 * Feature flag management.
 */

export { 
  FeatureFlagManager, 
  createFeatureFlagManager, 
  getFeatureFlags,
  DEFAULT_FLAGS
} from "./flags"
export type { FeatureFlag, FeatureFlags, FeatureFlagsConfig } from "./flags"
