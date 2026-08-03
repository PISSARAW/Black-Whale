declare global {
  namespace App {
    /** `handleError` adds a reference so a report can be matched to a log line. */
    interface Error {
      message: string
      reference?: string
    }
    // Locals carried maxChapter only to forward it to the API. Routes read
    // the spoiler cookie directly through $lib/server/spoiler now.
    // The locale is derived from the URL wherever it is needed, so it does not
    // ride here either.
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {}
