/** Temporary entity that auto-destroys after TTL */
export interface LifetimeComponent {
  /** Time to live in milliseconds */
  ttl: number;
  /** Time elapsed so far in milliseconds */
  elapsed: number;
}
