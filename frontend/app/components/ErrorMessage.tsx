"use client"

import { Alert, AlertTitle, IconButton } from "@mui/material"
import { Close } from "@mui/icons-material"

interface ErrorMessageProps {
  message: string
  onDismiss: () => void
}

export default function ErrorMessage({ message, onDismiss }: ErrorMessageProps) {
  return (
    <Alert
      severity="error"
      sx={{ mb: 3 }}
      action={
        <IconButton aria-label="close" color="inherit" size="small" onClick={onDismiss}>
          <Close fontSize="inherit" />
        </IconButton>
      }
    >
      <AlertTitle>Connection Error</AlertTitle>
      {message}
    </Alert>
  )
}
