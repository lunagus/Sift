import React from "react"
import { Menu, MenuItem, Button, ListItemIcon, ListItemText } from "@mui/material"
import FileCopyIcon from "@mui/icons-material/FileCopy"
import DownloadIcon from "@mui/icons-material/Download"
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf"
import ShareIcon from "@mui/icons-material/Share"
import PrintIcon from "@mui/icons-material/Print"

interface DataExportMenuProps {
  data: any[] | object
  columns?: string[]
  fileName?: string
  exportOptions?: ("csv" | "json" | "txt" | "png" | "copy" | "share" | "print")[]
  children?: React.ReactNode
  anchorEl?: HTMLElement | null
  onClose?: () => void
}

export default function DataExportMenu({ data, columns, fileName = "sift-data", exportOptions = ["csv", "json", "copy"], children, anchorEl, onClose }: DataExportMenuProps) {
  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl || menuAnchor)
  const handleOpen = (e: React.MouseEvent<HTMLElement>) => setMenuAnchor(e.currentTarget)
  const handleClose = () => { setMenuAnchor(null); onClose?.() }

  // Export helpers
  const exportCSV = () => {
    let rows = Array.isArray(data) ? data : [data]
    if (!rows.length) return
    const cols = columns || Object.keys(rows[0])
    const csvRows = [cols.join(",")]
    rows.forEach(row => {
      csvRows.push(cols.map(col => `"${(row[col] ?? "").toString().replace(/"/g, '""')}"`).join(","))
    })
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${fileName}.csv`
    a.click()
    URL.revokeObjectURL(url)
    handleClose()
  }
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${fileName}.json`
    a.click()
    URL.revokeObjectURL(url)
    handleClose()
  }
  const exportTXT = () => {
    let rows = Array.isArray(data) ? data : [data]
    if (!rows.length) return
    const cols = columns || Object.keys(rows[0])
    let txt = rows.map(row => cols.map(col => `${col}: ${row[col] ?? ""}`).join("\n")).join("\n\n")
    const blob = new Blob([txt], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${fileName}.txt`
    a.click()
    URL.revokeObjectURL(url)
    handleClose()
  }
  const exportPNG = async () => {
    // This requires a ref to the chart/table node, so not implemented here
    handleClose()
  }
  const handleCopy = () => {
    let rows = Array.isArray(data) ? data : [data]
    if (!rows.length) return
    const cols = columns || Object.keys(rows[0])
    const tsvRows = [cols.join("\t")]
    rows.forEach(row => {
      tsvRows.push(cols.map(col => row[col] ?? "").join("\t"))
    })
    navigator.clipboard.writeText(tsvRows.join("\n"))
    handleClose()
  }
  const handleShare = () => {
    // Could implement navigator.share or copy link
    handleClose()
  }
  const handlePrint = () => {
    window.print()
    handleClose()
  }

  return (
    <>
      {children ? (
        React.cloneElement(children as React.ReactElement, { onClick: handleOpen })
      ) : (
        <Button variant="outlined" onClick={handleOpen} size="small" startIcon={<DownloadIcon />}>Export</Button>
      )}
      <Menu anchorEl={anchorEl || menuAnchor} open={open} onClose={handleClose}>
        {exportOptions.includes("csv") && (
          <MenuItem onClick={exportCSV}>
            <ListItemIcon><DownloadIcon /></ListItemIcon>
            <ListItemText>Export CSV</ListItemText>
          </MenuItem>
        )}
        {exportOptions.includes("json") && (
          <MenuItem onClick={exportJSON}>
            <ListItemIcon><DownloadIcon /></ListItemIcon>
            <ListItemText>Export JSON</ListItemText>
          </MenuItem>
        )}
        {exportOptions.includes("txt") && (
          <MenuItem onClick={exportTXT}>
            <ListItemIcon><DownloadIcon /></ListItemIcon>
            <ListItemText>Export TXT</ListItemText>
          </MenuItem>
        )}
        {exportOptions.includes("copy") && (
          <MenuItem onClick={handleCopy}>
            <ListItemIcon><FileCopyIcon /></ListItemIcon>
            <ListItemText>Copy to Clipboard</ListItemText>
          </MenuItem>
        )}
        {exportOptions.includes("share") && (
          <MenuItem onClick={handleShare}>
            <ListItemIcon><ShareIcon /></ListItemIcon>
            <ListItemText>Share</ListItemText>
          </MenuItem>
        )}
        {exportOptions.includes("print") && (
          <MenuItem onClick={handlePrint}>
            <ListItemIcon><PrintIcon /></ListItemIcon>
            <ListItemText>Print</ListItemText>
          </MenuItem>
        )}
        {/* PNG export is context-specific */}
      </Menu>
    </>
  )
} 