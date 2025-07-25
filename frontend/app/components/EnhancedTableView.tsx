"use client"

import { useState, useMemo } from "react"
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Chip,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Button,
  Tooltip,
  Container,
  Paper,
} from "@mui/material"
import { Search, FilterList, Sort, ArrowUpward, ArrowDownward, Analytics } from "@mui/icons-material"
import ColumnSelector from "./ColumnSelector"
import FileCopyIcon from "@mui/icons-material/FileCopy"
import DownloadIcon from "@mui/icons-material/Download"
import RestartAltIcon from "@mui/icons-material/RestartAlt"
import CloseIcon from "@mui/icons-material/Close"
import Dialog from "@mui/material/Dialog"
import DialogTitle from "@mui/material/DialogTitle"
import DialogContent from "@mui/material/DialogContent"
import IconButton from "@mui/material/IconButton"
import { useTheme } from "@mui/material/styles"
import DataExportMenu from "./DataExportMenu"
import RowSelector from "./RowSelector"
import AIInsights from "./AIInsights"
import SmartToyIcon from "@mui/icons-material/SmartToy"

interface EnhancedTableViewProps {
  tables: Record<string, any>[][]
  viewMode: "comfortable" | "compact"
}

type SortDirection = "asc" | "desc" | null

export default function EnhancedTableView({ tables, viewMode }: EnhancedTableViewProps) {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(viewMode === "comfortable" ? 20 : 30)
  const [selectedTable, setSelectedTable] = useState(0)
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null)
  // Change columnFilters to store {operator, value}
  type ColumnFilter = { operator: string, value: any }
  const [columnFilters, setColumnFilters] = useState<Record<string, ColumnFilter>>({})
  const [columnSelectorAnchor, setColumnSelectorAnchor] = useState<null | HTMLElement>(null)
  const [selectedColumnsByTable, setSelectedColumnsByTable] = useState<Record<number, string[]>>({})
  const [columnOrderByTable, setColumnOrderByTable] = useState<Record<number, string[]>>({})
  const [cellModal, setCellModal] = useState<{ open: boolean; value: string }>({ open: false, value: "" })
  const [selectedRowsByTable, setSelectedRowsByTable] = useState<Record<number, number[]>>({})
  const [aiOpen, setAiOpen] = useState(false)

  const currentTable = Array.isArray(tables[selectedTable]) ? tables[selectedTable] : []
  const columns = Object.keys(currentTable[0] || {})
  const columnOrder = columnOrderByTable[selectedTable] || columns
  const selectedColumns = selectedColumnsByTable[selectedTable] || columns
  // Only show columns that are both selected and in the current order
  const visibleColumns = columnOrder.filter((col) => selectedColumns.includes(col))

  // Compute column types for display
  const columnTypes: Record<string, string> = useMemo(() => {
    const types: Record<string, string> = {}
    for (const col of columns) {
      const sample = currentTable.find((row) => row[col] != null)?.[col]
      if (sample == null) {
        types[col] = "string"
        continue
      }
      const cleanValue = String(sample).replace(/[^0-9.-]/g, "")
      if (!isNaN(Number(cleanValue)) && cleanValue !== "") types[col] = "number"
      else if (String(sample).match(/^\d{4}-\d{2}-\d{2}/)) types[col] = "date"
      else if (String(sample).includes("$") || String(sample).includes("€") || String(sample).includes("£")) types[col] = "price"
      else types[col] = "string"
    }
    return types
  }, [columns, currentTable])

  const processedData = useMemo(() => {
    const filtered = currentTable.filter((row) => {
      const matchesSearch =
        searchTerm === "" ||
        Object.values(row).some((value) => String(value).toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesFilters = Object.entries(columnFilters).every(([column, filter]) => {
        if (!filter || !filter.value) return true
        const cellValue = row[column]
        if (filter.operator === ">") return Number(cellValue) > Number(filter.value)
        if (filter.operator === ">=") return Number(cellValue) >= Number(filter.value)
        if (filter.operator === "<") return Number(cellValue) < Number(filter.value)
        if (filter.operator === "<=") return Number(cellValue) <= Number(filter.value)
        if (filter.operator === "==" || filter.operator === "equals") return String(cellValue) === String(filter.value)
        if (filter.operator === "contains") return String(cellValue).toLowerCase().includes(String(filter.value).toLowerCase())
        // fallback: contains
        return String(cellValue).toLowerCase().includes(String(filter.value).toLowerCase())
      })

      return matchesSearch && matchesFilters
    })

    if (sortColumn && sortDirection) {
      filtered.sort((a, b) => {
        const aVal = a[sortColumn]
        const bVal = b[sortColumn]

        const aNum = Number(String(aVal).replace(/[^0-9.-]/g, ""))
        const bNum = Number(String(bVal).replace(/[^0-9.-]/g, ""))

        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortDirection === "asc" ? aNum - bNum : bNum - aNum
        }

        const aStr = String(aVal).toLowerCase()
        const bStr = String(bVal).toLowerCase()

        return sortDirection === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr)
      })
    }

    return filtered
  }, [currentTable, searchTerm, columnFilters, sortColumn, sortDirection])

  const paginatedData = processedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
  const selectedRows = selectedRowsByTable[selectedTable] || []
  const rowCount = processedData.length
  const rowsToExport = selectedRows.length > 0 ? selectedRows.map(i => processedData[i]) : processedData

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : sortDirection === "desc" ? null : "asc")
      if (sortDirection === "desc") {
        setSortColumn(null)
      }
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const handleColumnFilter = (column: string, value: string) => {
    setColumnFilters((prev) => ({
      ...prev,
      [column]: { operator: "contains", value },
    }))
    setPage(0)
  }

  const clearFilters = () => {
    setColumnFilters({})
    setSearchTerm("")
    setSortColumn(null)
    setSortDirection(null)
    setPage(0)
  }

  const getColumnType = (column: string) => {
    const sample = currentTable.find((row) => row[column] != null)?.[column]
    if (sample == null) return "string"

    const cleanValue = String(sample).replace(/[^0-9.-]/g, "")
    if (!isNaN(Number(cleanValue)) && cleanValue !== "") return "number"
    if (String(sample).match(/^\d{4}-\d{2}-\d{2}/)) return "date"
    if (String(sample).includes("$") || String(sample).includes("€") || String(sample).includes("£")) return "price"
    return "string"
  }

  // Column selector handlers
  const handleOpenColumnSelector = (e: React.MouseEvent<HTMLElement>) => setColumnSelectorAnchor(e.currentTarget)
  const handleCloseColumnSelector = () => setColumnSelectorAnchor(null)
  const handleColumnSelectionChange = (cols: string[]) => {
    setSelectedColumnsByTable((prev) => ({ ...prev, [selectedTable]: cols }))
    setColumnSelectorAnchor(null)
  }

  const handleColumnOrderChange = (order: string[]) => {
    setColumnOrderByTable((prev) => ({ ...prev, [selectedTable]: order }))
  }

  // Export CSV logic
  const handleExportCSV = () => {
    if (!selectedColumns.length || !processedData.length) return
    const headers = selectedColumns
    const csvRows = [headers.join(",")]
    processedData.forEach((row) => {
      csvRows.push(headers.map((col) => `"${(row[col] ?? "").toString().replace(/"/g, '""')}"`).join(","))
    })
    const csvContent = csvRows.join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `sift-table-${selectedTable + 1}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Copy Table logic
  const handleCopyTable = () => {
    if (!selectedColumns.length || !processedData.length) return
    const headers = selectedColumns
    const tsvRows = [headers.join("\t")]
    processedData.forEach((row) => {
      tsvRows.push(headers.map((col) => (row[col] ?? "")).join("\t"))
    })
    navigator.clipboard.writeText(tsvRows.join("\n"))
  }

  // Reset Columns logic
  const handleResetColumns = () => {
    setSelectedColumnsByTable((prev) => ({ ...prev, [selectedTable]: columns }))
    setColumnOrderByTable((prev) => ({ ...prev, [selectedTable]: columns }))
  }

  // Cell click handler for modal
  const handleCellClick = (value: string) => {
    if (value && value.length > 40) setCellModal({ open: true, value })
  }
  const handleCloseCellModal = () => setCellModal({ open: false, value: "" })

  const handleApplyAISuggestion = (action: any) => {
    if (action.action === "filter" && action.column && action.value !== undefined) {
      setColumnFilters(prev => ({
        ...prev,
        [action.column]: { operator: action.operator, value: action.value },
      }))
      setAiOpen(false)
    }
  }

  const rowHeight = viewMode === "comfortable" ? 80 : 64
  const cellPadding = viewMode === "comfortable" ? 3 : 2
  const fontSize = viewMode === "comfortable" ? "1.1rem" : "1rem"

  if (!tables || tables.length === 0 || currentTable.length === 0) {
    return (
      <Container maxWidth={false} sx={{ py: 8, textAlign: "center" }}>
        <Analytics sx={{ fontSize: 80, color: "text.secondary", mb: 2 }} />
        <Typography variant="h5" color="text.secondary" sx={{ mb: 1 }}>
          No table data available
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Try extracting data from a different URL or check if the website contains structured tables
        </Typography>
      </Container>
    )
  }

  return (
    <Container maxWidth={false} sx={{ py: 4, px: 4 }}>
      {/* Enhanced Controls */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Data Tables Analysis
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Interactive table view with sorting, filtering, and search capabilities
            </Typography>
          </Box>
          {tables.length > 1 && (
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Select Table</InputLabel>
              <Select
                value={selectedTable}
                label="Select Table"
                onChange={(e) => {
                  setSelectedTable(Number(e.target.value))
                  setPage(0)
                  clearFilters()
                }}
              >
                {tables.map((_, index) => (
                  <MenuItem key={index} value={index}>
                    Table {index + 1} ({tables[index].length} rows)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <Box sx={{ display: "flex", gap: 1 }}>
            <DataExportMenu data={rowsToExport} columns={selectedColumns} fileName={`sift-table-${selectedTable + 1}`} exportOptions={["csv", "json", "txt", "copy", "print"]} />
            <Button variant="outlined" startIcon={<RestartAltIcon />} onClick={handleResetColumns} size="small">
              Reset Columns
            </Button>
          </Box>
        </Box>
        {/* Row Selector */}
        <RowSelector
          rowCount={rowCount}
          selectedRows={selectedRows}
          onChange={rows => setSelectedRowsByTable(prev => ({ ...prev, [selectedTable]: rows }))}
        />
        {/* Search and Filter Controls */}
        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap", alignItems: "center" }}>
          <TextField
            placeholder="Search across all columns..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setPage(0)
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 300, flexGrow: 1 }}
            size="medium"
          />

          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={(e) => setFilterAnchor(e.currentTarget)}
            size="large"
          >
            Column Filters
          </Button>

          <Button
            variant="outlined"
            onClick={clearFilters}
            disabled={!searchTerm && Object.keys(columnFilters).length === 0 && !sortColumn}
            size="large"
          >
            Clear All
          </Button>
        </Box>

        {/* Active Filters Display */}
        {(Object.keys(columnFilters).length > 0 || sortColumn) && (
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
            {Object.entries(columnFilters).map(
              ([column, filter]) =>
                filter && (
                  <Chip
                    key={column}
                    label={`${column}: ${filter.operator} ${filter.value}`}
                    onDelete={() => handleColumnFilter(column, "")}
                    color="primary"
                    variant="outlined"
                  />
                ),
            )}
            {sortColumn && (
              <Chip
                label={`Sorted by ${sortColumn} (${sortDirection})`}
                onDelete={() => {
                  setSortColumn(null)
                  setSortDirection(null)
                }}
                color="secondary"
                variant="outlined"
              />
            )}
          </Box>
        )}
      </Box>

      {/* Full Width Table */}
      <Paper elevation={2} sx={{ width: "100%", overflow: "auto" }}>
        <Box sx={{ p: 4, borderBottom: 1, borderColor: "divider", bgcolor: "background.default" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Table {selectedTable + 1}
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Chip label={`${processedData.length} of ${currentTable.length} rows`} color="primary" size="medium" />
              <Chip label={`${columns.length} columns`} color="secondary" size="medium" />
            </Box>
          </Box>
        </Box>

        <TableContainer sx={{ width: "100%", maxHeight: "70vh", overflowX: "auto" }}>
          <Table stickyHeader size="medium">
            <TableHead>
              <TableRow>
                {visibleColumns.map((column, index) => (
                  <TableCell
                    key={index}
                    sx={{
                      bgcolor: "background.paper",
                      fontWeight: 700,
                      fontSize: "1.2rem",
                      color: theme.palette.text.primary,
                      borderBottom: 3,
                      borderColor: "primary.main",
                      minWidth: 180,
                      position: "sticky",
                      top: 0,
                      left: index === 0 ? 0 : undefined,
                      zIndex: index === 0 ? 12 : 10,
                      py: 3,
                      backgroundClip: "padding-box",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Tooltip title={`Click to sort by ${column}`}>
                        <Button
                          variant="text"
                          onClick={() => handleSort(column)}
                          sx={{
                            p: 0,
                            minWidth: "auto",
                            color: "inherit",
                            fontWeight: 700,
                            fontSize: "1.2rem",
                            textTransform: "none",
                          }}
                          endIcon={
                            sortColumn === column ? (
                              sortDirection === "asc" ? (
                                <ArrowUpward />
                              ) : (
                                <ArrowDownward />
                              )
                            ) : (
                              <Sort sx={{ opacity: 0.3 }} />
                            )
                          }
                        >
                          {column}
                        </Button>
                      </Tooltip>
                      <Chip
                        label={getColumnType(column)}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: "0.75rem", height: 22 }}
                      />
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  sx={{
                    height: rowHeight,
                    backgroundColor: rowIndex % 2 === 0 ? theme.palette.background.paper : theme.palette.background.default,
                    "&:hover": {
                      bgcolor: theme.palette.action.hover,
                      cursor: "pointer",
                    },
                  }}
                >
                  {visibleColumns.map((column, colIndex) => {
                    const value = row[column]
                    const displayValue = value !== null && value !== undefined ? String(value) : "-"
                    const isTruncated = displayValue.length > 40
                    return (
                      <TableCell
                        key={colIndex}
                        sx={{
                          fontSize: fontSize,
                          maxWidth: 300,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "pre-line",
                          py: cellPadding,
                          px: 3,
                          background: undefined,
                          color: theme.palette.text.primary,
                          cursor: isTruncated ? "pointer" : undefined,
                        }}
                        title={isTruncated ? displayValue : undefined}
                        onClick={() => handleCellClick(displayValue)}
                      >
                        {isTruncated ? displayValue.slice(0, 40) + "..." : displayValue}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={processedData.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(Number.parseInt(e.target.value, 10))
            setPage(0)
          }}
          rowsPerPageOptions={[15, 20, 30, 50, 100]}
          sx={{
            borderTop: 1,
            borderColor: "divider",
            "& .MuiTablePagination-toolbar": {
              minHeight: 72,
            },
            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
              fontSize: "1.1rem",
            },
          }}
        />
      </Paper>

      {/* Column Filter Menu */}
      <Menu
        anchorEl={filterAnchor}
        open={Boolean(filterAnchor)}
        onClose={() => setFilterAnchor(null)}
        PaperProps={{
          sx: { minWidth: 300, maxHeight: 400 },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Column Filters
          </Typography>
          {columns.map((column) => (
            <TextField
              key={column}
              fullWidth
              label={`Filter ${column}`}
              value={columnFilters[column]?.value || ""}
              onChange={(e) => handleColumnFilter(column, e.target.value)}
              sx={{ mb: 2 }}
              size="small"
            />
          ))}
        </Box>
      </Menu>

      {/* Column Selector Menu */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button
          variant="outlined"
          onClick={handleOpenColumnSelector}
          size="small"
          sx={{ mr: 1 }}
        >
          Select Columns
        </Button>
        <Menu
          anchorEl={columnSelectorAnchor}
          open={Boolean(columnSelectorAnchor)}
          onClose={handleCloseColumnSelector}
        >
          <ColumnSelector
            columns={columns}
            selectedColumns={selectedColumns}
            onChange={handleColumnSelectionChange}
            onOrderChange={handleColumnOrderChange}
            columnTypes={columnTypes}
            minColumns={1}
          />
        </Menu>
      </Box>

      {/* Cell Modal for full value */}
      <Dialog open={cellModal.open} onClose={handleCloseCellModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          Cell Value
          <IconButton
            aria-label="close"
            onClick={handleCloseCellModal}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ fontFamily: "monospace", fontSize: "1.1rem", whiteSpace: "pre-line" }}>{cellModal.value}</Box>
        </DialogContent>
      </Dialog>
      <AIInsights open={aiOpen} onClose={() => setAiOpen(false)} context={{ blockType: "table", blockData: currentTable }} onApplyAction={handleApplyAISuggestion} />
      <Box sx={{ position: "fixed", bottom: 32, right: 32, zIndex: 1200 }}>
        <Button variant="contained" color="primary" startIcon={<SmartToyIcon />} sx={{ borderRadius: "50%", minWidth: 64, minHeight: 64, boxShadow: 4 }} onClick={() => setAiOpen(true)}>
          AI
        </Button>
      </Box>
    </Container>
  )
}
