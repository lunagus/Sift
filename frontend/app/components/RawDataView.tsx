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
} from "@mui/material"
import { ExpandMore, TextFields, DataObject } from "@mui/icons-material"

interface RawDataViewProps {
  tables: Record<string, any>[][]
}

export default function RawDataView({ tables }: RawDataViewProps) {
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

  const convertTableToText = (table: Record<string, any>[], tableIndex: number) => {
    if (!table.length) return ""

    const columns = Object.keys(table[0])
    let text = `TABLE ${tableIndex + 1} SUMMARY:\n`
    text += `Total Records: ${table.length}\n`
    text += `Columns: ${columns.join(", ")}\n\n`

    text += "DETAILED DATA:\n"
    text += "=".repeat(50) + "\n\n"

    table.forEach((row, index) => {
      text += `Record ${index + 1}:\n`
      columns.forEach((col) => {
        text += `  ${col}: ${row[col] || "N/A"}\n`
      })
      text += "\n"
    })

    return text
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
    const uniqueValues = [...new Set(table.map((row) => row[firstColumn]))].length
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

        {/* Data Statistics */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: "background.default" }}>
              <CardContent sx={{ textAlign: "center", py: 3 }}>
                <DataObject sx={{ fontSize: 40, color: "primary.main", mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: "primary.main" }}>
                  {tables.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tables Extracted
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: "background.default" }}>
              <CardContent sx={{ textAlign: "center", py: 3 }}>
                <TextFields sx={{ fontSize: 40, color: "success.main", mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: "success.main" }}>
                  {totalCharacters.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Characters
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: "background.default" }}>
              <CardContent sx={{ textAlign: "center", py: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: "info.main", mb: 1 }}>
                  {tables.reduce((sum, table) => sum + table.length, 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Records
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: "background.default" }}>
              <CardContent sx={{ textAlign: "center", py: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: "warning.main", mb: 1 }}>
                  {tables.length > 0 ? Object.keys(tables[0][0] || {}).length : 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg Columns
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {tables.map((table, index) => (
        <Accordion key={index} sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <TextFields sx={{ mr: 2, color: "primary.main" }} />
                <Typography variant="h6">Table {index + 1} - Raw Data</Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1, mr: 2 }}>
                <Chip label={`${table.length} rows`} size="small" color="primary" />
                <Chip
                  label={`${calculateCharacterCount(table).toLocaleString()} chars`}
                  size="small"
                  color="secondary"
                />
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: "primary.main" }}>
                  Data Summary
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.6, mb: 2 }}>
                  {generateSummary(table)}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Chip label={`${table.length} records`} size="small" />
                  <Chip label={`${Object.keys(table[0] || {}).length} columns`} size="small" />
                  <Chip label={`${calculateCharacterCount(table).toLocaleString()} characters`} size="small" />
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
                    fontSize: "0.875rem",
                    lineHeight: 1.4,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    maxHeight: 500,
                    overflow: "auto",
                    bgcolor: "background.default",
                    p: 3,
                    borderRadius: 2,
                    border: 1,
                    borderColor: "divider",
                  }}
                >
                  {convertTableToText(table, index)}
                </Box>
              </CardContent>
            </Card>
          </AccordionDetails>
        </Accordion>
      ))}
    </Container>
  )
}
