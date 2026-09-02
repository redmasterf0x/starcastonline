"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { authClient } from "@/lib/auth-client"
import { getViewerContext, listArticles, createArticle } from "@/app/actions/articles"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ResponsiveHeader } from "@/components/responsive-header"
import { Footer } from "@/components/footer"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { extractPastedText, pasteIntoField } from "@/lib/paste-formatting"

interface Article {
  id: string
  employee_id: string
  slug?: string
  title: string
  content: string
  subtitle?: string
  excerpt?: string
  external_link?: string
  tags?: string[]
  featured?: boolean
  images: string[]
  approved: boolean
  created_at: string
  employee?: {
    first_name: string
    last_name: string
  }
  isCrewArticle?: boolean
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([])

  const [myArticlesOnly, setMyArticlesOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null)
  const [isCrew, setIsCrew] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [canWriteArticles, setCanWriteArticles] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const router = useRouter()

  // Form state
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [subtitle, setSubtitle] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [externalLink, setExternalLink] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [images, setImages] = useState<{ file: File; credit: string; preview: string }[]>([])
  const [newImageCredit, setNewImageCredit] = useState("")

  useEffect(() => {
    void fetchArticles()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myArticlesOnly])

  const fetchArticles = async () => {
    setLoading(true)
    try {
      const viewer = await getViewerContext()
      if (viewer) {
        setCurrentEmployeeId(viewer.profileId)
        setIsCrew(viewer.isEmployee)
        setIsAdmin(viewer.isAdmin)
        setCanWriteArticles(viewer.canWriteArticles)
      }

      const rows = await listArticles({ mineOnly: myArticlesOnly && !!viewer })

      // Map camelCase server rows into the shape the JSX expects
      const mapped: Article[] = rows.map((row) => ({
        id: row.id,
        employee_id: row.authorId ?? "",
        slug: row.slug ?? undefined,
        title: row.title,
        subtitle: row.subtitle ?? undefined,
        excerpt: row.excerpt ?? undefined,
        external_link: row.externalLink ?? undefined,
        tags: (row.tags as string[] | null) ?? [],
        featured: row.featured,
        images: (row.images as any[] | null) ?? [],
        content: "",
        approved: row.approved,
        created_at:
          row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
        employee: {
          first_name: row.authorFirstName ?? "",
          last_name: row.authorLastName ?? "",
        },
        isCrewArticle: row.authorIsEmployee ?? false,
      }))

      setArticles(mapped)
    } catch (err) {
      console.error("[v0] fetchArticles unexpected error:", err)
    } finally {
      setLoading(false)
    }
  }

