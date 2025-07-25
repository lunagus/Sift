import React from "react"
import { Box, Button, Checkbox, Typography } from "@mui/material"

interface RowSelectorProps {
  rowCount: number
  selectedRows: number[]
  onChange: (rows: number[]) => void
  children?: (rowIndex: number, checked: boolean, onToggle: () => void) => React.ReactNode
}

export default function RowSelector({ rowCount, selectedRows, onChange, children }: RowSelectorProps) {
  const allSelected = selectedRows.length === rowCount
  const noneSelected = selectedRows.length === 0

  const handleSelectAll = () => onChange(Array.from({ length: rowCount }, (_, i) => i))
  const handleDeselectAll = () => onChange([])
  const handleInvert = () => onChange(Array.from({ length: rowCount }, (_, i) => (selectedRows.includes(i) ? null : i)).filter(i => i !== null) as number[])

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
      <Button variant="outlined" size="small" onClick={handleSelectAll} disabled={allSelected}>Select All</Button>
      <Button variant="outlined" size="small" onClick={handleDeselectAll} disabled={noneSelected}>Deselect All</Button>
      <Button variant="outlined" size="small" onClick={handleInvert}>Invert Selection</Button>
      <Typography variant="body2" sx={{ ml: 2 }}>{selectedRows.length} of {rowCount} selected</Typography>
      {/* Optionally render checkboxes for each row */}
      {children && Array.from({ length: rowCount }, (_, i) => {
        const checked = selectedRows.includes(i)
        return children(i, checked, () => onChange(checked ? selectedRows.filter(idx => idx !== i) : [...selectedRows, i]))
      })}
    </Box>
  )
} 