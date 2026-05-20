/**
 * Launch Readiness System
 * 
 * LaunchScan measures public launch hygiene for fast-shipped websites.
 * It is NOT an SEO ranking, brand quality score, performance score, or enterprise website benchmark.
 */

export * from './types';
export * from './scoring';
export * from './target-fit';
export * from './coverage';
export * from './confidence';

export { calculateLaunchReadiness } from './scoring';
