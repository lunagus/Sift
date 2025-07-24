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

interface EnhancedTableViewProps {
  tables: Record<string, any>[][]
  viewMode: "comfortable" | "compact"
}

type SortDirection = "asc" | "desc" | null

export default function EnhancedTableView({ tables, viewMode }: EnhancedTableViewProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(viewMode === "comfortable" ? 20 : 30)
  const [selectedTable, setSelectedTable] = useState(0)
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null)
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})

  const currentTable = Array.isArray(tables[selectedTable]) ? tables[selectedTable] : []

  const columns = Object.keys(currentTable[0] || {})

  const processedData = useMemo(() => {
    const filtered = currentTable.filter((row) => {
      const matchesSearch =
        searchTerm === "" ||
        Object.values(row).some((value) => String(value).toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesFilters = Object.entries(columnFilters).every(([column, filter]) => {
        if (!filter) return true
        return String(row[column]).toLowerCase().includes(filter.toLowerCase())
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
      [column]: value,
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
        </Box>

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
                    label={`${column}: ${filter}`}
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
      <Paper elevation={2} sx={{ width: "100%", overflow: "hidden" }}>
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

        <TableContainer sx={{ width: "100%", maxHeight: "70vh" }}>
          <Table stickyHeader size="medium">
            <TableHead>
              <TableRow>
                {columns.map((column, index) => (
                  <TableCell
                    key={index}
                    sx={{
                      bgcolor: "background.paper",
                      fontWeight: 700,
                      fontSize: "1.2rem",
                      color: "primary.main",
                      borderBottom: 3,
                      borderColor: "primary.main",
                      minWidth: 180,
                      position: "sticky",
                      top: 0,
                      zIndex: 10,
                      py: 3,
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
                    "&:nth-of-type(odd)": {
                      bgcolor: "rgba(255, 152, 0, 0.02)",
                    },
                    "&:hover": {
                      bgcolor: "rgba(255, 152, 0, 0.08)",
                      cursor: "pointer",
                    },
                  }}
                >
                  {columns.map((column, colIndex) => (
                    <TableCell
                      key={colIndex}
                      sx={{
                        fontSize: fontSize,
                        maxWidth: 300,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        py: cellPadding,
                        px: 3,
                      }}
                      title={String(row[column] || "")}
                    >
                      {row[column] !== null && row[column] !== undefined ? String(row[column]) : "-"}
                    </TableCell>
                  ))}
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
              value={columnFilters[column] || ""}
              onChange={(e) => handleColumnFilter(column, e.target.value)}
              sx={{ mb: 2 }}
              size="small"
            />
          ))}
        </Box>
      </Menu>
    </Container>
  )
}
