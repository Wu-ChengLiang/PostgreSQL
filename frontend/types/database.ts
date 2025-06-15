export interface Database {
  name: string
  size: string
  owner: string
  encoding: string
  collation: string
  tablespace: string
  connection_limit: number
}

export interface DatabaseStats {
  size: number
  tableCount: number
  totalRows: number
  activeConnections: number
  cacheHitRatio: number
  transactionsPerSecond: number
}

export interface Table {
  schema: string
  name: string
  owner: string
  rowCount: number
  size: string
  description?: string
}

export interface Column {
  name: string
  type: string
  nullable: boolean
  default?: string
  isPrimaryKey: boolean
  isForeignKey: boolean
  references?: {
    table: string
    column: string
  }
}

export interface QueryResult {
  columns: string[]
  rows: any[]
  rowCount: number
  executionTime: number
}