  // Preserve paragraph/line spacing when pasting from Word, Google Docs,
  // Notion, etc. into the plain-text content field.
  const handleContentPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
    const pasted = extractPastedText(e)
    setContent(pasteIntoField(e.currentTarget, pasted, content))
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      const preview = URL.createObjectURL(file)
      setImages([...images, { file, credit: newImageCredit || "Uncredited", preview }])
      setNewImageCredit("")
      e.target.value = ""
    }
  }

  const handleRemoveImage = (index: number) => {
    URL.revokeObjectURL(images[index].preview)
    setImages(images.filter((_, i) => i !== index))
  }

  const handleSaveArticle = async () => {
    if (!title.trim() || !content.trim() || !currentEmployeeId || saving) return

    setSaving(true)
    console.log("[v0] Saving article:", title)

    const imageData = await Promise.all(
      images.map(async (img) => {
        const reader = new FileReader()
        return new Promise<{ url: string; credit: string }>((resolve) => {
          reader.onloadend = () => {
            resolve({ url: reader.result as string, credit: img.credit })
          }
          reader.readAsDataURL(img.file)
        })
      }),
    )

    try {
      await createArticle({
        title,
        subtitle: subtitle.trim() || null,
        excerpt: excerpt.trim() || null,
        externalLink: externalLink.trim() || null,
        tags: tags.length > 0 ? tags : [],
        content,
        images: imageData,
      })

      images.forEach((img) => URL.revokeObjectURL(img.preview))
      setTitle("")
      setSubtitle("")
      setExcerpt("")
      setExternalLink("")
      setTags([])
      setContent("")
      setImages([])
      setCreateDialogOpen(false)
      setSaving(false)
      await fetchArticles()
    } catch (err: any) {
      alert(`Failed to save article: ${err?.message || "Unknown error"}`)
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await authClient.signOut()
    window.location.href = "/articles"
  }

  const handleRequireAuth = () => {
    router.push("/login")
  }

  return (
    <div className="public-shell flex flex-col">
      <ResponsiveHeader
        currentPage="/articles"
        isAdmin={isAdmin}
        isCrew={isCrew}
        isLoggedIn={!!currentEmployeeId}
        onSignOut={handleSignOut}
        onLogin={() => router.push("/login")}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-16 flex-1 w-full overflow-x-hidden">
        {/* Page Header */}
        <div className="mb-12 md:mb-16">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 border-b border-[#20205a]/50 pb-8">
            <div>
              <p className="text-xs font-medium tracking-[0.2em] text-[#ea6f2a] uppercase mb-3">The Press</p>
              <h1 className="text-4xl md:text-5xl font-bold text-[#f5f7ff] tracking-tight">Articles</h1>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
            {canWriteArticles && (
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-[#ea6f2a] to-[#bc3f00] hover:from-[#bc3f00] hover:to-[#bc3f00] text-[#f5f7ff]">Create Article</Button>
                </DialogTrigger>
                <DialogContent className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff] max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl text-[#f5f7ff]">Create New Article</DialogTitle>
                    <DialogDescription className="text-[#9a9fc4]">
                      Write and publish articles to share with the team
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-[#f5f7ff]">Article Title *</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter article title..."
                        className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subtitle" className="text-[#f5f7ff]">Subtitle (Optional)</Label>
                      <Input
                        id="subtitle"
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                        placeholder="Add a subtitle..."
                        className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="excerpt" className="text-[#f5f7ff]">Excerpt (Optional)</Label>
                      <Textarea
                        id="excerpt"
                        value={excerpt}
                        onChange={(e) => setExcerpt(e.target.value)}
                        placeholder="Short summary for preview..."
                        rows={2}
                        className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tags" className="text-[#f5f7ff]">Tags</Label>
                      <div className="flex gap-2">
                        <Input
                          id="tags"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && tagInput.trim()) {
                              e.preventDefault()
                              if (!tags.includes(tagInput.trim())) {
                                setTags([...tags, tagInput.trim()])
                              }
                              setTagInput('')
                            }
                          }}
                          placeholder="Add tags (press Enter)..."
                          className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
                        />
                        <Button
                          type="button"
                          onClick={() => {
                            if (tagInput.trim() && !tags.includes(tagInput.trim())) {
                              setTags([...tags, tagInput.trim()])
                              setTagInput('')
                            }
                          }}
                          variant="outline"
                          className="border-[#20205a] text-[#ea6f2a] hover:bg-[#ea6f2a]/20 bg-transparent"
                        >
                          Add
                        </Button>
                      </div>
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-[#ea6f2a]/20 text-[#ea6f2a] rounded-full text-sm flex items-center gap-2"
                            >
                              {tag}
                              <button
                                type="button"
                                onClick={() => setTags(tags.filter((_, i) => i !== index))}
                                className="hover:text-[#f5f7ff]"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="externalLink" className="text-[#f5f7ff]">External Link (Optional)</Label>
                      <Input
                        id="externalLink"
                        value={externalLink}
                        onChange={(e) => setExternalLink(e.target.value)}
                        placeholder="https://..."
                        className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[#f5f7ff]">Images (Optional)</Label>
                      <div className="space-y-3">
                        {images.map((img, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-[#05052d] rounded-lg border border-[#20205a]">
                            <img src={img.preview || "/placeholder.svg"} alt="Preview" className="w-16 h-16 object-cover rounded" />
                            <div className="flex-1">
                              <p className="text-sm text-[#f5f7ff] truncate">{img.file.name}</p>
                              <p className="text-xs text-[#9a9fc4]">Credit: {img.credit}</p>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => handleRemoveImage(index)} className="text-red-400 hover:text-red-300 hover:bg-red-950/20">
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-1 gap-3 p-4 bg-[#05052d]/50 rounded-lg border border-[#20205a]">
                        <Input
                          value={newImageCredit}
                          onChange={(e) => setNewImageCredit(e.target.value)}
                          placeholder="Photo credit (optional)"
                          className="bg-[#05052d] border-[#20205a] text-[#f5f7ff]"
                        />
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="bg-[#05052d] border-[#20205a] text-[#f5f7ff] cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-[#ea6f2a] file:text-[#f5f7ff] hover:file:bg-[#bc3f00]"
                        />
                        <p className="text-xs text-[#9a9fc4]">Select an image from your device or camera.</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="content" className="text-[#f5f7ff]">Article Content</Label>
                      <Textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onPaste={handleContentPaste}
                        placeholder="Write your article content here..."
                        className="bg-[#05052d] border-[#20205a] text-[#f5f7ff] min-h-[300px] leading-relaxed"
                      />
                    </div>
                    <Button
                      onClick={handleSaveArticle}
                      disabled={!title.trim() || !content.trim() || saving}
                      className="w-full bg-gradient-to-r from-[#ea6f2a] to-[#bc3f00] hover:from-[#bc3f00] hover:to-[#bc3f00] text-[#f5f7ff]"
                    >
                      {saving ? "Saving..." : "Save Article"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          </div>

          {/* Search */}
          <div className="relative w-full sm:max-w-md mt-8">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a9fc4] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 bg-[#0c0c3f]/60 border-[#20205a]/50 text-[#f5f7ff] placeholder:text-[#9a9fc4]/70 pl-11 pr-4 rounded-xl focus:border-[#ea6f2a]/50 focus-visible:ring-[#ea6f2a]/20"
            />
          </div>
        </div>
        
        {/* Active filters */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-8">
            <span className="text-xs text-[#9a9fc4] uppercase tracking-wider">Filtering:</span>
            {selectedTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTags(selectedTags.filter((t) => t !== tag))}
                className="px-3 py-1 bg-[#ea6f2a]/10 text-[#ea6f2a] rounded-full text-xs font-medium flex items-center gap-1.5 hover:bg-[#ea6f2a]/20 transition-colors"
              >
                {tag}
                <span className="text-[#ea6f2a]/60">&times;</span>
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-[#ea6f2a]/30 border-t-[#ea6f2a] rounded-full animate-spin" />
          </div>
        ) : (() => {
          // Filter articles based on search and tags
          const filteredArticles = articles.filter((article) => {
            const matchesSearch = searchQuery.trim() === '' || 
              article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
              article.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              article.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
            
            const matchesTags = selectedTags.length === 0 || 
              selectedTags.every(selectedTag => article.tags?.includes(selectedTag))
            
            return matchesSearch && matchesTags
          })

          return filteredArticles.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-[#9a9fc4] text-lg">
              {myArticlesOnly ? "You haven&apos;t created any articles yet." : "No articles yet."}
            </p>
            <p className="text-sm text-[#9a9fc4]/60 mt-2">Check back soon for new content.</p>
          </div>
        ) : (
          <div>
            {/* Site Articles - modern editorial list */}
            <div className="divide-y divide-[#20205a]/50">
              {filteredArticles.map((article) => {
                const authorName = `${article.employee?.first_name || ''} ${article.employee?.last_name || ''}`.trim()
                const slug = article.slug || `${authorName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`.replace(/^-+|-+$/g, '')
                const dateFormatted = new Date(article.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()
                
                return (
                <Link
                  key={article.id}
                  href={article.approved ? `/articles/${encodeURIComponent(slug)}` : '#'}
                  className={`group block py-6 first:pt-0 last:pb-0 ${article.approved ? 'cursor-pointer' : 'opacity-60 pointer-events-none'}`}
                >
                  <div className="flex items-start gap-6">
                    {/* Date column */}
                    <div className="hidden sm:block w-28 flex-shrink-0 pt-1">
                      <span className="text-xs font-medium tracking-wider text-[#9a9fc4]">{dateFormatted}</span>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 sm:hidden">
                        <span className="text-xs font-medium tracking-wider text-[#9a9fc4]">{dateFormatted}</span>
                        {!article.approved && (
                          <span className="px-2 py-0.5 bg-yellow-900/30 border border-yellow-700/50 rounded text-[10px] text-yellow-500 font-semibold uppercase">Pending</span>
                        )}
                      </div>
                      
                      <h3 className="text-xl md:text-2xl font-semibold text-[#f5f7ff] group-hover:text-[#ea6f2a] transition-colors mb-2 leading-tight text-balance">
                        {article.title}
                      </h3>
                      
                      {article.subtitle && (
                        <p className="text-base text-[#9a9fc4]/80 mb-2 line-clamp-1">{article.subtitle}</p>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm text-[#9a9fc4]/70">
                        <span>{article.employee?.first_name} {article.employee?.last_name}</span>
                        {article.tags && article.tags.length > 0 && (
                          <>
                            <span className="text-[#20205a]">&bull;</span>
                            <div className="flex gap-1.5">
                              {article.tags.slice(0, 3).map((tag, i) => (
                                <span key={i} className="text-[#ea6f2a]/80">#{tag}</span>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Arrow */}
                    <div className="hidden sm:flex items-center pt-2">
                      <svg className="w-5 h-5 text-[#9a9fc4] group-hover:text-[#ea6f2a] group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Image strip for articles with images */}
                  {article.images && article.images.length > 0 && (() => {
                    const first = article.images[0] as any
                    const src = typeof first === "string" ? first : first?.url ?? null
                    return src ? (
                      <div className="mt-4 ml-0 sm:ml-[7.5rem] rounded-lg overflow-hidden">
                        <img 
                          src={src}
                          alt={article.title} 
                          className="w-full max-h-48 md:max-h-64 object-cover rounded-lg group-hover:scale-[1.02] transition-transform duration-500" 
                        />
                      </div>
                    ) : null
                  })()}
                </Link>
                )
              })}
            </div>
          </div>
        )})()}
      </main>
      <Footer />
    </div>
  )
}
