import { Box, Checkbox, FormControlLabel, FormGroup, Button, Typography, Divider, IconButton } from "@mui/material"
import React from "react"
import DragIndicatorIcon from "@mui/icons-material/DragIndicator"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"

interface ColumnSelectorProps {
  columns: string[]
  selectedColumns: string[]
  onChange: (selected: string[]) => void
  onOrderChange?: (ordered: string[]) => void
  columnTypes?: Record<string, string>
  minColumns?: number // Minimum columns that must be selected
  onDone?: () => void // Called when user clicks Done
}

export default function ColumnSelector({ columns, selectedColumns, onChange, onOrderChange, columnTypes = {}, minColumns = 1, onDone }: ColumnSelectorProps) {
  const [orderedColumns, setOrderedColumns] = React.useState<string[]>(columns)

  React.useEffect(() => {
    setOrderedColumns(columns)
  }, [columns])

  const allSelected = selectedColumns.length === columns.length
  const noneSelected = selectedColumns.length === 0

  const handleToggle = (col: string) => {
    if (selectedColumns.includes(col)) {
      if (selectedColumns.length > minColumns) {
        onChange(selectedColumns.filter((c) => c !== col))
      }
    } else {
      onChange([...selectedColumns, col])
    }
  }

  const handleSelectAll = () => onChange([...orderedColumns])
  const handleDeselectAll = () => onChange(orderedColumns.slice(0, minColumns))
  const handleReset = () => {
    setOrderedColumns(columns)
    onChange([...columns])
    if (onOrderChange) onOrderChange(columns)
  }

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const newOrder = Array.from(orderedColumns)
    const [removed] = newOrder.splice(result.source.index, 1)
    newOrder.splice(result.destination.index, 0, removed)
    setOrderedColumns(newOrder)
    if (onOrderChange) onOrderChange(newOrder)
    // Optionally reorder selectedColumns to match
    onChange(selectedColumns.filter(col => newOrder.includes(col)).sort((a, b) => newOrder.indexOf(a) - newOrder.indexOf(b)))
  }

  return (
    <Box sx={{ p: 2, minWidth: 220 }}>
      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
        Select & Reorder Columns
      </Typography>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="columns-droppable">
          {(provided) => (
            <FormGroup ref={provided.innerRef} {...provided.droppableProps}>
              {orderedColumns.map((col, idx) => (
                <Draggable key={col} draggableId={col} index={idx}>
                  {(dragProvided, dragSnapshot) => (
                    <Box ref={dragProvided.innerRef} {...dragProvided.draggableProps} sx={{ display: "flex", alignItems: "center", mb: 0.5, bgcolor: dragSnapshot.isDragging ? "action.selected" : undefined, borderRadius: 1 }}>
                      <IconButton {...dragProvided.dragHandleProps} size="small" sx={{ mr: 1, cursor: "grab" }}>
                        <DragIndicatorIcon fontSize="small" />
                      </IconButton>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedColumns.includes(col)}
                            onChange={() => handleToggle(col)}
                            disabled={selectedColumns.length <= minColumns && selectedColumns.includes(col)}
                          />
                        }
                        label={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <span>{col}</span>
                            {columnTypes[col] && (
                              <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                                {columnTypes[col]}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </Box>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </FormGroup>
          )}
        </Droppable>
      </DragDropContext>
      <Divider sx={{ my: 1 }} />
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
        <Button size="small" onClick={handleSelectAll} disabled={allSelected} variant="outlined">
          Select All
        </Button>
        <Button size="small" onClick={handleDeselectAll} disabled={noneSelected} variant="outlined">
          Deselect All
        </Button>
        <Button size="small" onClick={handleReset} variant="text">
          Reset
        </Button>
      </Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
        <Button variant="contained" onClick={onDone} size="small">Done</Button>
      </Box>
    </Box>
  )
} 