export interface ScrapeRequest {
  url: string
  question?: string
}

export interface ScrapeResponse {
  tables?: Record<string, any>[][]
  listings?: Record<string, any>[]
  article?: any
  content_types?: string[]
  raw_html?: string
  json_ld?: any[]
  normalized_jsonld?: Record<string, any>[]
}

export interface TableData {
  [key: string]: any
}
