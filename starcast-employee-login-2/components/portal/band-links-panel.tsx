"use client"

import { useState } from "react"
import { updateBand } from "@/app/actions/bands"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, GripVertical, Link as LinkIcon, Save, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface Band {
  id: string
  name: string
  type: string
  slug: string
  links: any[]
}

export function BandLinksPanel({ band, onUpdated }: { band: Band; onUpdated: () => void }) {
  const [links, setLinks] = useState<{ title: string; url: string }[]>(
    band.links && band.links.length > 0 ? band.links : []
  )
  const [isSaving, setIsSaving] = useState(false)

  function addLink() {
    setLinks([...links, { title: "", url: "" }])
  }

  function removeLink(index: number) {
    setLinks(links.filter((_, i) => i !== index))
  }

  function updateLink(index: number, field: "title" | "url", value: string) {
    const newLinks = [...links]
    newLinks[index][field] = value
    setLinks(newLinks)
  }

  // To reorder
  function moveUp(index: number) {
    if (index === 0) return
    const newLinks = [...links]
    const temp = newLinks[index]
    newLinks[index] = newLinks[index - 1]
    newLinks[index - 1] = temp
    setLinks(newLinks)
  }

  function moveDown(index: number) {
    if (index === links.length - 1) return
    const newLinks = [...links]
    const temp = newLinks[index]
    newLinks[index] = newLinks[index + 1]
    newLinks[index + 1] = temp
    setLinks(newLinks)
  }

  async function handleSave() {
    // Filter out completely empty ones
    const validLinks = links.filter(l => l.title.trim() || l.url.trim())
    
    setIsSaving(true)
    try {
      await updateBand(band.id, {
        name: band.name, // required by input type
        links: validLinks,
      })
      toast.success("Links saved successfully!")
      setLinks(validLinks)
      onUpdated()
    } catch (e: any) {
      toast.error(e?.message || "Failed to save links")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="border-[#20205a]/50 bg-[#0c0c3f]/60">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-[#f5f7ff] flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-[#ea6f2a]" /> Custom Links
          </CardTitle>
          <CardDescription className="text-[#9a9fc4]">
            Add links to your Spotify, Apple Music, Instagram, Website, or Merch store. 
            These will appear prominently on your public page like a Linktree.
          </CardDescription>
        </div>
        <Button onClick={addLink} variant="outline" className="border-[#20205a] text-[#f5f7ff] bg-transparent hover:bg-[#20205a]/30 shrink-0">
          <Plus className="w-4 h-4 mr-1" /> Add Link
        </Button>
      </CardHeader>
      <CardContent>
        {links.length === 0 ? (
          <div className="text-center py-8 text-[#9a9fc4] border border-dashed border-[#20205a] rounded-lg">
            No links added yet. Click "Add Link" to get started.
          </div>
        ) : (
          <div className="space-y-4">
            {links.map((link, index) => (
              <div key={index} className="flex gap-3 items-start p-4 rounded-xl border border-[#20205a]/50 bg-[#05052d]/50 group">
                <div className="pt-2 text-[#464c78] flex flex-col gap-1 flex-shrink-0">
                  <button onClick={() => moveUp(index)} className="hover:text-white" disabled={index === 0}>▲</button>
                  <button onClick={() => moveDown(index)} className="hover:text-white" disabled={index === links.length - 1}>▼</button>
                </div>
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-[#9a9fc4] uppercase tracking-wider font-semibold">Title</Label>
                      <Input
                        value={link.title}
                        onChange={(e) => updateLink(index, "title", e.target.value)}
                        placeholder="e.g. Spotify, Instagram, Buy Merch"
                        className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff] focus-visible:ring-[#ea6f2a]/30"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-[#9a9fc4] uppercase tracking-wider font-semibold">URL</Label>
                      <Input
                        value={link.url}
                        onChange={(e) => updateLink(index, "url", e.target.value)}
                        placeholder="https://..."
                        className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff] focus-visible:ring-[#ea6f2a]/30"
                      />
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={() => removeLink(index)} 
                  variant="ghost" 
                  size="icon" 
                  className="text-red-400 hover:text-red-300 hover:bg-red-400/10 mt-6 shrink-0"
                  title="Remove Link"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end pt-4 border-t border-[#20205a]/50">
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white min-w-[120px]"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {isSaving ? "Saving..." : "Save Links"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
