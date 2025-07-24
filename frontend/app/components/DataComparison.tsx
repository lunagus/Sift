"use client"

import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Container,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Slider,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Alert,
  Divider,
} from "@mui/material"
import { 
  TrendingUp, 
  TrendingDown, 
  Remove, 
  CompareArrows,
  Settings,
  FilterList,
  Sort,
  Refresh
} from "@mui/icons-material"
import { useState } from "react"

interface DataComparisonProps {
  tables: Record<string, any>[][]
}

interface ComparisonSettings {
  maxRows: number
  sortBy: string
  sortOrder: "asc" | "desc"
  showStats: boolean
  showTrends: boolean
  priceThreshold: number
  ratingThreshold: number
  customFilters: Record<string, { min: number; max: number }>
}

export default function DataComparison({ tables }: DataComparisonProps) {
  const [comparisonType, setComparisonType] = useState<"price" | "rating" | "general" | "custom">("general")
  const [showSettings, setShowSettings] = useState<boolean>(false)
  const [settings, setSettings] = useState<ComparisonSettings>({
    maxRows: 15,
    sortBy: "",
    sortOrder: "desc",
    showStats: true,
    showTrends: true,
    priceThreshold: 0,
    ratingThreshold: 0,
    customFilters: {},
  })

  if (!tables || tables.length === 0) {
    return (
      <Container maxWidth={false} sx={{ py: 8, textAlign: "center" }}>
        <CompareArrows sx={{ fontSize: 80, color: "text.secondary", mb: 2 }} />
        <Typography variant="h5" color="text.secondary" sx={{ mb: 1 }}>
          No data available for comparison
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Extract table data to compare products, prices, ratings, and other metrics
        </Typography>
      </Container>
    )
  }

  // Find comparison-relevant columns
  const findComparisonColumns = (table: Record<string, any>[]) => {
    if (!table.length) return { price: [], rating: [], general: [], numeric: [] }
    const columns = Object.keys(table[0])

    const priceColumns = columns.filter(
      (col) =>
        col.toLowerCase().includes("price") ||
        col.toLowerCase().includes("cost") ||
        col.toLowerCase().includes("amount") ||
        table.some((row) => {
          const val = String(row[col])
          return val.includes("$") || val.includes("€") || val.includes("£")
        }),
    )

    const ratingColumns = columns.filter(
      (col) =>
        col.toLowerCase().includes("rating") ||
        col.toLowerCase().includes("score") ||
        col.toLowerCase().includes("review"),
    )

    const numericColumns = columns.filter((col) =>
      table.some((row) => !isNaN(Number(row[col])) && row[col] !== ""),
    )

    const generalColumns = columns.filter((col) => !priceColumns.includes(col) && !ratingColumns.includes(col))

    return { price: priceColumns, rating: ratingColumns, general: generalColumns, numeric: numericColumns }
  }

  const extractNumericValue = (value: any): number => {
    if (typeof value === "number") return value
    const str = String(value).replace(/[^0-9.-]/g, "")
    return Number.parseFloat(str) || 0
  }

  const formatPrice = (value: any): string => {
    const num = extractNumericValue(value)
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(num)
  }

  const applyFilters = (table: Record<string, any>[]) => {
    let filteredTable = [...table]

    // Apply price threshold filter
    if (comparisonType === "price" && settings.priceThreshold > 0) {
      const { price: priceColumns } = findComparisonColumns(table)
      filteredTable = filteredTable.filter((row) => {
        return priceColumns.some((col) => extractNumericValue(row[col]) >= settings.priceThreshold)
      })
    }

    // Apply rating threshold filter
    if (comparisonType === "rating" && settings.ratingThreshold > 0) {
      const { rating: ratingColumns } = findComparisonColumns(table)
      filteredTable = filteredTable.filter((row) => {
        return ratingColumns.some((col) => extractNumericValue(row[col]) >= settings.ratingThreshold)
      })
    }

    // Apply custom filters
    Object.entries(settings.customFilters).forEach(([column, filter]) => {
      filteredTable = filteredTable.filter((row) => {
        const value = extractNumericValue(row[column])
        return value >= filter.min && value <= filter.max
      })
    })

    return filteredTable
  }

  const sortTable = (table: Record<string, any>[]) => {
    if (!settings.sortBy) return table

    const sortedTable = [...table].sort((a, b) => {
      const aVal = extractNumericValue(a[settings.sortBy])
      const bVal = extractNumericValue(b[settings.sortBy])
      
      if (settings.sortOrder === "asc") {
        return aVal - bVal
      } else {
        return bVal - aVal
      }
    })

    return sortedTable
  }

  const renderComparisonTable = (table: Record<string, any>[], tableIndex: number) => {
    const { price: priceColumns, rating: ratingColumns, general: generalColumns, numeric: numericColumns } = findComparisonColumns(table)
    const columns = Object.keys(table[0])

    const nameColumn =
      columns.find(
        (col) =>
          col.toLowerCase().includes("name") ||
          col.toLowerCase().includes("product") ||
          col.toLowerCase().includes("item") ||
          col.toLowerCase().includes("title") ||
          col.toLowerCase().includes("model"),
      ) || columns[0]

    // Apply filters and sorting
    let processedTable = applyFilters(table)
    processedTable = sortTable(processedTable)
    processedTable = processedTable.slice(0, settings.maxRows)

    // Calculate statistics based on comparison type
    let relevantColumns: string[] = []
    let stats: any[] = []

    switch (comparisonType) {
      case "price":
        relevantColumns = priceColumns
        if (settings.showStats) {
          stats = priceColumns.map((col) => {
            const prices = table.map((row) => extractNumericValue(row[col])).filter((p) => p > 0)
            return {
              column: col,
              min: Math.min(...prices),
              max: Math.max(...prices),
              avg: prices.reduce((sum, p) => sum + p, 0) / prices.length,
              count: prices.length,
            }
          })
        }
        break
      case "rating":
        relevantColumns = ratingColumns
        if (settings.showStats) {
          stats = ratingColumns.map((col) => {
            const ratings = table.map((row) => extractNumericValue(row[col])).filter((r) => r > 0)
            return {
              column: col,
              min: Math.min(...ratings),
              max: Math.max(...ratings),
              avg: ratings.reduce((sum, r) => sum + r, 0) / ratings.length,
              count: ratings.length,
            }
          })
        }
        break
      case "custom":
        relevantColumns = numericColumns.slice(0, 5)
        break
      default:
        relevantColumns = columns.slice(0, 6)
        break
    }

    if (relevantColumns.length === 0) {
      return (
        <Card key={tableIndex} sx={{ mb: 3 }}>
          <CardContent sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No {comparisonType} data found in Table {tableIndex + 1}
            </Typography>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card key={tableIndex} sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {comparisonType === "general" ? "Data" : comparisonType.charAt(0).toUpperCase() + comparisonType.slice(1)}{" "}
              Comparison - Table {tableIndex + 1}
            </Typography>
            <Chip label={`${processedTable.length} items`} color="primary" size="small" />
          </Box>

          {/* Statistics Cards for Price/Rating */}
          {stats.length > 0 && (
            <Grid container spacing={2} sx={{ mb: 4 }}>
              {stats.map((stat, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card sx={{ bgcolor: "background.default" }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {stat.column}
                      </Typography>
                      <Typography variant="h5" color="primary.main" sx={{ mb: 1 }}>
                        {comparisonType === "price" ? formatPrice(stat.avg) : stat.avg.toFixed(1)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: "block" }}>
                        Average of {stat.count} items
                      </Typography>
                      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                        <Chip
                          label={`Min: ${comparisonType === "price" ? formatPrice(stat.min) : stat.min.toFixed(1)}`}
                          size="small"
                          color="success"
                        />
                        <Chip
                          label={`Max: ${comparisonType === "price" ? formatPrice(stat.max) : stat.max.toFixed(1)}`}
                          size="small"
                          color="error"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Comparison Table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: "primary.main", fontSize: "1.1rem" }}>
                    {nameColumn}
                  </TableCell>
                  {relevantColumns.slice(0, 5).map((col) => (
                    <TableCell key={col} sx={{ fontWeight: 600, color: "primary.main", fontSize: "1.1rem" }}>
                      {col}
                    </TableCell>
                  ))}
                  {settings.showTrends && comparisonType !== "general" && (
                    <TableCell sx={{ fontWeight: 600, color: "primary.main", fontSize: "1.1rem" }}>Trend</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {processedTable.map((row, rowIndex) => {
                  let trend = "average"
                  if (settings.showTrends && comparisonType === "price" && priceColumns.length > 0) {
                    const avgPrice =
                      priceColumns.reduce((sum, col) => sum + extractNumericValue(row[col]), 0) / priceColumns.length
                    const overallAvg = stats.reduce((sum, stat) => sum + stat.avg, 0) / stats.length
                    trend = avgPrice > overallAvg * 1.1 ? "high" : avgPrice < overallAvg * 0.9 ? "low" : "average"
                  } else if (settings.showTrends && comparisonType === "rating" && ratingColumns.length > 0) {
                    const avgRating =
                      ratingColumns.reduce((sum, col) => sum + extractNumericValue(row[col]), 0) / ratingColumns.length
                    const overallAvg = stats.reduce((sum, stat) => sum + stat.avg, 0) / stats.length
                    trend = avgRating > overallAvg * 1.05 ? "high" : avgRating < overallAvg * 0.95 ? "low" : "average"
                  }

                  return (
                    <TableRow
                      key={rowIndex}
                      sx={{
                        "&:nth-of-type(odd)": {
                          bgcolor: "rgba(255, 152, 0, 0.02)",
                        },
                        "&:hover": {
                          bgcolor: "rgba(255, 152, 0, 0.05)",
                        },
                      }}
                    >
                      <TableCell sx={{ fontWeight: 500, fontSize: "1rem" }}>{row[nameColumn]}</TableCell>
                      {relevantColumns.slice(0, 5).map((col) => (
                        <TableCell key={col} sx={{ fontSize: "1rem" }}>
                          {comparisonType === "price" && priceColumns.includes(col)
                            ? formatPrice(row[col])
                            : row[col] || "-"}
                        </TableCell>
                      ))}
                      {settings.showTrends && comparisonType !== "general" && (
                        <TableCell>
                          {trend === "high" && (
                            <Chip
                              icon={<TrendingUp />}
                              label={comparisonType === "price" ? "Expensive" : "High"}
                              color="error"
                              size="small"
                            />
                          )}
                          {trend === "low" && (
                            <Chip
                              icon={<TrendingDown />}
                              label={comparisonType === "price" ? "Affordable" : "Low"}
                              color="success"
                              size="small"
                            />
                          )}
                          {trend === "average" && (
                            <Chip icon={<Remove />} label="Average" color="default" size="small" />
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    )
  }

  const resetSettings = () => {
    setSettings({
      maxRows: 15,
      sortBy: "",
      sortOrder: "desc",
      showStats: true,
      showTrends: true,
      priceThreshold: 0,
      ratingThreshold: 0,
      customFilters: {},
    })
  }

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
            <Button
              variant="outlined"
              startIcon={<Settings />}
              onClick={() => setShowSettings(!showSettings)}
              size="small"
            >
              Settings
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={resetSettings}
              size="small"
            >
              Reset
            </Button>
          </Box>
        </Box>

        {/* Advanced Settings Panel */}
        {showSettings && (
          <Accordion defaultExpanded sx={{ mb: 3 }}>
            <AccordionSummary expandIcon={<FilterList />}>
              <Typography variant="h6">Comparison Settings</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Max Rows to Display
                  </Typography>
                  <TextField
                    type="number"
                    value={settings.maxRows}
                    onChange={(e) => setSettings({ ...settings, maxRows: Math.max(1, Number(e.target.value)) })}
                    size="small"
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Sort By Column
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={settings.sortBy}
                      onChange={(e) => setSettings({ ...settings, sortBy: e.target.value })}
                    >
                      <MenuItem value="">No Sorting</MenuItem>
                      {tables[0] && Object.keys(tables[0][0] || {}).map((col) => (
                        <MenuItem key={col} value={col}>
                          {col}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Sort Order
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={settings.sortOrder}
                      onChange={(e) => setSettings({ ...settings, sortOrder: e.target.value as "asc" | "desc" })}
                    >
                      <MenuItem value="desc">Descending</MenuItem>
                      <MenuItem value="asc">Ascending</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <FormControlLabel
                      control={<Switch checked={settings.showStats} onChange={(e) => setSettings({ ...settings, showStats: e.target.checked })} />}
                      label="Show Statistics"
                    />
                    <FormControlLabel
                      control={<Switch checked={settings.showTrends} onChange={(e) => setSettings({ ...settings, showTrends: e.target.checked })} />}
                      label="Show Trends"
                    />
                  </Box>
                </Grid>
                
                {/* Threshold Filters */}
                {comparisonType === "price" && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Minimum Price Threshold
                    </Typography>
                    <TextField
                      type="number"
                      value={settings.priceThreshold}
                      onChange={(e) => setSettings({ ...settings, priceThreshold: Number(e.target.value) })}
                      size="small"
                      fullWidth
                      placeholder="0"
                    />
                  </Grid>
                )}
                
                {comparisonType === "rating" && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Minimum Rating Threshold
                    </Typography>
                    <TextField
                      type="number"
                      value={settings.ratingThreshold}
                      onChange={(e) => setSettings({ ...settings, ratingThreshold: Number(e.target.value) })}
                      size="small"
                      fullWidth
                      placeholder="0"
                    />
                  </Grid>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Comparison Type Selector */}
        <Box sx={{ display: "flex", gap: 2, mb: 4, flexWrap: "wrap" }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Comparison Type</InputLabel>
            <Select
              value={comparisonType}
              label="Comparison Type"
              onChange={(e) => setComparisonType(e.target.value as any)}
            >
              <MenuItem value="general">General Data</MenuItem>
              <MenuItem value="price">Price Analysis</MenuItem>
              <MenuItem value="rating">Rating Analysis</MenuItem>
              <MenuItem value="custom">Custom Numeric</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Summary Info */}
        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
          <Chip label={`${tables.length} tables`} color="primary" size="medium" />
          <Chip label={`${settings.maxRows} max rows`} color="secondary" size="medium" />
          {settings.sortBy && (
            <Chip label={`Sorted by ${settings.sortBy}`} color="info" size="medium" />
          )}
        </Box>
      </Box>

      {tables.map((table, index) => renderComparisonTable(table, index))}
    </Container>
  )
}
