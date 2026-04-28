/**
 * Server-side initializer — imported once at the top of app/layout.tsx.
 *
 * Uses a global flag to ensure jobs start exactly once per process,
 * even if Next.js evaluates layout.tsx multiple times during startup.
 */

// Extend the Node.js global type for our flag
declare global {
  // eslint-disable-next-line no-var
  var __ecoveJobsStarted: boolean | undefined
}

// Only run server-side, only in production (or when ENABLE_JOBS=true),
// and only once per process lifetime
if (
  typeof window === 'undefined' &&
  !global.__ecoveJobsStarted &&
  (process.env.NODE_ENV === 'production' || process.env.ENABLE_JOBS === 'true')
) {
  global.__ecoveJobsStarted = true

  // Dynamic import keeps the jobs module out of the critical path
  import('./jobs')
    .then(({ startBackgroundJobs }) => startBackgroundJobs())
    .catch((err) => {
      // Log but never throw — a job startup failure must not kill the server
      console.error('[ecove] Failed to start background jobs:', err)
    })
}

export {}
