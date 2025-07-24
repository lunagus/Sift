"use client"

import { useState } from "react"
import { Box, Container, Typography, Button, Grid, useTheme, useMediaQuery } from "@mui/material"
import { GitHub, Feedback, Coffee, Analytics } from "@mui/icons-material"
import { FeedbackModal } from "./FeedbackModal"

export default function Footer() {
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  return (
    <>
      <Box
        component="footer"
        sx={{
          mt: "auto",
          bgcolor: "background.paper",
          borderTop: 1,
          borderColor: "divider",
          py: { xs: 4, md: 5 },
        }}
      >
        <Container maxWidth="xl">
          <Grid container spacing={4} alignItems="center">
            {/* Left side - Branding */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: "flex", alignItems: "center", mb: { xs: 2, md: 0 } }}>
                <Analytics sx={{ color: "primary.main", mr: 1, fontSize: 32 }} />
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    background: "linear-gradient(45deg, #ff9800, #ffb74d)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    mr: 2,
                  }}
                >
                  SIFT
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>
                  AI-powered data extraction and analysis
                </Typography>
              </Box>
            </Grid>

            {/* Right side - Action buttons */}
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: "flex",
                  gap: { xs: 2, sm: 3 },
                  justifyContent: { xs: "center", md: "flex-end" },
                  flexWrap: "wrap",
                }}
              >
                <Button
                  variant="outlined"
                  startIcon={<GitHub />}
                  href="https://github.com/lunagus/"
                  target="_blank"
                  rel="noopener noreferrer"
                  size="large"
                  sx={{
                    minWidth: { xs: "auto", sm: 140 },
                    py: 1.5,
                    "&:hover": {
                      bgcolor: "primary.main",
                      color: "black",
                      borderColor: "primary.main",
                      transform: "translateY(-1px)",
                    },
                    transition: "all 0.2s ease-in-out",
                  }}
                >
                  {isMobile ? <GitHub /> : "GitHub"}
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<Feedback />}
                  onClick={() => setFeedbackOpen(true)}
                  size="large"
                  sx={{
                    minWidth: { xs: "auto", sm: 140 },
                    py: 1.5,
                    "&:hover": {
                      bgcolor: "primary.main",
                      color: "black",
                      borderColor: "primary.main",
                      transform: "translateY(-1px)",
                    },
                    transition: "all 0.2s ease-in-out",
                  }}
                >
                  {isMobile ? <Feedback /> : "Feedback"}
                </Button>

                <Button
                  variant="contained"
                  startIcon={<Coffee />}
                  href="https://coff.ee/lunagus"
                  target="_blank"
                  rel="noopener noreferrer"
                  size="large"
                  sx={{
                    minWidth: { xs: "auto", sm: 140 },
                    py: 1.5,
                    bgcolor: "primary.main",
                    color: "black",
                    fontWeight: 600,
                    "&:hover": {
                      bgcolor: "primary.dark",
                      transform: "translateY(-2px)",
                      boxShadow: "0 6px 20px rgba(255, 152, 0, 0.4)",
                    },
                    transition: "all 0.2s ease-in-out",
                  }}
                >
                  {isMobile ? <Coffee /> : "Donate"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </>
  )
}
