import { Box, Typography, Container, Chip } from "@mui/material"
import { Analytics, Speed, TableChart, TrendingUp } from "@mui/icons-material"

export default function Header() {
  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        borderBottom: 1,
        borderColor: "divider",
        py: 4,
      }}
    >
      <Container maxWidth="xl">
        <Box sx={{ textAlign: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 2 }}>
            <TableChart sx={{ fontSize: 40, color: "primary.main", mr: 1 }} />
            <Typography
              variant="h1"
              component="h1"
              sx={{
                fontWeight: 700,
                background: "linear-gradient(45deg, #ff9800, #ffb74d)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              SIFT
            </Typography>
            <Chip
              label="Dashboard"
              size="small"
              sx={{ ml: 2, bgcolor: "primary.main", color: "black", fontWeight: 600 }}
            />
          </Box>

          <Typography
            variant="h6"
            sx={{
              color: "text.secondary",
              maxWidth: 900,
              mx: "auto",
              lineHeight: 1.6,
              mb: 3,
            }}
          >
            AI-powered research assistant with advanced data visualization and competitive analysis
          </Typography>

          <Box sx={{ display: "flex", justifyContent: "center", gap: 4, mt: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Analytics sx={{ color: "primary.main" }} />
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                AI Analysis
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Speed sx={{ color: "primary.main" }} />
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Fast Extraction
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <TrendingUp sx={{ color: "primary.main" }} />
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Data Visualization
              </Typography>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  )
}
