"use client"

import type React from "react"

import { useState } from "react"
import { Box, Typography, Tabs, Tab, Button, ButtonGroup, Chip, Container } from "@mui/material"
import { TableChart, BarChart, CompareArrows, TextFields, Download, ViewModule, ViewList } from "@mui/icons-material"
import type { ScrapeResponse } from "../types/api"
import DataSummary from "./DataSummary"
import EnhancedTableView from "./EnhancedTableView"
import EnhancedChartView from "./EnhancedChartView"
import DataComparison from "./DataComparison"
import RawDataView from "./RawDataView"
import AIInsights from "./AIInsights"

interface DashboardProps {
  results: ScrapeResponse
}

export default function Dashboard({ results }: DashboardProps) {
  const [activeTab, setActiveTab] = useState(0)
  const [viewMode, setViewMode] = useState<"comfortable" | "compact">("comfortable")

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const exportData = (format: "csv" | "json") => {
    if (!results.tables || results.tables.length === 0) return

    const dataStr = format === "json" ? JSON.stringify(results.tables, null, 2) : convertToCSV(results.tables[0])

    const dataBlob = new Blob([dataStr], { type: format === "json" ? "application/json" : "text/csv" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `sift-data.${format}`
    link.click()
    URL.revokeObjectURL(url)
  }

  const convertToCSV = (data: Record<string, any>[]) => {
    if (!data.length) return ""
    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(","),
      ...data.map((row) => headers.map((header) => `"${row[header] || ""}"`).join(",")),
    ].join("\n")
    return csvContent
  }

  const totalRows = results.tables?.reduce((sum, table) => sum + table.length, 0) || 0
  const totalTables = results.tables?.length || 0

  return (
    <Box sx={{ width: "100%", minHeight: "100vh" }}>
      {/* Dashboard Header - Full Width */}
      <Container maxWidth={false} sx={{ px: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, color: "primary.main" }}>
              Data Analysis Dashboard
            </Typography>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Chip
                label={`${totalTables} Tables Extracted`}
                color="primary"
                size="medium"
                sx={{ fontSize: "1rem", py: 2 }}
              />
              <Chip
                label={`${totalRows.toLocaleString()} Total Records`}
                color="secondary"
                size="medium"
                sx={{ fontSize: "1rem", py: 2 }}
              />
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <ButtonGroup variant="outlined" size="large">
              <Button
                startIcon={viewMode === "comfortable" ? <ViewList /> : <ViewModule />}
                onClick={() => setViewMode(viewMode === "comfortable" ? "compact" : "comfortable")}
                sx={{ minWidth: 140 }}
              >
                {viewMode === "comfortable" ? "Compact" : "Comfortable"}
              </Button>
            </ButtonGroup>
            <ButtonGroup variant="contained" size="large">
              <Button startIcon={<Download />} onClick={() => exportData("csv")} sx={{ minWidth: 100 }}>
                CSV
              </Button>
              <Button startIcon={<Download />} onClick={() => exportData("json")} sx={{ minWidth: 100 }}>
                JSON
              </Button>
            </ButtonGroup>
          </Box>
        </Box>

        {/* Data Summary Cards */}
        <DataSummary results={results} />

        {/* AI Insights */}
        {results.ai_response && (
          <Box sx={{ mb: 6 }}>
            <AIInsights response={results.ai_response} />
          </Box>
        )}
      </Container>

      {/* Main Content Tabs - Full Width, No Card Container */}
      <Box sx={{ width: "100%", bgcolor: "background.paper", borderTop: 1, borderColor: "divider" }}>
        <Container maxWidth={false} sx={{ px: 0 }}>
          <Box sx={{ borderBottom: 1, borderColor: "divider", px: 4, pt: 2 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              aria-label="dashboard tabs"
              sx={{
                "& .MuiTab-root": {
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  minHeight: 64,
                  px: 4,
                },
              }}
            >
              <Tab icon={<TableChart sx={{ fontSize: 28 }} />} label="Data Tables" iconPosition="start" />
              <Tab icon={<BarChart sx={{ fontSize: 28 }} />} label="Visualizations" iconPosition="start" />
              <Tab icon={<CompareArrows sx={{ fontSize: 28 }} />} label="Data Comparison" iconPosition="start" />
              <Tab icon={<TextFields sx={{ fontSize: 28 }} />} label="Raw Data" iconPosition="start" />
            </Tabs>
          </Box>

          {/* Tab Content - Full Width */}
          <Box sx={{ minHeight: "70vh", width: "100%" }}>
            {activeTab === 0 && <EnhancedTableView tables={results.tables || []} viewMode={viewMode} />}
            {activeTab === 1 && <EnhancedChartView tables={results.tables || []} />}
            {activeTab === 2 && <DataComparison tables={results.tables || []} />}
            {activeTab === 3 && <RawDataView tables={results.tables || []} />}
          </Box>
        </Container>
      </Box>
    </Box>
  )
}
