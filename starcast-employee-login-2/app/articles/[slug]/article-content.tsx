"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { getMyProfile } from "@/app/actions/profile"
import {
  getArticleBySlug,
  getArticleLikeState,
  toggleArticleLike,
  toggleArticleSave,
  updateArticle,
  deleteArticle,
} from "@/app/actions/articles"
import { ResponsiveHeader } from "@/components/responsive-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit, Trash2, Share2, LinkIcon, Twitter, Facebook, Bookmark } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { extractPastedText, pasteIntoField } from "@/lib/paste-formatting"

interface Article {
  id: string
  title: string
  content: string
  created_at: string
  approved: boolean
  employee_id: string
  images?: any[]
  employee?: {
    user_id: string
    first_name: string
    last_name: string
    profile_pic?: string
  }
}

export default function ArticleContent() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const { toast } = useToast()
  const slug = typeof params.slug === 'string' ? params.slug : params.slug?.[0] || ''
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [editDialog, setEditDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [authPromptDialog, setAuthPromptDialog] = useState(false)
  const [editTitle, setEditTitle] = useState("")
  const [editContent, setEditContent] = useState("")
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [likeCount, setLikeCount] = useState(0)
  const [userLiked, setUserLiked] = useState(false)
  const [userSaved, setUserSaved] = useState(false)
  const [savingBookmark, setSavingBookmark] = useState(false)

  useEffect(() => {
    fetchArticle()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  // Track auth state via Better Auth session
  useEffect(() => {
    if (session?.user) {
      setIsLoggedIn(true)
      setCurrentUserId(session.user.id)
      getMyProfile()
        .then((profile) => setIsAdmin(profile?.isAdmin === true))
        .catch(() => setIsAdmin(false))
      if (article) {
        refreshLikeState(article.id)
      }
    } else if (session === null) {
      setIsLoggedIn(false)
      setIsAdmin(false)
      setCurrentUserId(null)
      setUserLiked(false)
      setUserSaved(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  const fetchArticle = async () => {
    if (!slug) return
    try {
      const decodedSlug = decodeURIComponent(slug)
      const found = await getArticleBySlug(decodedSlug)

      if (found && found.approved) {
        // Map camelCase server row to the shape the JSX expects
        setArticle({
          id: found.id,
          title: found.title,
          content: found.content,
          created_at:
            found.createdAt instanceof Date ? found.createdAt.toISOString() : String(found.createdAt),
          approved: found.approved,
          employee_id: found.authorId ?? "",
          images: (found.images as any[] | null) ?? [],
          employee: {
            user_id: found.authorUserId ?? "",
            first_name: found.authorFirstName ?? "",
            last_name: found.authorLastName ?? "",
            profile_pic: found.authorProfilePic ?? undefined,
          },
        })
        refreshLikeState(found.id)
      }
      setLoading(false)
    } catch {
      setLoading(false)
    }
  }

  const refreshLikeState = async (articleId: string) => {
    try {
      const state = await getArticleLikeState(articleId)
      setLikeCount(state.total)
      setUserLiked(state.liked)
      setUserSaved(state.saved)
    } catch {
      // ignore
    }
  }

  const handleToggleLike = async () => {
    if (!article || !currentUserId) return
    try {
      const { liked } = await toggleArticleLike(article.id)
      setUserLiked(liked)
      setLikeCount((c) => (liked ? c + 1 : Math.max(0, c - 1)))
    } catch {
      // ignore
    }
  }

  const handleToggleSave = async () => {
    if (!article || !currentUserId) return
    setSavingBookmark(true)
    try {
      const { saved } = await toggleArticleSave(article.id)
      setUserSaved(saved)
    } catch {
      // ignore
    }
    setSavingBookmark(false)
  }

  const handleEdit = () => {
    setEditTitle(article?.title || "")
    setEditContent(article?.content || "")
    setEditDialog(true)
  }

  // Preserve paragraph/line spacing when pasting from Word, Google Docs,
  // Notion, etc. into the plain-text content field.
  const handleEditContentPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
    const pasted = extractPastedText(e)
    setEditContent(pasteIntoField(e.currentTarget, pasted, editContent))
  }

  const handleSaveEdit = async () => {
    if (!article) return

    try {
      await updateArticle(article.id, { title: editTitle, content: editContent })
      toast({
        title: "Success",
        description: "Article updated successfully.",
      })
      setEditDialog(false)
      fetchArticle()
    } catch {
      toast({
        title: "Error",
        description: "Failed to update article.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!article) return
    try {
      await deleteArticle(article.id)
      toast({
        title: "Success",
        description: "Article deleted successfully.",
      })
      setTimeout(() => {
        router.push("/articles")
      }, 1000)
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete article. Please try again.",
        variant: "destructive",
      })
    }
    setDeleteDialog(false)
  }

  const handleCopyLink = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    toast({
      title: "Link copied!",
      description: "Article link copied to clipboard.",
    })
    setShowShareMenu(false)
  }

  const handleShareTwitter = () => {
    const url = window.location.href
    const text = `Check out this article: ${article?.title}`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank')
    setShowShareMenu(false)
  }

  const handleShareFacebook = () => {
    const url = window.location.href
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
    setShowShareMenu(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <ResponsiveHeader isLoggedIn={false} isAdmin={false} isCrew={false} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-6 h-6 border-2 border-[#ea6f2a]/30 border-t-[#ea6f2a] rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen">
        <ResponsiveHeader isLoggedIn={false} isAdmin={false} isCrew={false} />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-[#9a9fc4] text-lg">Article not found</p>
          <Button
            onClick={() => router.push("/articles")}
            variant="outline"
            className="border-[#ea6f2a] text-[#ea6f2a] hover:bg-[#ea6f2a]/20 bg-transparent"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Articles
          </Button>
        </div>
      </div>
    )
  }

  // Helper: gate interactive actions behind login
  const requireAuth = (action: () => void) => {
    if (!isLoggedIn) {
      setAuthPromptDialog(true)
      return
    }
    action()
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <ResponsiveHeader isLoggedIn={isLoggedIn} isAdmin={isAdmin} isCrew={false} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full">
        {/* Back Button & Share */}
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={() => router.push("/articles")}
            variant="ghost"
            className="text-[#9a9fc4] hover:text-[#f5f7ff] hover:bg-[#20205a]/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Articles
          </Button>

          <div className="flex gap-2">
            {/* Share Button - Always visible */}
            <div className="relative">
              <Button
                onClick={() => setShowShareMenu(!showShareMenu)}
                size="sm"
                variant="ghost"
                className="text-[#ea6f2a] hover:text-[#f5f7ff] hover:bg-[#ea6f2a]/20"
              >
                <Share2 className="w-4 h-4" />
              </Button>
              {showShareMenu && (
                <div className="absolute right-0 top-full mt-2 bg-[#05052d] border border-[#20205a] rounded-lg shadow-lg p-2 space-y-1 z-50 min-w-[160px]">
                  <Button
                    onClick={handleCopyLink}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-[#f5f7ff] hover:bg-[#20205a]"
                  >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Copy Link
                  </Button>
                  <Button
                    onClick={handleShareTwitter}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-[#f5f7ff] hover:bg-[#20205a]"
                  >
                    <Twitter className="w-4 h-4 mr-2" />
                    Twitter
                  </Button>
                  <Button
                    onClick={handleShareFacebook}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-[#f5f7ff] hover:bg-[#20205a]"
                  >
                    <Facebook className="w-4 h-4 mr-2" />
                    Facebook
                  </Button>
                </div>
              )}
            </div>

            {/* Admin Buttons */}
            {isAdmin && (
              <>
                <Button
                  onClick={handleEdit}
                  size="sm"
                  variant="ghost"
                  className="text-[#ea6f2a] hover:text-[#f5f7ff] hover:bg-[#ea6f2a]/20"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => setDeleteDialog(true)}
                  size="sm"
                  variant="ghost"
                  className="text-red-400 hover:text-[#f5f7ff] hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Article Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#f5f7ff] mb-4 text-balance">{article.title}</h1>
          <div className="flex items-center gap-4 text-[#9a9fc4]">
            {article.employee?.profile_pic && (
              <img
                src={article.employee.profile_pic}
                alt={`${article.employee?.first_name} ${article.employee?.last_name}`}
                className="w-12 h-12 rounded-full object-cover"
              />
            )}
            <div>
              <p className="font-medium text-[#f5f7ff]">
                {article.employee?.first_name} {article.employee?.last_name}
              </p>
              <p className="text-sm">{new Date(article.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </div>

        {/* Article Images */}
        {article.images && article.images.length > 0 && (
          <div className="mb-8 space-y-6">
            {article.images.map((img: any, idx: number) => (
              <div key={idx} className="rounded-xl overflow-hidden">
                <img
                  src={img.url || "/placeholder.svg"}
                  alt={`Article image ${idx + 1}`}
                  className="w-full max-w-full h-auto max-h-[70vh] object-contain mx-auto rounded-xl"
                />
                {img.credit && (
                  <p className="text-xs text-[#9a9fc4] mt-2 text-center">Photo credit: {img.credit}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Article Content */}
        <div className="prose prose-invert prose-lg max-w-none">
          <p className="text-[#f5f7ff] whitespace-pre-wrap leading-relaxed">{article.content}</p>
        </div>

        {/* Gated Interaction Bar */}
        <div className="mt-10 pt-6 border-t border-[#20205a] flex flex-wrap items-center gap-3">
          <Button
            onClick={() => requireAuth(handleToggleLike)}
            variant="outline"
            className={`border-[#20205a] hover:bg-[#20205a]/40 bg-transparent gap-2 ${userLiked ? "text-red-400 border-red-400/50" : "text-[#9a9fc4]"}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill={userLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            {userLiked ? "Liked" : "Like"}{likeCount > 0 ? ` (${likeCount})` : ""}
          </Button>
          <Button
            onClick={() => requireAuth(handleToggleSave)}
            disabled={savingBookmark}
            variant="outline"
            className={`border-[#20205a] hover:bg-[#20205a]/40 bg-transparent gap-2 ${userSaved ? "text-[#ea6f2a] border-[#ea6f2a]/50" : "text-[#9a9fc4]"}`}
          >
            <Bookmark className="w-4 h-4" fill={userSaved ? "currentColor" : "none"} />
            {!isLoggedIn ? "Log in to save article" : userSaved ? "Saved" : "Save"}
          </Button>
          <Button
            onClick={() => requireAuth(() => {})}
            variant="outline"
            className="border-[#20205a] text-[#9a9fc4] hover:bg-[#20205a]/40 bg-transparent gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Comment
          </Button>
          <Button
            onClick={() => requireAuth(() => router.push(`/profile/${article.employee?.user_id}`))}
            variant="ghost"
            className="text-[#ea6f2a] hover:text-[#f2a04a] hover:bg-[#ea6f2a]/10 gap-2 ml-auto"
          >
            View Author Profile
          </Button>
          {!isLoggedIn && (
            <p className="w-full text-xs text-[#9a9fc4]/60 mt-1">
              <button onClick={() => setAuthPromptDialog(true)} className="text-[#ea6f2a] hover:underline">Sign in</button> or <button onClick={() => { router.push("/signup") }} className="text-[#ea6f2a] hover:underline">create an account</button> to like, comment, and connect with the community.
            </p>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="bg-[#05052d] border-[#20205a] max-w-2xl w-full flex flex-col max-h-[90vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#20205a] flex-shrink-0">
            <DialogTitle className="text-[#f5f7ff]">Edit Article</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div>
              <Label className="text-[#9a9fc4]">Title</Label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff] mt-1"
              />
            </div>
            <div>
              <Label className="text-[#9a9fc4]">Content</Label>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onPaste={handleEditContentPaste}
                rows={18}
                className="bg-[#0c0c3f] border-[#20205a] text-[#f5f7ff] mt-1 resize-none"
              />
            </div>
          </div>
          <DialogFooter className="px-6 py-4 border-t border-[#20205a] flex-shrink-0 bg-[#05052d]">
            <Button
              onClick={() => setEditDialog(false)}
              variant="outline"
              className="border-[#20205a] text-[#9a9fc4] hover:bg-[#20205a]/20 bg-transparent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              className="bg-[#ea6f2a] hover:bg-[#f2a04a] text-[#f5f7ff]"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auth Prompt Dialog */}
      <Dialog open={authPromptDialog} onOpenChange={setAuthPromptDialog}>
        <DialogContent className="bg-[#05052d] border-[#20205a] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#f5f7ff]">Join Starcast</DialogTitle>
            <DialogDescription className="text-[#9a9fc4]">
              Create an account or sign in to like, comment, and interact with the community.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-2">
            <Button
              onClick={() => { setAuthPromptDialog(false); router.push("/signup") }}
              className="bg-[#ea6f2a] hover:bg-[#f2a04a] text-[#f5f7ff] w-full"
            >
              Create Account
            </Button>
            <Button
              onClick={() => { setAuthPromptDialog(false); router.push("/login") }}
              variant="outline"
              className="border-[#20205a] text-[#9a9fc4] hover:bg-[#20205a]/30 bg-transparent w-full"
            >
              Sign In
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="bg-[#05052d] border-[#20205a]">
          <DialogHeader>
            <DialogTitle className="text-[#f5f7ff]">Delete Article</DialogTitle>
            <DialogDescription className="text-[#9a9fc4]">
              Are you sure you want to delete this article? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setDeleteDialog(false)}
              variant="outline"
              className="border-[#20205a] text-[#9a9fc4] hover:bg-[#20205a]/20 bg-transparent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
