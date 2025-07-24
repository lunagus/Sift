export interface ScrapeRequest {
  url: string
  question?: string
}

export interface ScrapeResponse {
  tables: Record<string, any>[][]
  ai_response?: string
}

export interface TableData {
  [key: string]: any
}
