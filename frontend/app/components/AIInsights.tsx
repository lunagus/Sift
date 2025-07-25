import { useState } from "react"
import { Card, CardContent, Typography, Box, Chip, Dialog, DialogTitle, DialogContent, IconButton, TextField, Button, CircularProgress, Tooltip, Fab } from "@mui/material"
import { Psychology, Lightbulb, Close, SmartToy, ThumbUp, ThumbDown } from "@mui/icons-material"

interface AIInsightsProps {
  open: boolean
  onClose: () => void
  context?: any
  onApplyAction?: (action: any) => void
}

interface ChatTurn {
  question: string
  answer: string
  feedback?: "up" | "down"
}

function extractActionFromAnswer(answer: string): any | null {
  // Look for a JSON block in the answer
  const match = answer.match(/\{[\s\S]*?\}/)
  if (!match) return null
  try {
    const action = JSON.parse(match[0])
    if (action && typeof action === "object" && action.action) return action
  } catch {}
  return null
}

export default function AIInsights({ open, onClose, context, onApplyAction }: AIInsightsProps) {
  const [query, setQuery] = useState("")
  const [chat, setChat] = useState<ChatTurn[]>([])
  const [loading, setLoading] = useState(false)

  const handleAsk = async () => {
    const apiUrl = "http://127.0.0.1:8000/api/v1/ai_analyze";
    setLoading(true)
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: query,
          block_type: context?.blockType || "table",
          block_data: context?.blockData || context,
          history: chat.map(turn => ({ question: turn.question, answer: turn.answer })),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setChat(prev => [...prev, { question: query, answer: `[Error: ${data?.answer || data?.detail || 'AI analysis failed'}]` }])
        setLoading(false)
        return
      }
      setChat(prev => [...prev, { question: query, answer: data.answer }])
      setQuery("")
    } catch (err: any) {
      setChat(prev => [...prev, { question: query, answer: "[Error: " + (err?.message || "Unknown error") + "]" }])
    } finally {
      setLoading(false)
    }
  }

  const handleFeedback = (idx: number, type: "up" | "down") => {
    setChat(prev => prev.map((turn, i) => i === idx ? { ...turn, feedback: type } : turn))
    // Optionally send feedback to backend here
  }

  // Find the latest actionable suggestion
  const lastAction = chat.length > 0 ? extractActionFromAnswer(chat[chat.length - 1].answer) : null

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <SmartToy sx={{ color: "primary.main", mr: 2, fontSize: 32 }} />
            <Typography variant="h5" sx={{ fontWeight: 600, color: "primary.main" }}>
              Ask AI About This Data
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small"><Close /></IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ maxHeight: 400, overflowY: "auto", mb: 2 }}>
          {chat.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Start by asking a question about your data. You can ask follow-up questions and give feedback on answers.
            </Typography>
          )}
          {chat.map((turn, idx) => (
            <Box key={idx} sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ color: "primary.main", mb: 1 }}>
                You: {turn.question}
              </Typography>
              <Card sx={{ background: "linear-gradient(135deg, rgba(255, 152, 0, 0.1), rgba(255, 183, 77, 0.05))", border: 2, borderColor: "primary.main" }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Psychology sx={{ color: "primary.main", mr: 2, fontSize: 28 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: "primary.main" }}>
                      AI Answer
                    </Typography>
                    <Chip icon={<Lightbulb />} label="AI" size="small" sx={{ ml: 2, bgcolor: "primary.main", color: "black" }} />
                  </Box>
                  <Typography variant="body1" sx={{ lineHeight: 1.7, whiteSpace: "pre-wrap", color: "text.primary", fontSize: "1.05rem" }}>
                    {turn.answer}
                  </Typography>
                  <Box sx={{ mt: 2, display: "flex", gap: 1, alignItems: "center" }}>
                    <Tooltip title="Helpful">
                      <IconButton color={turn.feedback === "up" ? "success" : "default"} onClick={() => handleFeedback(idx, "up")}> <ThumbUp /> </IconButton>
                    </Tooltip>
                    <Tooltip title="Not Helpful">
                      <IconButton color={turn.feedback === "down" ? "error" : "default"} onClick={() => handleFeedback(idx, "down")}> <ThumbDown /> </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
        <TextField
          label="Ask a question (e.g. 'Which products are over $1000?')"
          value={query}
          onChange={e => setQuery(e.target.value)}
          fullWidth
          multiline
          minRows={2}
          sx={{ mb: 2 }}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (query.trim()) handleAsk() } }}
        />
        <Button variant="contained" onClick={handleAsk} disabled={loading || !query} sx={{ mb: 2 }}>
          {loading ? <CircularProgress size={20} color="inherit" /> : chat.length === 0 ? "Ask AI" : "Ask Follow-up"}
        </Button>
        {lastAction && onApplyAction && (
          <Button variant="outlined" color="success" sx={{ ml: 2 }} onClick={() => onApplyAction(lastAction)}>
            Apply Suggestion
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
