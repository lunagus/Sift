import { Box, CircularProgress, Typography, LinearProgress } from "@mui/material"

export default function LoadingSpinner() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 6,
        gap: 3,
      }}
    >
      <CircularProgress size={60} thickness={4} sx={{ color: "primary.main" }} />
      <Box sx={{ textAlign: "center" }}>
        <Typography variant="h6" sx={{ color: "text.primary", mb: 1 }}>
          Extracting and analyzing data...
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          Processing website content and preparing dashboard
        </Typography>
        <Box sx={{ width: 300 }}>
          <LinearProgress sx={{ borderRadius: 2, height: 6 }} />
        </Box>
      </Box>
    </Box>
  )
}
