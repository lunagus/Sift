import { Grid, Card, CardContent, Typography, Box } from "@mui/material"
import { TableChart, DataObject, TrendingUp, Assessment } from "@mui/icons-material"
import type { ScrapeResponse } from "../types/api"

interface DataSummaryProps {
  results: ScrapeResponse
}

export default function DataSummary({ results }: DataSummaryProps) {
  const tables = results.tables || []
  const totalRows = tables.reduce((sum, table) => sum + table.length, 0)
  const totalColumns = tables.length > 0 ? Object.keys(tables[0][0] || {}).length : 0
  const avgRowsPerTable = tables.length > 0 ? Math.round(totalRows / tables.length) : 0

  // Detect numeric columns for analysis
  const numericColumns =
    tables.length > 0
      ? Object.keys(tables[0][0] || {}).filter((key) => tables[0].some((row) => !isNaN(Number(row[key])))).length
      : 0

  const summaryCards = [
    {
      title: "Total Tables",
      value: tables.length,
      icon: <TableChart sx={{ fontSize: 40, color: "primary.main" }} />,
      color: "primary.main",
    },
    {
      title: "Total Records",
      value: totalRows.toLocaleString(),
      icon: <DataObject sx={{ fontSize: 40, color: "success.main" }} />,
      color: "success.main",
    },
    {
      title: "Avg Rows/Table",
      value: avgRowsPerTable,
      icon: <Assessment sx={{ fontSize: 40, color: "info.main" }} />,
      color: "info.main",
    },
    {
      title: "Numeric Columns",
      value: numericColumns,
      icon: <TrendingUp sx={{ fontSize: 40, color: "warning.main" }} />,
      color: "warning.main",
    },
  ]

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {summaryCards.map((card, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card
            sx={{
              height: "100%",
              background: `linear-gradient(135deg, ${card.color}15, ${card.color}05)`,
              border: `1px solid ${card.color}30`,
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: card.color }}>
                    {card.value}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
                    {card.title}
                  </Typography>
                </Box>
                {card.icon}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}
