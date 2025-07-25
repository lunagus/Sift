"use client"

import {
  Box,
  Typography,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Container,
  Chip,
  Grid,
  Button,
  TextField,
} from "@mui/material"
import { ExpandMore, TextFields, DataObject, FileCopy, Download } from "@mui/icons-material"
import ColumnSelector from "./ColumnSelector"
import { useState } from "react"
import { useTheme } from "@mui/material/styles"
import DataExportMenu from "./DataExportMenu"

interface RawDataViewProps {
  tables: Record<string, any>[][]
}

export default function RawDataView({ tables }: RawDataViewProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const codeBg = isDark ? '#232323' : '#fff';
  const codeColor = isDark ? '#fff' : '#111';
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedColumnsByTable, setSelectedColumnsByTable] = useState<Record<number, string[]>>({})
  const [expandedRows, setExpandedRows] = useState<Record<number, Set<number>>>({})

  if (!tables || tables.length === 0) {
    return (
      <Container maxWidth={false} sx={{ py: 8, textAlign: "center" }}>
        <TextFields sx={{ fontSize: 80, color: "text.secondary", mb: 2 }} />
        <Typography variant="h5" color="text.secondary" sx={{ mb: 1 }}>
          No data available for raw view
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Extract table data first to view raw data and text content
        </Typography>
      </Container>
    )
  }

  const convertTableToText = (table: Record<string, any>[], tableIndex: number, columns?: string[]) => {
    if (!table.length) return ""
    const cols = columns || Object.keys(table[0])
    let text = `TABLE ${tableIndex + 1} SUMMARY:\n`
    text += `Total Records: ${table.length}\n`
    text += `Columns: ${cols.join(", ")}\n\n`
    text += "DETAILED DATA:\n"
    text += "=".repeat(50) + "\n\n"
    table.forEach((row, index) => {
      text += `Record ${index + 1}:\n`
      cols.forEach((col) => {
        text += `  ${col}: ${row[col] || "N/A"}\n`
      })
      text += "\n"
    })
    return text
  }

  // Copy all logic
  const handleCopyAll = (table: Record<string, any>[], tableIndex: number, columns: string[]) => {
    navigator.clipboard.writeText(convertTableToText(table, tableIndex, columns))
  }

  // Download as TXT logic
  const handleDownloadTxt = (table: Record<string, any>[], tableIndex: number, columns: string[]) => {
    const content = convertTableToText(table, tableIndex, columns)
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `sift-raw-table-${tableIndex + 1}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Toggle row expansion
  const handleToggleRow = (tableIndex: number, rowIndex: number) => {
    setExpandedRows((prev) => {
      const set = new Set(prev[tableIndex] || [])
      if (set.has(rowIndex)) set.delete(rowIndex)
      else set.add(rowIndex)
      return { ...prev, [tableIndex]: set }
    })
  }

  const generateSummary = (table: Record<string, any>[]) => {
    if (!table.length) return "No data available"

    const columns = Object.keys(table[0])
    const numericColumns = columns.filter((col) => table.some((row) => !isNaN(Number(row[col]))))

    let summary = `This table contains ${table.length} records with ${columns.length} columns. `

    if (numericColumns.length > 0) {
      summary += `Numeric data is available in ${numericColumns.length} columns: ${numericColumns.join(", ")}. `
    }

    // Find most common values
    const firstColumn = columns[0]
    const uniqueValues = Array.from(new Set(table.map((row) => row[firstColumn]))).length
    summary += `The ${firstColumn} column has ${uniqueValues} unique values.`

    return summary
  }

  const calculateCharacterCount = (table: Record<string, any>[]) => {
    const text = convertTableToText(table, 0)
    return text.length
  }

  const totalCharacters = tables.reduce((sum, table) => sum + calculateCharacterCount(table), 0)

  return (
    <Container maxWidth={false} sx={{ py: 4, px: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Raw Data View
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          View raw extracted data in text format with detailed summaries and statistics
        </Typography>
        <Box sx={{ display: "flex", gap: 2, mb: 2, alignItems: "center" }}>
          <FileCopy sx={{ mr: 1 }} />
          <DataExportMenu data={tables[0]} columns={Object.keys(tables[0][0] || {})} fileName={`sift-raw-table-1`} exportOptions={["csv", "json", "txt", "copy", "print"]} />
          <TextField
            placeholder="Search in raw data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ minWidth: 220 }}
          />
        </Box>
      </Box>
      {tables.map((table, index) => {
        const columns = Object.keys(table[0] || {})
        const selectedColumns = selectedColumnsByTable[index] || columns
        const filteredTable = searchTerm
          ? table.filter((row) =>
              selectedColumns.some((col) => String(row[col] || "").toLowerCase().includes(searchTerm.toLowerCase())),
            )
          : table
        return (
          <Accordion key={index} sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <TextFields sx={{ mr: 2, color: "primary.main" }} />
                  <Typography variant="h6">Table {index + 1} - Raw Data</Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 1, mr: 2 }}>
                  <Chip label={`${filteredTable.length} rows`} size="small" color="primary" />
                  <Chip label={`${columns.length} columns`} size="small" color="secondary" />
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ mb: 2, display: "flex", gap: 2, alignItems: "center" }}>
                <DataExportMenu data={filteredTable} columns={selectedColumns} fileName={`sift-raw-table-${index + 1}`} exportOptions={["csv", "json", "txt", "copy", "print"]} />
                <ColumnSelector
                  columns={columns}
                  selectedColumns={selectedColumns}
                  onChange={(cols) => setSelectedColumnsByTable((prev) => ({ ...prev, [index]: cols }))}
                  minColumns={1}
                />
              </Box>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: "primary.main" }}>
                    Data Summary
                  </Typography>
                  <Typography variant="body1" sx={{ lineHeight: 1.6, mb: 2 }}>
                    {generateSummary(filteredTable)}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Chip label={`${filteredTable.length} records`} size="small" />
                    <Chip label={`${selectedColumns.length} columns`} size="small" />
                  </Box>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: "primary.main" }}>
                    Raw Data Export
                  </Typography>
                  <Box
                    component="pre"
                    sx={{
                      fontFamily: "monospace",
                      fontSize: "1.1rem",
                      lineHeight: 1.5,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      maxHeight: 500,
                      overflow: "auto",
                      color: codeColor,
                      background: codeBg,
                      p: 3,
                      borderRadius: 2,
                      border: 1,
                      borderColor: "divider",
                    }}
                  >
                    {convertTableToText(filteredTable, index, selectedColumns)}
                  </Box>
                </CardContent>
              </Card>
            </AccordionDetails>
          </Accordion>
        )
      })}
    </Container>
  )
}
