import { Card, CardContent, Typography, Box, Chip } from "@mui/material"
import { Psychology, Lightbulb } from "@mui/icons-material"

interface AIInsightsProps {
  response: string
}

export default function AIInsights({ response }: AIInsightsProps) {
  return (
    <Card
      sx={{
        background: "linear-gradient(135deg, rgba(255, 152, 0, 0.1), rgba(255, 183, 77, 0.05))",
        border: 2,
        borderColor: "primary.main",
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <Psychology sx={{ color: "primary.main", mr: 2, fontSize: 32 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, color: "primary.main" }}>
              AI Insights & Analysis
            </Typography>
            <Chip
              icon={<Lightbulb />}
              label="Powered by AI"
              size="small"
              sx={{ mt: 1, bgcolor: "primary.main", color: "black" }}
            />
          </Box>
        </Box>

        <Typography
          variant="body1"
          sx={{
            lineHeight: 1.8,
            whiteSpace: "pre-wrap",
            color: "text.primary",
            fontSize: "1.1rem",
          }}
        >
          {response}
        </Typography>
      </CardContent>
    </Card>
  )
}
