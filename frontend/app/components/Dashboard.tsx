"use client"

import type React from "react"

import { useState } from "react"
import { Box, Typography, Tabs, Tab, Button, ButtonGroup, Chip, Container, TextField, CircularProgress } from "@mui/material"
import { TableChart, BarChart, CompareArrows, TextFields, Download, ViewModule, ViewList } from "@mui/icons-material"
import type { ScrapeResponse } from "../types/api"
import DataSummary from "./DataSummary"
import EnhancedTableView from "./EnhancedTableView"
import EnhancedChartView from "./EnhancedChartView"
import DataComparison from "./DataComparison"
import RawDataView from "./RawDataView"
import { useTheme } from "@mui/material/styles"

interface DashboardProps {
  results: ScrapeResponse
}

export default function Dashboard({ results }: DashboardProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const codeBg = isDark ? '#232323' : '#fff';
  const codeColor = isDark ? '#fff' : '#111';
  const [activeTab, setActiveTab] = useState(0)
  const [viewMode, setViewMode] = useState<"comfortable" | "compact">("comfortable")
  const [aiQuestion, setAiQuestion] = useState("")
  const [aiResponse, setAiResponse] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

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

  const hasTables = results.tables && results.tables.length > 0
  const hasListings = results.listings && results.listings.length > 0
  const hasArticle = !!results.article
  const hasRawHtml = !!results.raw_html
  const hasNormalizedJsonLD = results.normalized_jsonld && results.normalized_jsonld.length > 0
  const contentTypes = results.content_types || []

  // Always show these tabs if any structured data is present
  const mainTabs = [
    { label: "Data Tables", icon: <TableChart sx={{ fontSize: 28 }} />, show: hasTables || hasNormalizedJsonLD, blockType: hasTables ? "table" : "normalized_jsonld", blockData: hasTables ? results.tables?.[0] || [] : results.normalized_jsonld || [] },
    { label: "Visualizations", icon: <BarChart sx={{ fontSize: 28 }} />, show: hasTables || hasNormalizedJsonLD, blockType: hasTables ? "table" : "normalized_jsonld", blockData: hasTables ? results.tables?.[0] || [] : results.normalized_jsonld || [] },
    { label: "Data Comparison", icon: <CompareArrows sx={{ fontSize: 28 }} />, show: hasTables || hasNormalizedJsonLD, blockType: hasTables ? "table" : "normalized_jsonld", blockData: hasTables ? results.tables?.[0] || [] : results.normalized_jsonld || [] },
    ...(hasNormalizedJsonLD ? [{ label: "Structured Data", icon: <TableChart sx={{ fontSize: 28 }} />, show: true, blockType: "normalized_jsonld", blockData: results.normalized_jsonld }] : []),
  ]
  // Additive tabs for new blocks
  const extraTabs = [
    hasListings && { label: "Listings/Grid", icon: <TableChart sx={{ fontSize: 28 }} />, blockType: "listings", blockData: results.listings },
    hasArticle && { label: "Article", icon: <TextFields sx={{ fontSize: 28 }} />, blockType: "article", blockData: results.article },
  ].filter(Boolean) as { label: string; icon: React.ReactNode; blockType: string; blockData: any }[]

  // Always add Raw Data tab at the end
  const rawDataTab = {
    label: "Raw Data",
    icon: <TextFields sx={{ fontSize: 28 }} />,
    blockType: "raw",
    blockData: {
      tables: results.tables,
      listings: results.listings,
      article: results.article,
      raw_html: results.raw_html,
      content_types: results.content_types,
    },
  }

  const allTabs = [
    ...mainTabs.filter(t => Boolean(t) && t.show),
    ...extraTabs,
    rawDataTab,
  ].filter(tab => Boolean(tab) && typeof tab === 'object' && typeof tab.label === 'string' && (!tab.icon || typeof tab.icon === 'object'))

  // Tab content
  const tabComponents = [
    (hasTables || hasNormalizedJsonLD) && <EnhancedTableView tables={hasTables ? results.tables || [] : [results.normalized_jsonld ?? []]} viewMode={viewMode} />, // 0
    (hasTables || hasNormalizedJsonLD) && <EnhancedChartView tables={hasTables ? results.tables || [] : [results.normalized_jsonld ?? []]} />, // 1
    (hasTables || hasNormalizedJsonLD) && <DataComparison tables={hasTables ? results.tables || [] : [results.normalized_jsonld ?? []]} />, // 2
    hasNormalizedJsonLD && results.normalized_jsonld && (
      <Box sx={{ p: 4 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Structured Data (JSON-LD, normalized)</Typography>
        <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
          {results.normalized_jsonld.length} records extracted from structured data blocks.
        </Typography>
        <EnhancedTableView tables={[results.normalized_jsonld]} viewMode={viewMode} />
        <Box sx={{ mt: 4 }}>
          <EnhancedChartView tables={[results.normalized_jsonld]} />
        </Box>
      </Box>
    ),
    hasListings && (
      <Box sx={{ p: 4 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Listings / Grid Data</Typography>
        <pre style={{ maxHeight: 400, overflow: "auto", background: codeBg, color: codeColor, padding: 16, borderRadius: 8 }}>
          {JSON.stringify(results.listings, null, 2)}
        </pre>
      </Box>
    ),
    hasArticle && (
      <Box sx={{ p: 4 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Main Article / Content</Typography>
        <pre style={{ maxHeight: 400, overflow: "auto", background: codeBg, color: codeColor, padding: 16, borderRadius: 8 }}>
          {typeof results.article === "string" ? results.article : JSON.stringify(results.article, null, 2)}
        </pre>
      </Box>
    ),
    // Raw Data tab (always last)
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Raw Extraction Output</Typography>
      <pre style={{ maxHeight: 400, overflow: "auto", background: codeBg, color: codeColor, padding: 16, borderRadius: 8 }}>
        {JSON.stringify({
          tables: results.tables,
          listings: results.listings,
          article: results.article,
          raw_html: results.raw_html?.slice(0, 100000),
          content_types: results.content_types,
        }, null, 2)}
      </pre>
      {(!results.tables?.length && !results.listings?.length && !results.article) && (
        <Typography color="warning.main" sx={{ mt: 2 }}>
          No structured data detected. Here’s the raw HTML and extraction output for debugging.
        </Typography>
      )}
    </Box>,
  ].filter(Boolean)

  // AI Question/Analysis UI
  const handleAIAnalyze = async () => {
    const apiUrl = "http://127.0.0.1:8000/api/v1/ai_analyze";
    setAiLoading(true)
    setAiResponse(null)
    const tab = allTabs[activeTab]
    if (!tab) return
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: aiQuestion,
          block_type: tab.blockType,
          block_data: tab.blockData,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAiResponse(data?.answer || data?.detail || "AI analysis failed")
        setAiLoading(false)
        return
      }
      setAiResponse(data.answer)
    } catch (err: any) {
      setAiResponse("[Error: " + (err?.message || "Unknown error") + "]")
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <Box sx={{ width: "100%", minHeight: "100vh" }}>
      <Container maxWidth={false} sx={{ px: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, color: "primary.main" }}>
              Data Analysis Dashboard
            </Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              {contentTypes.map((ct) => (
                <Chip key={ct} label={ct} color="primary" size="medium" />
              ))}
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

        {/* AI Question/Analysis UI */}
        <Box sx={{ mb: 4, display: "flex", gap: 2, alignItems: "center" }}>
          <TextField
            label="Ask AI about this data (e.g. 'Which products are over $1000?')"
            value={aiQuestion}
            onChange={e => setAiQuestion(e.target.value)}
            size="small"
            sx={{ minWidth: 400 }}
          />
          <Button variant="contained" onClick={handleAIAnalyze} disabled={aiLoading || !aiQuestion}>
            {aiLoading ? <CircularProgress size={20} color="inherit" /> : "Analyze"}
          </Button>
          {aiResponse && (
            <Box sx={{ ml: 2, color: "#333", fontStyle: "italic", maxWidth: 600, overflow: "auto" }}>{aiResponse}</Box>
          )}
        </Box>
      </Container>

      {/* Main Content Tabs - Full Width, No Card Container */}
      <Box sx={{ width: "100%", bgcolor: "background.paper", borderTop: 1, borderColor: "divider" }}>
        <Container maxWidth={false} sx={{ px: 0 }}>
          <Box sx={{ borderBottom: 1, borderColor: "divider", px: 4, pt: 2 }}>
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
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
              {allTabs.map((tab, i) => (
                <Tab key={tab.label as string} icon={tab.icon as React.ReactElement | undefined} label={tab.label as string} />
              ))}
            </Tabs>
          </Box>
          <Box sx={{ minHeight: "70vh", width: "100%" }}>
            {tabComponents[activeTab]}
          </Box>
        </Container>
      </Box>
    </Box>
  )
}
