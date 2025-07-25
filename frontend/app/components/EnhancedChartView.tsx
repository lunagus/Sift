"use client"

import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Container,
  Slider,
  TextField,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Menu,
  Checkbox,
  OutlinedInput,
  ListItemText,
} from "@mui/material"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  Area,
  AreaChart,
} from "recharts"
import { useState, useMemo } from "react"
import { 
  BarChart as BarIcon, 
  ShowChart, 
  PieChart as PieIcon, 
  ScatterPlot,
  ExpandMore,
  Settings,
  Refresh,
  Download,
  RestartAlt,
  TableView,
  Palette,
  Label,
  FileCopy
} from "@mui/icons-material"
import ColumnSelector from "./ColumnSelector"
import DownloadIcon from "@mui/icons-material/Download"
import RestartAltIcon from "@mui/icons-material/RestartAlt"
import TableViewIcon from "@mui/icons-material/TableView"
import PaletteIcon from "@mui/icons-material/Palette"
import LabelIcon from "@mui/icons-material/Label"
import FileCopyIcon from "@mui/icons-material/FileCopy"
import { useRef } from "react"
import { useTheme } from "@mui/material/styles"
import DataExportMenu from "./DataExportMenu"
import RowSelector from "./RowSelector"
import AIInsights from "./AIInsights"
import SmartToyIcon from "@mui/icons-material/SmartToy"

interface EnhancedChartViewProps {
  tables: Record<string, any>[][]
}

// Vibrant, distinct colors for better visual clarity
const CHART_COLORS = [
  "#2563eb", // Blue
  "#dc2626", // Red
  "#16a34a", // Green
  "#ca8a04", // Yellow
  "#9333ea", // Purple
  "#c2410c", // Orange
  "#0891b2", // Cyan
  "#be123c", // Rose
  "#4338ca", // Indigo
  "#059669", // Emerald
]

