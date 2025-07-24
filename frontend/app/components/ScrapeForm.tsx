"use client"

import type React from "react"

import { useState } from "react"
import { CardContent, TextField, Button, Box, Typography, Paper } from "@mui/material"
import { Send, Refresh, Analytics } from "@mui/icons-material"

interface ScrapeFormProps {
  onSubmit: (url: string, question?: string) => void
  loading: boolean
  onReset: () => void
}

export default function ScrapeForm({ onSubmit, loading, onReset }: ScrapeFormProps) {
  const [url, setUrl] = useState("")
  const [question, setQuestion] = useState("")
  const [urlError, setUrlError] = useState("")

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!url.trim()) {
      setUrlError("URL is required")
      return
    }

    if (!validateUrl(url)) {
      setUrlError("Please enter a valid URL")
      return
    }

    setUrlError("")
    onSubmit(url.trim(), question.trim() || undefined)
  }

  const handleReset = () => {
    setUrl("")
    setQuestion("")
    setUrlError("")
    onReset()
  }

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 4,
        border: 1,
        borderColor: "divider",
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          background: "linear-gradient(135deg, rgba(255, 152, 0, 0.05), rgba(255, 183, 77, 0.02))",
          borderBottom: 1,
          borderColor: "divider",
          px: 4,
          py: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <Analytics sx={{ color: "primary.main", mr: 2, fontSize: 32 }} />
          <Typography variant="h4" sx={{ fontWeight: 600, color: "text.primary" }}>
            Data Extraction & Analysis
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ ml: 6 }}>
          Extract structured data from any website and get AI-powered insights
        </Typography>
      </Box>

      <CardContent sx={{ p: 4 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {/* URL Input Section */}
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: "text.primary" }}>
                  Website URL
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Enter the URL of the website containing data tables you want to extract
                </Typography>
              </Box>
              <TextField
                fullWidth
                placeholder="https://example.com/data-page"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value)
                  if (urlError) setUrlError("")
                }}
                error={!!urlError}
                helperText={urlError}
                required
                variant="outlined"
                disabled={loading}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    fontSize: "1.1rem",
                    py: 1,
                  },
                }}
              />
            </Box>

            {/* AI Question Section */}
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: "text.primary" }}>
                  AI Analysis Question
                  <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    (Optional)
                  </Typography>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Ask specific questions for AI-powered insights: compare prices, analyze trends, find patterns, or get
                  summaries
                </Typography>
              </Box>
              <TextField
                fullWidth
                placeholder="Compare prices across different products, analyze trends, or ask specific questions about the data..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                multiline
                rows={3}
                variant="outlined"
                disabled={loading}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    fontSize: "1rem",
                  },
                }}
              />
            </Box>

            {/* Action Buttons */}
            <Box
              sx={{
                display: "flex",
                gap: 3,
                justifyContent: "flex-end",
                pt: 3,
                borderTop: 1,
                borderColor: "divider",
              }}
            >
              <Button
                variant="outlined"
                onClick={handleReset}
                disabled={loading || (!url && !question)}
                startIcon={<Refresh />}
                size="large"
                sx={{
                  minWidth: 120,
                  py: 1.5,
                  "&:hover": {
                    borderColor: "primary.main",
                    color: "primary.main",
                  },
                }}
              >
                Reset
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading || !url.trim()}
                startIcon={<Send />}
                size="large"
                sx={{
                  minWidth: 160,
                  py: 1.5,
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow: "0 6px 20px rgba(255, 152, 0, 0.3)",
                  },
                  transition: "all 0.2s ease-in-out",
                }}
              >
                {loading ? "Extracting..." : "Extract Data"}
              </Button>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Paper>
  )
}
