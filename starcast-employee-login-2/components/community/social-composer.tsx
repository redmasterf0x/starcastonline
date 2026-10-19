"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Sparkles,
  MessageSquare,
  Send,
  Image as ImageIcon,
  X,
  Radio,
  Lock,
  Clock,
  Plus,
  BarChart2,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  createDeckPost,
  createCommunityPost,
} from "@/app/actions/community"
import type { CommunityViewerInfo } from "./community-left-nav"

interface Category {
  id: string
  name: string
  slug: string
  icon: string
  show_id: string
  show_title: string
  topic: string
}

interface SocialComposerProps {
  currentViewer: CommunityViewerInfo | null
  categories: Category[]
  viewerHasPostedDeck: boolean
  onPostSuccess: (type: "deck" | "discussion") => void
  defaultMode?: "deck" | "discussion"
}

function getInitials(first?: string, last?: string) {
  const f = (first ?? "").trim()[0] ?? ""
  const l = (last ?? "").trim()[0] ?? ""
  return `${f}${l}` || "?"
}

export function SocialComposer({
  currentViewer,
  categories,
  viewerHasPostedDeck,
  onPostSuccess,
  defaultMode = "deck",
}: SocialComposerProps) {
  const router = useRouter()
  const [mode, setMode] = useState<"deck" | "discussion">(
    viewerHasPostedDeck ? "discussion" : defaultMode
  )

  // DECK draft state
  const [deckContent, setDeckContent] = useState("")
  const [deckSubmitting, setDeckSubmitting] = useState(false)
  const [deckError, setDeckError] = useState<string | null>(null)
  const [deckShowPoll, setDeckShowPoll] = useState(false)
  const [deckPollQuestion, setDeckPollQuestion] = useState("")
  const [deckPollOptions, setDeckPollOptions] = useState<string[]>(["", ""])

  // Discussion state
  const [discussionTitle, setDiscussionTitle] = useState("")
  const [discussionContent, setDiscussionContent] = useState("")
  const [discussionCategory, setDiscussionCategory] = useState(
    categories[0]?.slug || "general"
  )
  const [selectedImages, setSelectedImages] = useState<
    { file: File; preview: string; credit: string }[]
  >([])
  const [discussionSubmitting, setDiscussionSubmitting] = useState(false)
  const [discussionError, setDiscussionError] = useState<string | null>(null)
  const [discussionShowPoll, setDiscussionShowPoll] = useState(false)
  const [discussionPollQuestion, setDiscussionPollQuestion] = useState("")
  const [discussionPollOptions, setDiscussionPollOptions] = useState<string[]>(["", ""])

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDeckSubmit = async () => {
    if (!currentViewer) {
      router.push("/login")
      return
    }
    const text = deckContent.trim()
    if (!text) return

    setDeckSubmitting(true)
    setDeckError(null)

    try {
      const validOptions = deckPollOptions.map((o) => o.trim()).filter(Boolean)
      const pollPayload =
        deckShowPoll && deckPollQuestion.trim() && validOptions.length >= 2
          ? {
              question: deckPollQuestion.trim(),
              options: validOptions,
            }
          : undefined

      await createDeckPost(text, pollPayload)
      setDeckContent("")
      setDeckShowPoll(false)
      setDeckPollQuestion("")
      setDeckPollOptions(["", ""])
      onPostSuccess("deck")
    } catch (err: any) {
      setDeckError(err?.message || "Failed to post to the DECK. Please try again.")
    } finally {
      setDeckSubmitting(false)
    }
  }

  const handleDiscussionSubmit = async () => {
    if (!currentViewer) {
      router.push("/login")
      return
    }
    if (!discussionTitle.trim() || !discussionContent.trim()) {
      setDiscussionError("Please provide both a title and details for your discussion.")
      return
    }

    setDiscussionSubmitting(true)
    setDiscussionError(null)

    try {
      const uploadedImages: { url: string; credit: string }[] = []
      for (const img of selectedImages) {
        const formData = new FormData()
        formData.append("file", img.file)
        formData.append("folder", "community")
        const res = await fetch("/api/upload", { method: "POST", body: formData })
        if (res.ok) {
          const data = await res.json()
          uploadedImages.push({ url: data.url, credit: img.credit })
        }
      }

      const validOptions = discussionPollOptions.map((o) => o.trim()).filter(Boolean)
      const pollPayload =
        discussionShowPoll && discussionPollQuestion.trim() && validOptions.length >= 2
          ? {
              question: discussionPollQuestion.trim(),
              options: validOptions,
            }
          : undefined

      await createCommunityPost({
        title: discussionTitle.trim(),
        content: discussionContent.trim(),
        category: discussionCategory || "general",
        images: uploadedImages,
        poll: pollPayload,
      })

      setDiscussionTitle("")
      setDiscussionContent("")
      setSelectedImages([])
      setDiscussionShowPoll(false)
      setDiscussionPollQuestion("")
      setDiscussionPollOptions(["", ""])
      onPostSuccess("discussion")
    } catch (err: any) {
      setDiscussionError(err?.message || "Failed to publish discussion. Please try again.")
    } finally {
      setDiscussionSubmitting(false)
    }
  }

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      const newItems = files.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        credit: "",
      }))
      setSelectedImages((prev) => [...prev, ...newItems].slice(0, 4))
    }
  }

  const removeImage = (idx: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== idx))
  }

  return (
    <div className="rounded-3xl border border-[#20205a]/80 bg-gradient-to-b from-[#0c0c3f]/90 to-[#07072a]/95 p-5 sm:p-6 shadow-2xl backdrop-blur-md">
      {/* Header Mode Switcher */}
      <div className="flex items-center justify-between pb-4 border-b border-[#20205a]/60 gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#05052d]/90 border border-[#20205a]/60">
          <button
            type="button"
            onClick={() => setMode("deck")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all ${
              mode === "deck"
                ? "bg-[#ffd166] text-black shadow-md shadow-[#ffd166]/20"
                : "text-[#cbd0f2] hover:text-[#f5f7ff]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            The DECK (Wall)
          </button>
          <button
            type="button"
            onClick={() => setMode("discussion")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all ${
              mode === "discussion"
                ? "bg-[#ea6f2a] text-white shadow-md shadow-[#ea6f2a]/20"
                : "text-[#cbd0f2] hover:text-[#f5f7ff]"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Discussion Thread
          </button>
        </div>

        <span className="text-[11px] font-mono text-[#20efe0] font-semibold tracking-wider uppercase">
          {mode === "deck" ? "1 Post / 24h Wall" : "Open Forum"}
        </span>
      </div>

      {/* Mode 1: The DECK */}
      {mode === "deck" && (
        <div className="pt-4">
          {!currentViewer ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl bg-[#05052d]/80 border border-[#20205a]/60 p-4">
              <p className="text-xs sm:text-sm text-[#dbe0fb]">
                Sign in to post your daily update on The DECK.
              </p>
              <Button
                size="sm"
                onClick={() => router.push("/login")}
                className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-bold rounded-xl text-xs h-9 px-4 shrink-0"
              >
                Sign In
              </Button>
            </div>
          ) : viewerHasPostedDeck ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl bg-[#05052d]/80 border border-[#20205a]/60 p-4.5">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-[#ffd166] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-[#f5f7ff]">
                    You&apos;ve posted to The DECK today!
                  </p>
                  <p className="text-xs text-[#9a9fc4] mt-0.5 leading-relaxed">
                    Everyone gets 1 spot on the wall every 24 hours. You can reply freely to any post, or start an open Discussion topic.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setMode("discussion")}
                className="border-[#20205a] bg-[#0c0c3f] text-[#20efe0] hover:text-white hover:bg-[#20205a] rounded-xl text-xs h-9 px-4 shrink-0 font-bold"
              >
                Start Discussion
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#ea6f2a] to-[#20efe0] p-0.5 shrink-0">
                  <div className="w-full h-full rounded-[14px] bg-[#05052d] flex items-center justify-center overflow-hidden">
                    {currentViewer.profile_pic ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={currentViewer.profile_pic}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold text-[#f5f7ff]">
                        {getInitials(currentViewer.first_name, currentViewer.last_name)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <Textarea
                    value={deckContent}
                    onChange={(e) => setDeckContent(e.target.value)}
                    placeholder="Broadcast to the network... Paste YouTube, Spotify, or Soundstage links, or attach a StarVote poll!"
                    maxLength={2000}
                    className="w-full bg-[#05052d]/90 border-[#20205a] text-[#f5f7ff] rounded-2xl min-h-[90px] resize-none text-sm sm:text-base p-3.5 placeholder:text-[#6b7299] focus-visible:ring-[#ffd166]/50"
                  />
                </div>
              </div>

              {/* StarVote Poll Builder for DECK */}
              {deckShowPoll && (
                <div className="rounded-2xl border border-[#20efe0]/30 bg-[#05052d]/90 p-4 space-y-3 relative animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-[#20efe0]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-[#20efe0]">
                        StarVote Poll
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeckShowPoll(false)}
                      className="text-[#9a9fc4] hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <Input
                    value={deckPollQuestion}
                    onChange={(e) => setDeckPollQuestion(e.target.value)}
                    placeholder="Ask a question..."
                    className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff] rounded-xl h-10 text-xs sm:text-sm"
                  />

                  <div className="space-y-2">
                    {deckPollOptions.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          value={opt}
                          onChange={(e) => {
                            const copy = [...deckPollOptions]
                            copy[idx] = e.target.value
                            setDeckPollOptions(copy)
                          }}
                          placeholder={`Option ${idx + 1}`}
                          className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff] rounded-xl h-9 text-xs flex-1"
                        />
                        {deckPollOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() =>
                              setDeckPollOptions(deckPollOptions.filter((_, i) => i !== idx))
                            }
                            className="text-[#9a9fc4] hover:text-red-400 p-1 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {deckPollOptions.length < 4 && (
                    <button
                      type="button"
                      onClick={() => setDeckPollOptions([...deckPollOptions, ""])}
                      className="text-xs font-bold text-[#20efe0] hover:text-[#72fff6] flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Option
                    </button>
                  )}
                </div>
              )}

              {deckError && <p className="text-xs text-red-400 pl-1">{deckError}</p>}

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDeckShowPoll(!deckShowPoll)}
                    className={`border-[#20205a] bg-[#05052d] text-xs h-9 px-3 gap-1.5 transition-all ${
                      deckShowPoll
                        ? "text-[#20efe0] border-[#20efe0]/50 bg-[#20efe0]/10"
                        : "text-[#cbd0f2] hover:text-[#20efe0] hover:bg-[#20205a]"
                    }`}
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>{deckShowPoll ? "Poll Added" : "StarVote Poll"}</span>
                  </Button>
                  <span className="text-[11px] text-[#9a9fc4] font-mono hidden sm:inline">
                    {deckContent.length} / 2000 chars
                  </span>
                </div>

                <Button
                  onClick={handleDeckSubmit}
                  disabled={deckSubmitting || !deckContent.trim()}
                  className="bg-gradient-to-r from-[#ffd166] to-[#ea6f2a] hover:opacity-90 text-black font-extrabold rounded-xl h-10 px-5 text-xs sm:text-sm gap-2 shadow-lg shadow-[#ffd166]/20 transition-all active:scale-[0.98]"
                >
                  <Send className="w-3.5 h-3.5" />
                  {deckSubmitting ? "Broadcasting..." : "Post to The DECK"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Discussion Thread */}
      {mode === "discussion" && (
        <div className="pt-4 space-y-3.5">
          {!currentViewer ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl bg-[#05052d]/80 border border-[#20205a]/60 p-4">
              <p className="text-xs sm:text-sm text-[#dbe0fb]">
                Sign in to join community discussions and create topics.
              </p>
              <Button
                size="sm"
                onClick={() => router.push("/login")}
                className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-bold rounded-xl text-xs h-9 px-4 shrink-0"
              >
                Sign In
              </Button>
            </div>
          ) : (
            <>
              {/* Category selector row */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-xs font-semibold text-[#9a9fc4] shrink-0 mr-1">
                  Channel:
                </span>
                {categories.map((cat) => (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => setDiscussionCategory(cat.slug)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                      discussionCategory === cat.slug
                        ? "bg-[#ea6f2a] text-white shadow-md shadow-[#ea6f2a]/20"
                        : "bg-[#05052d] text-[#cbd0f2] hover:text-white border border-[#20205a]/60"
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>

              {/* Title input */}
              <Input
                value={discussionTitle}
                onChange={(e) => setDiscussionTitle(e.target.value)}
                placeholder="Topic Title or Question..."
                className="bg-[#05052d]/90 border-[#20205a] text-[#f5f7ff] rounded-xl h-11 text-sm font-semibold placeholder:text-[#6b7299] focus-visible:ring-[#ea6f2a]/50"
              />

              {/* Details Textarea */}
              <Textarea
                value={discussionContent}
                onChange={(e) => setDiscussionContent(e.target.value)}
                placeholder="Share your thoughts, review a soundstage track, or start a thread... Links to YouTube & Spotify embed automatically!"
                className="w-full bg-[#05052d]/90 border-[#20205a] text-[#f5f7ff] rounded-2xl min-h-[100px] resize-none text-sm p-3.5 placeholder:text-[#6b7299] focus-visible:ring-[#ea6f2a]/50"
              />

              {/* StarVote Poll Builder for Discussion */}
              {discussionShowPoll && (
                <div className="rounded-2xl border border-[#20efe0]/30 bg-[#05052d]/90 p-4 space-y-3 relative animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-[#20efe0]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-[#20efe0]">
                        StarVote Poll
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDiscussionShowPoll(false)}
                      className="text-[#9a9fc4] hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <Input
                    value={discussionPollQuestion}
                    onChange={(e) => setDiscussionPollQuestion(e.target.value)}
                    placeholder="Ask a community question..."
                    className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff] rounded-xl h-10 text-xs sm:text-sm"
                  />

                  <div className="space-y-2">
                    {discussionPollOptions.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          value={opt}
                          onChange={(e) => {
                            const copy = [...discussionPollOptions]
                            copy[idx] = e.target.value
                            setDiscussionPollOptions(copy)
                          }}
                          placeholder={`Option ${idx + 1}`}
                          className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff] rounded-xl h-9 text-xs flex-1"
                        />
                        {discussionPollOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() =>
                              setDiscussionPollOptions(
                                discussionPollOptions.filter((_, i) => i !== idx)
                              )
                            }
                            className="text-[#9a9fc4] hover:text-red-400 p-1 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {discussionPollOptions.length < 4 && (
                    <button
                      type="button"
                      onClick={() => setDiscussionPollOptions([...discussionPollOptions, ""])}
                      className="text-xs font-bold text-[#20efe0] hover:text-[#72fff6] flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Option
                    </button>
                  )}
                </div>
              )}

              {/* Image Previews */}
              {selectedImages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  {selectedImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-xl overflow-hidden aspect-video border border-[#20205a] bg-[#05052d]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.preview}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 hover:bg-red-500 text-white flex items-center justify-center transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {discussionError && (
                <p className="text-xs text-red-400 pl-1">{discussionError}</p>
              )}

              {/* Bottom toolbar */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageFileChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={selectedImages.length >= 4}
                    className="border-[#20205a] bg-[#05052d] text-[#20efe0] hover:text-white hover:bg-[#20205a] rounded-xl text-xs h-9 px-3 gap-1.5"
                  >
                    <ImageIcon className="w-4 h-4" />
                    Attach Image ({selectedImages.length}/4)
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDiscussionShowPoll(!discussionShowPoll)}
                    className={`border-[#20205a] bg-[#05052d] text-xs h-9 px-3 gap-1.5 transition-all ${
                      discussionShowPoll
                        ? "text-[#20efe0] border-[#20efe0]/50 bg-[#20efe0]/10"
                        : "text-[#cbd0f2] hover:text-[#20efe0] hover:bg-[#20205a]"
                    }`}
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>{discussionShowPoll ? "Poll Added" : "StarVote Poll"}</span>
                  </Button>
                </div>

                <Button
                  onClick={handleDiscussionSubmit}
                  disabled={
                    discussionSubmitting ||
                    !discussionTitle.trim() ||
                    !discussionContent.trim()
                  }
                  className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-bold rounded-xl h-10 px-5 text-xs sm:text-sm gap-2 shadow-lg shadow-[#ea6f2a]/25 transition-all active:scale-[0.98]"
                >
                  <Send className="w-3.5 h-3.5" />
                  {discussionSubmitting ? "Publishing..." : "Publish Discussion"}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
