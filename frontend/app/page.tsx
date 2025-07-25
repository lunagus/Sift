"use client"

import { useState } from "react"
import { Container, Box } from "@mui/material"
import Header from "./components/Header"
import ScrapeForm from "./components/ScrapeForm"
import LoadingSpinner from "./components/LoadingSpinner"
import ErrorMessage from "./components/ErrorMessage"
import Dashboard from "./components/Dashboard"
import type { ScrapeResponse } from "./types/api"
import Footer from "./components/Footer"

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<ScrapeResponse | null>(null)

  const handleScrape = async (url: string, question?: string, method?: string) => {
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url, question, method }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: ScrapeResponse = await response.json()
      setResults(data)
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes("Failed to fetch")) {
          setError("Unable to connect to the backend server. Please ensure the API is running.")
        } else {
          setError(`Error: ${err.message}`)
        }
      } else {
        setError("An unexpected error occurred. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setResults(null)
    setError(null)
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Header />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <ScrapeForm onSubmit={handleScrape} loading={loading} onReset={handleReset} />

        {loading && <LoadingSpinner />}

        {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

        {results && <Dashboard results={results} />}
      </Container>
      <Footer />
    </Box>
  )
}