export default function EnhancedChartView({ tables }: EnhancedChartViewProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const cellBg = isDark ? '#232323' : '#fff';
  const cellColor = isDark ? '#fff' : '#111';
  const [chartType, setChartType] = useState<"bar" | "line" | "pie" | "scatter" | "area">("bar")
  const [selectedTable, setSelectedTable] = useState(0)
  const [selectedXAxis, setSelectedXAxis] = useState<string>("")
  const [selectedYAxis, setSelectedYAxis] = useState<string>("")
  
  // New customization states
  const [dataPointsLimit, setDataPointsLimit] = useState<number>(25)
  const [showGrid, setShowGrid] = useState<boolean>(true)
  const [showLegend, setShowLegend] = useState<boolean>(true)
  const [chartHeight, setChartHeight] = useState<number>(600)
  const [maxColumns, setMaxColumns] = useState<number>(6)
  const [showSettings, setShowSettings] = useState<boolean>(false)
  
  // New data selection states
  const [dataSelectionMode, setDataSelectionMode] = useState<"first" | "random" | "top" | "custom" | "filtered">("first")
  const [selectedDataPoints, setSelectedDataPoints] = useState<number[]>([])
  const [filterColumn, setFilterColumn] = useState<string>("")
  const [filterOperator, setFilterOperator] = useState<"gt" | "lt" | "eq" | "contains" | "gte" | "lte">("gt")
  const [filterValue, setFilterValue] = useState<string>("")
  const [sortColumn, setSortColumn] = useState<string>("")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [showDataPreview, setShowDataPreview] = useState<boolean>(false)
  const [columnSelectorAnchor, setColumnSelectorAnchor] = useState<null | HTMLElement>(null)
  const [selectedColumnsByTable, setSelectedColumnsByTable] = useState<Record<number, string[]>>({})
  const [showDataTable, setShowDataTable] = useState(false)
  const [colorblindMode, setColorblindMode] = useState(false)
  const [showDataLabels, setShowDataLabels] = useState(false)
  const [hiddenSeries, setHiddenSeries] = useState<string[]>([])
  const chartRef = useRef<HTMLDivElement>(null)

  // New: robust row selection and compare mode
  const [compareMode, setCompareMode] = useState(false)
  const [selectedRows, setSelectedRows] = useState<number[]>([])
  // Multi-select for X and Y axes
  const [multiXAxis, setMultiXAxis] = useState<string[]>([])
  const [multiYAxis, setMultiYAxis] = useState<string[]>([])

  const currentTable = tables[selectedTable] || []
  const columns = Object.keys(currentTable[0] || {})
  const selectedColumns = selectedColumnsByTable[selectedTable] || columns

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

  // Only use selected columns for charting
  const chartColumns = selectedColumns
  const numericColumns = chartColumns.filter((col) =>
    currentTable.some((row) => !isNaN(Number(row[col])) && row[col] !== ""),
  )
  const stringColumns = chartColumns.filter((col) => !numericColumns.includes(col))

  if (!tables || tables.length === 0) {
    return (
      <Container maxWidth={false} sx={{ py: 8, textAlign: "center" }}>
        <ShowChart sx={{ fontSize: 80, color: "text.secondary", mb: 2 }} />
        <Typography variant="h5" color="text.secondary" sx={{ mb: 1 }}>
          No data available for visualization
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Extract table data first to create interactive charts and visualizations
        </Typography>
      </Container>
    )
  }

  const handleOpenColumnSelector = (e: React.MouseEvent<HTMLElement>) => setColumnSelectorAnchor(e.currentTarget)
  const handleCloseColumnSelector = () => setColumnSelectorAnchor(null)
  const handleColumnSelectionChange = (cols: string[]) => {
    setSelectedColumnsByTable((prev) => ({ ...prev, [selectedTable]: cols }))
    setColumnSelectorAnchor(null)
    // Reset axis selections if they are no longer valid
    if (!cols.includes(selectedXAxis)) setSelectedXAxis(cols[0] || "")
    if (!cols.includes(selectedYAxis)) setSelectedYAxis("")
  }

  // Function to process and select data points
  const processDataSelection = () => {
    let processedData = [...currentTable]

    // Apply filtering if specified
    if (filterColumn && filterValue) {
      processedData = processedData.filter((row) => {
        const cellValue = row[filterColumn]
        const filterVal = filterValue
        
        // Handle empty/null values
        if (cellValue === null || cellValue === undefined || cellValue === "") {
          return false
        }
        
        switch (filterOperator) {
          case "gt":
            return Number(cellValue) > Number(filterVal)
          case "lt":
            return Number(cellValue) < Number(filterVal)
          case "gte":
            return Number(cellValue) >= Number(filterVal)
          case "lte":
            return Number(cellValue) <= Number(filterVal)
          case "eq":
            return String(cellValue).toLowerCase() === String(filterVal).toLowerCase()
          case "contains":
            return String(cellValue).toLowerCase().includes(String(filterVal).toLowerCase())
          default:
            return true
        }
      })
    }

    // Apply sorting if specified
    if (sortColumn) {
      processedData.sort((a, b) => {
        const aVal = Number(a[sortColumn]) || 0
        const bVal = Number(b[sortColumn]) || 0
        
        if (sortOrder === "asc") {
          return aVal - bVal
        } else {
          return bVal - aVal
        }
      })
    }

    // Apply selection mode
    switch (dataSelectionMode) {
      case "first":
        return processedData.slice(0, dataPointsLimit)
      case "random":
        const shuffled = [...processedData].sort(() => 0.5 - Math.random())
        return shuffled.slice(0, dataPointsLimit)
      case "top":
        return processedData.slice(0, dataPointsLimit)
      case "filtered":
        return processedData // Return all filtered data
      case "custom":
        if (selectedDataPoints.length > 0) {
          return selectedDataPoints.map(index => processedData[index]).filter(Boolean)
        }
        return processedData.slice(0, dataPointsLimit)
      default:
        return processedData.slice(0, dataPointsLimit)
    }

    // If compareMode, only include selectedRows
    if (compareMode && selectedRows.length > 0) {
      processedData = processedData.filter((_, idx) => selectedRows.includes(idx))
    }

    return processedData
  }

  // Function to get data preview
  const getDataPreview = () => {
    const processedData = processDataSelection()
    return processedData.slice(0, 10) // Show first 10 rows as preview
  }

  // Prepare data for charts with smart selection
  const selectedTableData = processDataSelection()
  const chartData: Record<string, any>[] = selectedTableData.map((row, index) => ({
    name: row[selectedXAxis || columns[0]] || `Row ${index + 1}`,
    ...numericColumns.reduce(
      (acc, col) => ({
        ...acc,
        [col]: Number(row[col]) || 0,
      }),
      {} as Record<string, number>,
    ),
    ...stringColumns.reduce(
      (acc, col) => ({
        ...acc,
        [col]: row[col],
      }),
      {} as Record<string, any>,
    ),
  }))

  // Color palettes
  const COLORBLIND_PALETTE = [
    "#0072B2", "#E69F00", "#009E73", "#F0E442", "#56B4E9", "#D55E00", "#CC79A7", "#999999"
  ]
  const palette = colorblindMode ? COLORBLIND_PALETTE : CHART_COLORS

  // Download chart as PNG
  const handleDownloadChart = async () => {
    if (!chartRef.current) return
    const html2canvas = (await import("html2canvas")).default
    const canvas = await html2canvas(chartRef.current)
    const url = canvas.toDataURL("image/png")
    const a = document.createElement("a")
    a.href = url
    a.download = `sift-chart-${selectedTable + 1}.png`
    a.click()
  }

  // Copy chart data as TSV
  const handleCopyChartData = () => {
    if (!chartColumns.length || !chartData.length) return
    const headers = chartColumns
    const tsvRows = [headers.join("\t")]
    chartData.forEach((row) => {
      tsvRows.push(headers.map((col) => (row[col] ?? "")).join("\t"))
    })
    navigator.clipboard.writeText(tsvRows.join("\n"))
  }

  // Toggle series visibility
  const handleToggleSeries = (col: string) => {
    setHiddenSeries((prev) => prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col])
  }

  const renderChart = () => {
    const commonProps = {
      width: "100%",
      height: chartHeight,
    }

    const tooltipStyle = {
      backgroundColor: "#1f2937",
      border: "1px solid #374151",
      borderRadius: "8px",
      fontSize: "16px",
      color: "#f9fafb",
    }

    const axisStyle = {
      stroke: "#9ca3af",
      fontSize: 18,
    }
    const legendStyle = { fontSize: 18 }

    switch (chartType) {
      case "bar":
        return (
          <ResponsiveContainer {...commonProps}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" />}
              <XAxis
                dataKey={multiXAxis.length > 0 ? multiXAxis[0] : selectedXAxis || "name"}
                {...axisStyle}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis {...axisStyle} />
              <Tooltip contentStyle={tooltipStyle} />
              {showLegend && <Legend onClick={(e: any) => handleToggleSeries(e.dataKey)} wrapperStyle={legendStyle} />}
              {(multiYAxis.length > 0 ? multiYAxis : numericColumns.filter(col => !hiddenSeries.includes(col)).slice(0, maxColumns)).map((col, index) => (
                <Bar
                  key={col}
                  dataKey={col}
                  fill={palette[index % palette.length]}
                  radius={[4, 4, 0, 0]}
                  label={showDataLabels ? { position: "top", fontSize: 14 } : false}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )

      case "line":
        return (
          <ResponsiveContainer {...commonProps}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" />}
              <XAxis
                dataKey={multiXAxis.length > 0 ? multiXAxis[0] : selectedXAxis || "name"}
                {...axisStyle}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis {...axisStyle} />
              <Tooltip contentStyle={tooltipStyle} />
              {showLegend && <Legend onClick={(e: any) => handleToggleSeries(e.dataKey)} wrapperStyle={legendStyle} />}
              {(multiYAxis.length > 0 ? multiYAxis : numericColumns.filter(col => !hiddenSeries.includes(col)).slice(0, maxColumns)).map((col, index) => (
                <Line
                  key={col}
                  type="monotone"
                  dataKey={col}
                  stroke={palette[index % palette.length]}
                  strokeWidth={3}
                  dot={{ r: 6 }}
                  label={showDataLabels ? { position: "top", fontSize: 14 } : false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )

      case "area":
        return (
          <ResponsiveContainer {...commonProps}>
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" />}
              <XAxis
                dataKey={multiXAxis.length > 0 ? multiXAxis[0] : selectedXAxis || "name"}
                {...axisStyle}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis {...axisStyle} />
              <Tooltip contentStyle={tooltipStyle} />
              {showLegend && <Legend onClick={(e: any) => handleToggleSeries(e.dataKey)} wrapperStyle={legendStyle} />}
              {(multiYAxis.length > 0 ? multiYAxis : numericColumns.filter(col => !hiddenSeries.includes(col)).slice(0, Math.min(maxColumns, 4))).map((col, index) => (
                <Area
                  key={col}
                  type="monotone"
                  dataKey={col}
                  stackId="1"
                  stroke={palette[index % palette.length]}
                  fill={palette[index % palette.length]}
                  fillOpacity={0.7}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )

      case "scatter":
        const xCol = multiXAxis.length > 0 ? multiXAxis[0] : selectedXAxis || numericColumns[0]
        const yCol = multiYAxis.length > 0 ? multiYAxis[0] : selectedYAxis || numericColumns[1]

        return (
          <ResponsiveContainer {...commonProps}>
            <ScatterChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" />}
              <XAxis dataKey={xCol} {...axisStyle} type="number" domain={["dataMin", "dataMax"]} />
              <YAxis dataKey={yCol} {...axisStyle} type="number" domain={["dataMin", "dataMax"]} />
              <Tooltip contentStyle={tooltipStyle} />
              {showLegend && <Legend onClick={(e: any) => handleToggleSeries(e.dataKey)} wrapperStyle={legendStyle} />}
              <Scatter dataKey={yCol} fill={palette[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        )

      case "pie":
        const pieData = chartData.slice(0, Math.min(dataPointsLimit, 10)).map((item) => ({
          name: item.name,
          value: (item as any)[multiYAxis.length > 0 ? multiYAxis[0] : selectedYAxis || numericColumns[0]] || 0,
        }))

        return (
          <ResponsiveContainer {...commonProps}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                outerRadius={Math.min(chartHeight / 3, 200)}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={palette[index % palette.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              {showLegend && <Legend onClick={(e: any) => handleToggleSeries(e.dataKey)} wrapperStyle={legendStyle} />}
            </PieChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  const resetSettings = () => {
    setDataPointsLimit(25)
    setShowGrid(true)
    setShowLegend(true)
    setChartHeight(600)
    setMaxColumns(6)
    setSelectedXAxis("")
    setSelectedYAxis("")
    setDataSelectionMode("first")
    setSelectedDataPoints([])
    setFilterColumn("")
    setFilterOperator("gt")
    setFilterValue("")
    setSortColumn("")
    setSortOrder("desc")
    setShowDataPreview(false)
    setHiddenSeries([]) // Reset hidden series
    setCompareMode(false) // Reset compare mode
    setSelectedRows([]) // Clear selected rows
    setMultiXAxis([]) // Clear multi-select X axis
    setMultiYAxis([]) // Clear multi-select Y axis
  }

  const selectedRowsToExport = selectedRows.length > 0 ? selectedRows.map(i => chartData[i]) : chartData

  const [aiOpen, setAiOpen] = useState(false)

  return (
    <Container maxWidth={false} sx={{ py: 4, px: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Data Visualizations
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Interactive charts and graphs to explore your data patterns and insights
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <DataExportMenu data={selectedRowsToExport} columns={chartColumns} fileName={`sift-chart-${selectedTable + 1}`} exportOptions={["csv", "json", "txt", "copy", "print"]} />
            <Button variant="outlined" startIcon={<RestartAltIcon />} onClick={resetSettings} size="small">
              Reset Chart
            </Button>
            <Button variant="outlined" startIcon={<TableViewIcon />} onClick={() => setShowDataTable((v) => !v)} size="small">
              {showDataTable ? "Hide Data Table" : "Show Data Table"}
            </Button>
            <Button variant="outlined" startIcon={<PaletteIcon />} onClick={() => setColorblindMode((v) => !v)} size="small">
              {colorblindMode ? "Default Colors" : "Colorblind Mode"}
            </Button>
            <Button variant="outlined" startIcon={<LabelIcon />} onClick={() => setShowDataLabels((v) => !v)} size="small">
              {showDataLabels ? "Hide Labels" : "Show Labels"}
            </Button>
            <Button variant="outlined" startIcon={<Settings />} onClick={() => setShowSettings((v) => !v)} size="small">
              {showSettings ? "Hide Settings" : "Show Settings"}
            </Button>
            <Button variant="outlined" startIcon={<Refresh />} onClick={() => setCompareMode((v) => !v)} size="small">
              {compareMode ? "Exit Compare Mode" : "Compare Mode"}
            </Button>
          </Box>
        </Box>

        {/* Advanced Settings Panel */}
        {showSettings && (
          <Accordion defaultExpanded sx={{ mb: 3 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">Chart Customization</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Data Points Limit
                  </Typography>
                  <TextField
                    type="number"
                    value={dataPointsLimit}
                    onChange={(e) => setDataPointsLimit(Math.max(1, Number(e.target.value)))}
                    size="small"
                    fullWidth
                    helperText={`Max: ${currentTable.length}`}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Chart Height
                  </Typography>
                  <Slider
                    value={chartHeight}
                    onChange={(_, value) => setChartHeight(value as number)}
                    min={300}
                    max={800}
                    step={50}
                    marks
                    valueLabelDisplay="auto"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Max Columns
                  </Typography>
                  <Slider
                    value={maxColumns}
                    onChange={(_, value) => setMaxColumns(value as number)}
                    min={1}
                    max={10}
                    step={1}
                    marks
                    valueLabelDisplay="auto"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <FormControlLabel
                      control={<Switch checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />}
                      label="Show Grid"
                    />
                    <FormControlLabel
                      control={<Switch checked={showLegend} onChange={(e) => setShowLegend(e.target.checked)} />}
                      label="Show Legend"
                    />
                  </Box>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Data Selection Panel */}
        {showSettings && (
          <Accordion defaultExpanded sx={{ mb: 3 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">Data Selection & Filtering</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Selection Mode
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={dataSelectionMode}
                      onChange={(e) => setDataSelectionMode(e.target.value as any)}
                    >
                      <MenuItem value="first">First N Rows (Default)</MenuItem>
                      <MenuItem value="random">Random Sample</MenuItem>
                      <MenuItem value="top">Top N (Sorted)</MenuItem>
                      <MenuItem value="filtered">All Filtered Data</MenuItem>
                      <MenuItem value="custom">Custom Selection</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Filter Column
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={filterColumn}
                      onChange={(e) => setFilterColumn(e.target.value)}
                    >
                      <MenuItem value="">No Filter</MenuItem>
                      {columns.map((col) => (
                        <MenuItem key={col} value={col}>
                          {col}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Filter Operator
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={filterOperator}
                      onChange={(e) => setFilterOperator(e.target.value as any)}
                      disabled={!filterColumn}
                    >
                      <MenuItem value="gt">Greater Than</MenuItem>
                      <MenuItem value="gte">Greater Than or Equal</MenuItem>
                      <MenuItem value="lt">Less Than</MenuItem>
                      <MenuItem value="lte">Less Than or Equal</MenuItem>
                      <MenuItem value="eq">Equals</MenuItem>
                      <MenuItem value="contains">Contains</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Filter Value
                  </Typography>
                  <TextField
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    size="small"
                    fullWidth
                    disabled={!filterColumn}
                    placeholder="Enter value..."
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Sort By Column
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={sortColumn}
                      onChange={(e) => setSortColumn(e.target.value)}
                    >
                      <MenuItem value="">No Sorting</MenuItem>
                      {columns.map((col) => (
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
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                      disabled={!sortColumn}
                    >
                      <MenuItem value="desc">Descending</MenuItem>
                      <MenuItem value="asc">Ascending</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}>
                    <Typography variant="subtitle2">
                      Data Preview ({getDataPreview().length} rows shown)
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => setShowDataPreview(!showDataPreview)}
                      variant="outlined"
                    >
                      {showDataPreview ? "Hide Preview" : "Show Preview"}
                    </Button>
                  </Box>
                  
                  {showDataPreview && (
                    <Box sx={{ mt: 2, maxHeight: 200, overflow: "auto", border: "1px solid #ddd", borderRadius: 1, p: 1 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            {columns.slice(0, 5).map((col) => (
                              <TableCell key={col} sx={{ fontWeight: 600, fontSize: "0.75rem" }}>
                                {col}
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {getDataPreview().map((row, index) => (
                            <TableRow key={index}>
                              {columns.slice(0, 5).map((col) => (
                                <TableCell key={col} sx={{ fontSize: "0.75rem" }}>
                                  {String(row[col] || "").slice(0, 20)}
                                  {String(row[col] || "").length > 20 ? "..." : ""}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Chart Controls */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {tables.length > 1 && (
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Table</InputLabel>
                <Select value={selectedTable} label="Table" onChange={(e) => setSelectedTable(Number(e.target.value))}>
                  {tables.map((_, index) => (
                    <MenuItem key={index} value={index}>
                      Table {index + 1}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>X-Axis</InputLabel>
              <Select
                multiple
                value={multiXAxis}
                onChange={(e) => setMultiXAxis(e.target.value as string[])}
                input={<OutlinedInput label="X-Axis" />}
                renderValue={(selected) => selected.map(val => val).join(', ')}
              >
                {chartColumns.map((col) => (
                  <MenuItem key={col} value={col}>
                    <Checkbox checked={multiXAxis.includes(col)} />
                    <ListItemText primary={col} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Y-Axis</InputLabel>
              <Select
                multiple
                value={multiYAxis}
                onChange={(e) => setMultiYAxis(e.target.value as string[])}
                input={<OutlinedInput label="Y-Axis" />}
                renderValue={(selected) => selected.map(val => val).join(', ')}
              >
                {numericColumns.map((col) => (
                  <MenuItem key={col} value={col}>
                    <Checkbox checked={multiYAxis.includes(col)} />
                    <ListItemText primary={col} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Column Selector Button */}
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
              columnTypes={columnTypes}
              minColumns={1}
            />
          </Menu>
        </Box>

        {/* Chart Type Selector */}
        <Box sx={{ display: "flex", gap: 2, mb: 4, flexWrap: "wrap" }}>
          {[
            { type: "bar", label: "Bar Chart", icon: <BarIcon /> },
            { type: "line", label: "Line Chart", icon: <ShowChart /> },
            { type: "area", label: "Area Chart", icon: <ShowChart /> },
            { type: "pie", label: "Pie Chart", icon: <PieIcon /> },
            { type: "scatter", label: "Scatter Plot", icon: <ScatterPlot /> },
          ].map(({ type, label, icon }) => (
            <Button
              key={type}
              variant={chartType === type ? "contained" : "outlined"}
              startIcon={icon}
              onClick={() => setChartType(type as any)}
              size="large"
            >
              {label}
            </Button>
          ))}
        </Box>

        {/* Data Info */}
        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
          <Chip label={`${chartData.length} data points`} color="primary" size="medium" />
          <Chip label={`${numericColumns.length} numeric columns`} color="secondary" size="medium" />
          <Chip label={`${currentTable.length} total rows`} color="info" size="medium" />
          <Chip label={`${columns.length} total columns`} color="warning" size="medium" />
          {filterColumn && (
            <Chip label={`Filtered by ${filterColumn}`} color="success" size="medium" />
          )}
          {sortColumn && (
            <Chip label={`Sorted by ${sortColumn}`} color="error" size="medium" />
          )}
          <Chip label={`Mode: ${dataSelectionMode}`} color="default" size="medium" />
          {dataSelectionMode === "filtered" && (
            <Chip label={`Showing all filtered data`} color="primary" variant="outlined" size="medium" />
          )}
          {compareMode && (
            <Chip label={`Compare Mode: ${selectedRows.length} rows selected`} color="info" size="medium" />
          )}
        </Box>
      </Box>

      {/* Chart Display - Full Width */}
      <Card sx={{ width: "100%" }}>
        <CardContent sx={{ p: 4 }}>
          <Box ref={chartRef} sx={{ width: "100%", minHeight: chartHeight }}>
            {numericColumns.length > 0 ? (
              renderChart()
            ) : (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  No numeric data found for visualization
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tables need numeric columns to create meaningful charts and graphs
                </Typography>
              </Box>
            )}
          </Box>
          {showDataTable && (
            <Box sx={{ mt: 4, overflowX: "auto" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Chart Data Table
              </Typography>
              <RowSelector
                rowCount={chartData.length}
                selectedRows={selectedRows}
                onChange={rows => setSelectedRows(rows)}
              />
              <Table size="small" sx={{ minWidth: 600 }}>
                <TableHead>
                  <TableRow>
                    {chartColumns.map((col) => (
                      <TableCell key={col} sx={{ fontWeight: 600, fontSize: "1rem", color: 'text.primary' }}>{col}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {chartData.slice(0, 50).map((row, i) => (
                    <TableRow key={i}>
                      {chartColumns.map((col) => (
                        <TableCell key={col} sx={{ fontSize: "0.95rem", whiteSpace: "pre-line", color: cellColor, background: cellBg }}>
                          {compareMode ? (
                            <Checkbox
                              checked={selectedRows.includes(i)}
                              onChange={() => {
                                setSelectedRows(prev => prev.includes(i) ? prev.filter(idx => idx !== i) : [...prev, i]);
                              }}
                            />
                          ) : (
                            row[col]
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </CardContent>
      </Card>
      <AIInsights open={aiOpen} onClose={() => setAiOpen(false)} context={{ blockType: "chart", blockData: chartData }} />
      <Box sx={{ position: "fixed", bottom: 32, right: 32, zIndex: 1200 }}>
        <Button variant="contained" color="primary" startIcon={<SmartToyIcon />} sx={{ borderRadius: "50%", minWidth: 64, minHeight: 64, boxShadow: 4 }} onClick={() => setAiOpen(true)}>
          AI
        </Button>
      </Box>
    </Container>
  )
}
