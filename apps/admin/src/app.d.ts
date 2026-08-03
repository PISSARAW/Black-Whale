declare global {
  namespace App {
    /** `handleError` adds a reference so a report can be matched to a log line. */
    interface Error {
      message: string
      reference?: string
    }
    interface Locals {
      authenticated: boolean
    }
  }
}

export {}
