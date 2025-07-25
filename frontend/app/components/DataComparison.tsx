"use client"

import { useState, useMemo } from "react"
import { Box, Typography, Container, Button, Chip, Table, TableHead, TableRow, TableCell, TableBody, Checkbox, Menu, MenuItem, OutlinedInput, ListItemText } from "@mui/material"
import FileCopyIcon from "@mui/icons-material/FileCopy"
import DownloadIcon from "@mui/icons-material/Download"
import RestartAltIcon from "@mui/icons-material/RestartAlt"
import StarIcon from "@mui/icons-material/Star"
import StarBorderIcon from "@mui/icons-material/StarBorder"
import ColumnSelector from "./ColumnSelector"
import { useTheme } from "@mui/material/styles"
import DataExportMenu from "./DataExportMenu"
import RowSelector from "./RowSelector"
import AIInsights from "./AIInsights"
import SmartToyIcon from "@mui/icons-material/SmartToy"

export default function DataComparison({ tables }: { tables: Record<string, any>[][] }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const rowBg = isDark ? '#232323' : '#fff';
  const cellColor = isDark ? '#fff' : '#111';
  // State for selected table, rows, columns, and pinned items
  const [selectedTable, setSelectedTable] = useState(0)
  const [selectedRows, setSelectedRows] = useState<number[]>([])
  const [pinnedRows, setPinnedRows] = useState<number[]>([])
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [columnSelectorAnchor, setColumnSelectorAnchor] = useState<null | HTMLElement>(null)
  const [showOnlyDiffs, setShowOnlyDiffs] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)

  const currentTable = tables[selectedTable] || []
  const columns = Object.keys(currentTable[0] || {})
  const visibleColumns = selectedColumns.length > 0 ? selectedColumns : columns
  const allRows: (Record<string, any> & { _rowIndex: number })[] = currentTable.map((row, idx) => ({ ...row, _rowIndex: idx }))
  const comparedRows = [...pinnedRows, ...selectedRows.filter(idx => !pinnedRows.includes(idx))]
  const comparedData: (Record<string, any> & { _rowIndex: number })[] = comparedRows.map(idx => allRows[idx]).filter(Boolean)

  // Compute diffs for each field
  const diffs: Record<string, boolean> = {}
  for (const col of visibleColumns) {
    const values = comparedData.map(row => row[col])
    diffs[col] = values.some(v => v !== values[0])
  }

  const rowsToExport = comparedData.length > 0 ? comparedData : allRows

  // Export/Copy logic
  const handleExportCSV = () => {
    if (!visibleColumns.length || !comparedData.length) return
    const headers = ["Attribute", ...comparedData.map((row, i) => `Item ${i+1}`)]
    const csvRows = [headers.join(",")]
    visibleColumns.forEach(col => {
      csvRows.push([col, ...comparedData.map(row => (row[col] ?? "").toString().replace(/"/g, '""'))].join(","))
    })
    const csvContent = csvRows.join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `sift-comparison.csv`
    a.click()
    URL.revokeObjectURL(url)
  }
  const handleCopy = () => {
    if (!visibleColumns.length || !comparedData.length) return
    const headers = ["Attribute", ...comparedData.map((row, i) => `Item ${i+1}`)]
    const tsvRows = [headers.join("\t")]
    visibleColumns.forEach(col => {
      tsvRows.push([col, ...comparedData.map(row => row[col] ?? "")].join("\t"))
    })
    navigator.clipboard.writeText(tsvRows.join("\n"))
  }

  // UI
  return (
    <Container maxWidth={false} sx={{ py: 4, px: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Data Comparison Analysis
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Compare products, prices, ratings, and other metrics across your extracted data
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <DataExportMenu data={rowsToExport} columns={visibleColumns} fileName={`sift-comparison-table-${selectedTable + 1}`} exportOptions={["csv", "json", "txt", "copy", "print"]} />
            <Button variant="outlined" startIcon={<RestartAltIcon />} onClick={() => { setSelectedRows([]); setPinnedRows([]); setSelectedColumns([]); }} size="small">
              Reset
            </Button>
            <Button variant="outlined" onClick={() => setShowOnlyDiffs(v => !v)} size="small">
              {showOnlyDiffs ? "Show All" : "Show Only Differences"}
            </Button>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 2, mb: 2, alignItems: "center" }}>
          <Button variant="outlined" onClick={e => setColumnSelectorAnchor(e.currentTarget)} size="small">
            Select Columns
          </Button>
          <Menu anchorEl={columnSelectorAnchor} open={Boolean(columnSelectorAnchor)} onClose={() => setColumnSelectorAnchor(null)}>
            <ColumnSelector columns={columns} selectedColumns={visibleColumns} onChange={cols => { setSelectedColumns(cols); setColumnSelectorAnchor(null); }} columnTypes={{}} minColumns={1} />
          </Menu>
          <Typography variant="body2" color="text.secondary">
            {comparedData.length} items compared, {visibleColumns.length} columns
                  </Typography>
                  </Box>
        <Box sx={{ mb: 2 }}>
          <RowSelector
            rowCount={allRows.length}
            selectedRows={selectedRows}
            onChange={rows => setSelectedRows(rows)}
          />
          <Typography variant="subtitle2">Select items to compare:</Typography>
          <Table size="small" sx={{ minWidth: 600, mb: 1 }}>
            <TableHead>
              <TableRow>
                <TableCell></TableCell>
                <TableCell></TableCell>
                {columns.slice(0, 5).map(col => <TableCell key={col} sx={{ fontWeight: 600 }}>{col}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {allRows.slice(0, 50).map((row, idx) => (
                <TableRow key={idx} sx={{ background: pinnedRows.includes(idx) ? theme.palette.action.selected : undefined }}>
                  <TableCell>
                    <Checkbox
                      checked={selectedRows.includes(idx)}
                      onChange={() => setSelectedRows(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx])}
                    />
                  </TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => setPinnedRows(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx])}>
                      {pinnedRows.includes(idx) ? <StarIcon color="warning" /> : <StarBorderIcon />}
                    </Button>
                  </TableCell>
                  {columns.slice(0, 5).map(col => <TableCell key={col}>{String(row[col]).slice(0, 20)}{String(row[col]).length > 20 ? "..." : ""}</TableCell>)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Box>
      {/* Comparison Table */}
      <Box sx={{ overflowX: "auto" }}>
        <Table size="medium" sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, fontSize: "1.1rem", bgcolor: rowBg, color: cellColor }}>Attribute</TableCell>
              {comparedData.map((row, i) => (
                <TableCell key={i} sx={{ fontWeight: 700, fontSize: "1.1rem", bgcolor: rowBg, color: cellColor }}>
                  Item {i+1}{pinnedRows.includes(row._rowIndex) && <StarIcon fontSize="small" color="warning" sx={{ ml: 1 }} />}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleColumns.filter(col => !showOnlyDiffs || diffs[col]).map(col => (
              <TableRow key={col} sx={{ background: diffs[col] ? theme.palette.action.hover : undefined }}>
                <TableCell sx={{ fontWeight: 600, color: cellColor }}>{col}</TableCell>
                {comparedData.map((row, i) => (
                  <TableCell key={i} sx={{ color: cellColor, fontWeight: diffs[col] ? 700 : 400 }}>
                    {String((row as any)[col])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
      <AIInsights open={aiOpen} onClose={() => setAiOpen(false)} context={{ blockType: "comparison", blockData: comparedData }} />
      <Box sx={{ position: "fixed", bottom: 32, right: 32, zIndex: 1200 }}>
        <Button variant="contained" color="primary" startIcon={<SmartToyIcon />} sx={{ borderRadius: "50%", minWidth: 64, minHeight: 64, boxShadow: 4 }} onClick={() => setAiOpen(true)}>
          AI
        </Button>
      </Box>
    </Container>
  )
}
