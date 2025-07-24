"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
} from "@mui/material"
import { Close, Send, CheckCircle } from "@mui/icons-material"
import { useForm, ValidationError } from "@formspree/react"

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [state, handleSubmit, reset] = useForm("xldleqja")
  const [formKey, setFormKey] = useState(0)
  const [showAlert, setShowAlert] = useState<{ type: "error" | "success"; message: string } | null>(null)

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setShowAlert(null)

    // Basic validation
    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const subject = formData.get("subject") as string
    const message = formData.get("message") as string

    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setShowAlert({
        type: "error",
        message: "Please fill in all fields.",
      })
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setShowAlert({
        type: "error",
        message: "Please enter a valid email address.",
      })
      return
    }

    // Rate limiting check
    const lastSubmission = localStorage.getItem("feedback_last_submission")
    if (lastSubmission && Date.now() - Number.parseInt(lastSubmission) < 60000) {
      setShowAlert({
        type: "error",
        message: "Please wait a minute before submitting another feedback.",
      })
      return
    }

    // Submit to Formspree
    await handleSubmit(e)

    // Set rate limiting
    localStorage.setItem("feedback_last_submission", Date.now().toString())
  }

  const handleClose = () => {
    if (state.succeeded) {
      // Reset the form state for next time
      if (typeof reset === "function") reset()
      setFormKey((k) => k + 1)
      setShowAlert(null)
    }
    onClose()
  }

  if (state.succeeded) {
    return (
      <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogContent sx={{ textAlign: "center", py: 4 }}>
          <CheckCircle sx={{ fontSize: 60, color: "success.main", mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            Thank You!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Your feedback has been submitted successfully. We'll get back to you soon!
          </Typography>
          <Button variant="contained" onClick={handleClose} size="large">
            Close
          </Button>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Send Feedback
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Help us improve SIFT with your suggestions
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {showAlert && (
          <Alert severity={showAlert.type} sx={{ mb: 2 }}>
            {showAlert.message}
          </Alert>
        )}

        <Box component="form" onSubmit={handleFormSubmit} key={formKey}>
          <TextField
            fullWidth
            label="Name"
            name="name"
            placeholder="Your name"
            required
            disabled={state.submitting}
            sx={{ mb: 2 }}
          />
          <ValidationError prefix="Name" field="name" errors={state.errors} />

          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            placeholder="your.email@example.com"
            required
            disabled={state.submitting}
            sx={{ mb: 2 }}
          />
          <ValidationError prefix="Email" field="email" errors={state.errors} />

          <TextField
            fullWidth
            label="Subject"
            name="subject"
            placeholder="What's this about?"
            required
            disabled={state.submitting}
            sx={{ mb: 2 }}
          />
          <ValidationError prefix="Subject" field="subject" errors={state.errors} />

          <TextField
            fullWidth
            label="Message"
            name="message"
            placeholder="Tell us what you think..."
            multiline
            rows={4}
            required
            disabled={state.submitting}
            sx={{ mb: 3 }}
          />
          <ValidationError prefix="Message" field="message" errors={state.errors} />

          <DialogActions sx={{ px: 0, pb: 0 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={state.submitting}
              startIcon={state.submitting ? <CircularProgress size={16} /> : <Send />}
              size="large"
              fullWidth
            >
              {state.submitting ? "Sending..." : "Send Feedback"}
            </Button>
          </DialogActions>
        </Box>
      </DialogContent>
    </Dialog>
  )
}
