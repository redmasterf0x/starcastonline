"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Sparkles,
  Trophy,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Share2,
  Send,
  HelpCircle,
  Radio,
  ArrowRight,
  Tv,
  Music,
  Rocket,
  Flame,
  Check,
  ExternalLink,
  Facebook,
  Link2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { createDeckPost, createCommunityPost } from "@/app/actions/community"
import { authClient } from "@/lib/auth-client"

export interface QuizQuestion {
  id: string
  show: string
  category: "Spaceflight" | "Cinema & Lore" | "Music & Soundstage" | "StarCast Culture"
  icon: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

const QUESTION_BANK: QuizQuestion[] = [
  // --- ROUND 1: THE OBSERVATION DECK ---
  {
    id: "q1",
    show: "The Observation Deck",
    category: "Tabletop & Games",
    icon: "🎲",
    question: "Which recurring tabletop dice game was created by host Dirty Dave on StarCast Media?",
    options: [
      "Table Dragons",
      "Dungeon Masters of Topeka",
      "Cosmic Quest 20",
      "Dice & Deck",
    ],
    correctIndex: 0,
    explanation: "Table Dragons is the custom tabletop dice game dreamed up and run by Dirty Dave on StarCast Media!",
  },
  {
    id: "q2",
    show: "The Observation Deck",
    category: "Game Dev",
    icon: "🎮",
    question: "What is the title of the indie RPG developed from scratch by guest Colter Grant Robinson, which was featured on The Observation Deck?",
    options: [
      "Spellweaver Tactics",
      "Metamancer",
      "Etheria: Lost Horizon",
      "Arcane Protocol",
    ],
    correctIndex: 1,
    explanation: "'Metamancer' is the indie RPG crafted from the ground up by creator and guest Colter Grant Robinson.",
  },
  {
    id: "q3",
    show: "The Observation Deck",
    category: "Local Media",
    icon: "📺",
    question: "Prior to launching his AI software company, which local Topeka news station did Colter Grant Robinson report for?",
    options: [
      "WIBW Channel 13",
      "KMBC 9 News",
      "KSNT News",
      "Fox 43 Topeka",
    ],
    correctIndex: 2,
    explanation: "Before diving into AI development, Colter reported on the ground for Topeka's KSNT News.",
  },
  {
    id: "q4",
    show: "The Observation Deck",
    category: "Tech & Software",
    icon: "⌨️",
    question: "What typing game did Colter build to train users on keyboard shortcuts across programs like Photoshop and macOS?",
    options: [
      "Macro Master",
      "KeySprint Pro",
      "HotKey Hero",
      "Shortcut Kings",
    ],
    correctIndex: 3,
    explanation: "Colter built 'Shortcut Kings' as a fast-paced game to master creative app and OS keyboard shortcuts.",
  },
  {
    id: "q5",
    show: "The Observation Deck",
    category: "Cinema & Games",
    icon: "🕵️",
    question: "Guest AK Sin and Dirty Dave discussed which classic board-game-turned-movie known for having multiple theatrical endings?",
    options: [
      "Battleship",
      "Jumanji",
      "Clue (starring Tim Curry)",
      "Ouija",
    ],
    correctIndex: 2,
    explanation: "The cult classic 1985 comedy mystery 'Clue' notoriously shipped with three distinct endings to theaters!",
  },
  {
    id: "q6",
    show: "The Observation Deck",
    category: "Live Events",
    icon: "🎃",
    question: "Which DJ guest appeared on The Observation Deck to promote an upcoming October Halloween party at 1116 NW Lower Silver Lake Road?",
    options: [
      "DJ GK Smoke",
      "J Wobbles (DJ Wobbelz)",
      "DJ FrenzyFingerz",
      "DJ SubZero",
    ],
    correctIndex: 1,
    explanation: "DJ Wobbelz (J Wobbles) came onto The Observation Deck to hype up the massive October Halloween blowout!",
  },
  {
    id: "q7",
    show: "The Observation Deck",
    category: "Music Production",
    icon: "🎧",
    question: "When discussing music creation on a budget, which specific brand of gaming headset did the hosts highlight that Skrillex famously used to produce his early EP?",
    options: [
      "SteelSeries Arctis",
      "Razer Kraken",
      "HyperX Cloud II",
      "Turtle Beach",
    ],
    correctIndex: 3,
    explanation: "The hosts highlighted that Sonny Moore (Skrillex) produced his seminal breakout EP using blown-out Turtle Beach gaming headphones!",
  },

  // --- ROUND 2: THE MIDDLE SHOW ---
  {
    id: "q8",
    show: "The Middle Show",
    category: "Show Hosts",
    icon: "🎙️",
    question: "Who is the host of 'The Middle Show' on the StarCast Media platform?",
    options: [
      "Dale Lomax",
      "Todd Price",
      "Dirty Dave",
      "Nic Nassuet",
    ],
    correctIndex: 0,
    explanation: "Dale Lomax is the host and curator holding down The Middle Show on StarCast Media.",
  },
  {
    id: "q9",
    show: "The Middle Show",
    category: "Vinyl Culture",
    icon: "💿",
    question: "Brant Smith and Lonnie from Time Machine Records made Topeka history by bringing which official vinyl event to the city for the first time?",
    options: [
      "Vinyl Fest Midwest",
      "Record Store Day (Black Friday)",
      "Crate Diggers Global",
      "Sunflower Spin Day",
    ],
    correctIndex: 1,
    explanation: "Time Machine Records brought official Record Store Day Black Friday excitement to Topeka vinyl collectors for the first time!",
  },
  {
    id: "q10",
    show: "The Middle Show",
    category: "Kansas Music",
    icon: "🏭",
    question: "Which legendary Kansas town was mentioned by guests as hosting the largest and highest-quality vinyl pressing plant in the state?",
    options: [
      "Lawrence",
      "Wichita",
      "Salina (Acoustic Sounds / Quality Record Pressings)",
      "Manhattan",
    ],
    correctIndex: 2,
    explanation: "Salina, Kansas is world-renowned among audiophiles as home to Quality Record Pressings (Acoustic Sounds)!",
  },
  {
    id: "q11",
    show: "The Middle Show",
    category: "Prog Rock",
    icon: "🎸",
    question: "Which local progressive rock band, formed by Lisa LaRue-Baker and featuring an album cover painted with a State House mural, was recommended by Dale?",
    options: [
      "Prairie Flight",
      "Kaw River Syndicate",
      "Topeka Transit",
      "Quivira",
    ],
    correctIndex: 3,
    explanation: "Quivira, fronted by keyboardist Lisa LaRue-Baker, is celebrated for its Kansas State House mural cover art and intricate prog-rock soundscapes.",
  },

  // --- ROUND 3: TALK TIME WITH 40 & THE PSYCO G SPOT ---
  {
    id: "q12",
    show: "Talkin' With 40",
    category: "Guest Spotlight",
    icon: "🥃",
    question: "Who was the featured guest from Lawrence, Kansas, interviewed on Episode 1 of StarCast Presents: Talkin' With 40 / Talk Time with 40?",
    options: [
      "Brett Matlock",
      "Chad Matlock (Bumble)",
      "Just JP",
      "Colter Robinson",
    ],
    correctIndex: 1,
    explanation: "Chad Matlock ('Bumble') from Lawrence sat down for deep talk on Episode 1 of Talkin' With 40.",
  },
  {
    id: "q13",
    show: "The Psyco G Spot",
    category: "Show Moments",
    icon: "🩺",
    question: "What health checkup was physically performed on host Psyco G during Episode 4 of The Psyco G Spot?",
    options: [
      "Reflex hammer test",
      "Eye vision exam",
      "Blood pressure test",
      "Blood glucose finger prick",
    ],
    correctIndex: 2,
    explanation: "Things got hilariously real on Episode 4 when Psyco G got his blood pressure tested live on the air!",
  },
  {
    id: "q14",
    show: "The Psyco G Spot",
    category: "Guest Lineup",
    icon: "⚡",
    question: "Which duo appeared together as featured guests on Episode 3 of The Psyco G Spot?",
    options: [
      "FrenzyFingerz and Brett Matlock",
      "Dirty Dave and DJ GK Smoke",
      "Dan Jack and Vicky Tremblay",
      "Tyler Swain and Grizz Lee",
    ],
    correctIndex: 0,
    explanation: "FrenzyFingerz and Brett Matlock brought electric energy and collaborative storytelling to Episode 3.",
  },
  {
    id: "q15",
    show: "Network Spotlight",
    category: "Comedy & Events",
    icon: "😂",
    question: "What recurring Topeka live comedy night, hosted at Cosmos Court, has been promoted across the network?",
    options: [
      "Cosmic Chuckles",
      "Capital Laughs",
      "Midwest Open Mic",
      "Friday Night Funnies",
    ],
    correctIndex: 3,
    explanation: "'Friday Night Funnies' at Cosmos Court delivers raw local stand-up comedy championed by StarCast!",
  },

  // --- ROUND 4: NETWORK LORE & GUESTS ---
  {
    id: "q16",
    show: "Star Talk",
    category: "Sports Broadcasting",
    icon: "🎙️",
    question: "On Episode 1 of Star Talk hosted by Todd Price, who was the featured guest known as the 'Voice of the Ichabods'?",
    options: [
      "Mark Elliott",
      "Bob Davis",
      "Max Falkenstien",
      "Wyatt Thompson",
    ],
    correctIndex: 0,
    explanation: "Legendary Washburn sports broadcaster Mark Elliott ('Voice of the Ichabods') was the premier guest on Star Talk Ep 1.",
  },
  {
    id: "q17",
    show: "Hollywood: After Babylon",
    category: "Cinema & AI",
    icon: "🤖",
    question: "Who co-hosted alongside Nic Nassuet on Episode 1 of Hollywood: After Babylon to discuss AI art and composition?",
    options: [
      "Psyco G",
      "Dakota Stariss",
      "Dale Lomax",
      "Todd Price",
    ],
    correctIndex: 1,
    explanation: "Dakota Stariss joined Nic Nassuet to dissect AI-generated art, neural creativity, and media composition on Episode 1.",
  },
  {
    id: "q18",
    show: "The Observation Deck",
    category: "Guest Lore",
    icon: "🎤",
    question: "Which rap and recording moniker did guest JP mention using during his younger years before discovering his brother copied Eminem lyrics?",
    options: [
      "JP Raps (Prince Plow / Plow Sanity)",
      "Lil Topeka",
      "Kansas Kid",
      "MC Matrix",
    ],
    correctIndex: 0,
    explanation: "JP shared the hilarious story of rapping as 'JP Raps' (and Prince Plow / Plow Sanity) before catching his brother red-handed copying Shady bars!",
  },
  {
    id: "q19",
    show: "StarCast Live Sessions",
    category: "Live Music",
    icon: "🎻",
    question: "Which Charlie Daniels Band classic did country artist Tyler Swain perform during his live StarCast session?",
    options: [
      "Long Haired Country Boy",
      "The South's Gonna Do It Again",
      "Drinkin' My Baby Goodbye",
      "Uneasy Rider",
    ],
    correctIndex: 2,
    explanation: "Tyler Swain brought the house down with his gritty rendition of Charlie Daniels' 'Drinkin' My Baby Goodbye'!",
  },
  {
    id: "q20",
    show: "Network Lore",
    category: "Running Gags",
    icon: "👾",
    question: "In the network's ongoing gag about bizarre survival scenarios, which Pokémon character is constantly referenced when discussing shapeshifting aliens?",
    options: [
      "Mew",
      "Zoroark",
      "Gengar",
      "Ditto",
    ],
    correctIndex: 3,
    explanation: "The crew always goes back to 'Ditto' whenever wild theories about shapeshifting extraterrestrials come up!",
  },
]

// Pick 5 random questions
function pickQuestions(): QuizQuestion[] {
  const shuffled = [...QUESTION_BANK].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, 5)
}

function getRank(score: number, total: number) {
  const pct = (score / total) * 100
  if (pct === 100) {
    return {
      title: "Flight Director",
      emoji: "👑",
      badgeColor: "from-[#ffd166] to-[#ea6f2a]",
      desc: "Flawless telemetry! You have complete orbital command of the StarCast broadcast network and spaceflight lore.",
    }
  }
  if (pct >= 80) {
    return {
      title: "Orbital Specialist",
      emoji: "🚀",
      badgeColor: "from-[#20efe0] to-[#22b573]",
      desc: "Outstanding mission run! You're tuned in to the StarCast frequency and know your shows inside out.",
    }
  }
  if (pct >= 60) {
    return {
      title: "Soundstage Regular",
      emoji: "🎸",
      badgeColor: "from-[#ea6f2a] to-[#ffd166]",
      desc: "Solid score! You catch the live shows and know Topeka's creative music and broadcast pulse.",
    }
  }
  if (pct >= 40) {
    return {
      title: "Cosmic Cadet",
      emoji: "🛰️",
      badgeColor: "from-[#20205a] to-[#20efe0]",
      desc: "Signal detected! A couple of good hits, but time to binge a few more episodes on the channel.",
    }
  }
  return {
    title: "Deep Space Drifter",
    emoji: "🛸",
    badgeColor: "from-[#0c0c3f] to-[#ea6f2a]",
    desc: "Static in the feed! Hop into The Observation Deck and get caught up on recent broadcasts.",
  }
}

export function ObservationDeckQuiz() {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [quizFinished, setQuizFinished] = useState(false)

  // Sharing state
  const [postingToDeck, setPostingToDeck] = useState(false)
  const [postedToDeck, setPostedToDeck] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedQuizLink, setCopiedQuizLink] = useState(false)

  // Initialize random questions client-side to prevent SSR hydration mismatches
  useEffect(() => {
    setQuestions(pickQuestions())
  }, [])

  const currentQ = questions[currentIndex]
  const totalQuestions = questions.length || 5

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return
    setSelectedOption(idx)
    setIsAnswered(true)

    if (idx === currentQ.correctIndex) {
      setScore((prev) => prev + 1)
    }
  }

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1)
      setSelectedOption(null)
      setIsAnswered(false)
    } else {
      setQuizFinished(true)
    }
  }

  const handleRestart = () => {
    setQuestions(pickQuestions())
    setCurrentIndex(0)
    setSelectedOption(null)
    setIsAnswered(false)
    setScore(0)
    setQuizFinished(false)
    setPostedToDeck(false)
    setCopied(false)
    setCopiedQuizLink(false)
  }

  const rank = useMemo(
    () => getRank(score, totalQuestions),
    [score, totalQuestions]
  )

  const shareText = `🎯 Take the StarCast Quiz: I scored ${score}/${totalQuestions} and earned the rank of ${rank.emoji} ${rank.title}! Test your show knowledge: https://starcast.online/quiz`

  const handleShareFacebook = () => {
    const quizUrl = typeof window !== "undefined" ? `${window.location.origin}/quiz` : "https://starcast.online/quiz"
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(quizUrl)}`
    window.open(fbUrl, "_blank", "width=600,height=520,menubar=no,toolbar=no,resizable=yes")
  }

  const handleCopyQuizLink = async () => {
    const quizUrl = typeof window !== "undefined" ? `${window.location.origin}/quiz` : "https://starcast.online/quiz"
    try {
      await navigator.clipboard.writeText(quizUrl)
      setCopiedQuizLink(true)
      toast.success("Quiz link copied! Paste anywhere on Facebook, messages, or social.")
      setTimeout(() => setCopiedQuizLink(false), 2500)
    } catch {
      toast.error("Failed to copy link.")
    }
  }

  const handleNativeShare = async () => {
    const quizUrl = typeof window !== "undefined" ? `${window.location.origin}/quiz` : "https://starcast.online/quiz"
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Take the StarCast Quiz",
          text: "Test your show knowledge across StarCast broadcasts, hosts, and Topeka lore. Can you score 5/5?",
          url: quizUrl,
        })
        return
      } catch {
        // User dismissed share dialog
      }
    }
    handleCopyQuizLink()
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      toast.success("Quiz results copied to clipboard!")
      setTimeout(() => setCopied(false), 2500)
    } catch {
      toast.error("Failed to copy results.")
    }
  }

  const handlePostToDeck = async () => {
    if (!session?.user) {
      toast.info("Please sign in to broadcast your score to The DECK!")
      router.push("/login?redirect=/")
      return
    }

    setPostingToDeck(true)
    try {
      await createDeckPost(shareText)
      setPostedToDeck(true)
      toast.success("Broadcasted your quiz score to The DECK!", {
        action: {
          label: "View DECK",
          onClick: () => router.push("/community?tab=deck"),
        },
      })
    } catch (err: any) {
      const msg = err?.message || ""
      if (msg.includes("already posted") || msg.includes("24 hours")) {
        // Offer to share to open discussion thread instead
        try {
          await createCommunityPost({
            title: `Quiz Result: I scored ${score}/${totalQuestions} (${rank.title})!`,
            content: shareText,
            category: "general",
            images: [],
          })
          setPostedToDeck(true)
          toast.success("Posted to Community Discussions! (You already claimed your DECK spot today)", {
            action: {
              label: "View Post",
              onClick: () => router.push("/community"),
            },
          })
        } catch (discErr: any) {
          toast.error(discErr?.message || "Failed to share score.")
        }
      } else {
        toast.error(msg || "Could not post to The DECK.")
      }
    } finally {
      setPostingToDeck(false)
    }
  }

  if (questions.length === 0) {
    return (
      <div className="rounded-3xl border border-[#20205a]/80 bg-[#0c0c3f]/80 p-8 sm:p-12 text-center shadow-2xl animate-pulse">
        <Rocket className="w-10 h-10 text-[#20efe0] mx-auto mb-3 animate-bounce" />
        <p className="text-sm font-mono text-[#cbd0f2]">Initializing Broadcast Telemetry...</p>
      </div>
    )
  }

  return (
    <div
      id="quiz"
      className="relative rounded-3xl border border-[#20efe0]/30 bg-gradient-to-b from-[#0c0c3f]/95 via-[#07072a]/95 to-[#050524]/98 p-6 sm:p-10 shadow-2xl backdrop-blur-md overflow-hidden"
    >
      {/* Background cosmic glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#20efe0]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#ea6f2a]/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* Header bar */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#20205a]/70">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-[#20efe0] mb-1.5">
            <Radio className="w-4 h-4 text-[#ea6f2a] animate-pulse" />
            <span>STARCAST LIVE // TRIVIA CHALLENGE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#f5f7ff] tracking-tight">
            Take the StarCast Quiz
          </h2>
          <p className="text-xs sm:text-sm text-[#cbd0f2] mt-1 max-w-xl">
            Test your show knowledge across StarCast broadcasts, hosts, and Topeka lore.
          </p>

          {/* Quick Share Quiz Actions */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#20205a]/40 flex-wrap">
            <span className="text-[11px] font-mono text-[#9a9fc4] uppercase tracking-wider font-semibold">
              Share Quiz:
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleShareFacebook}
              className="h-8 px-3 rounded-lg border-[#1877f2]/40 bg-[#1877f2]/10 hover:bg-[#1877f2]/25 text-[#60a5fa] hover:text-white text-xs font-semibold gap-1.5 transition-all shadow-sm"
              title="Share Quiz on Facebook"
            >
              <Facebook className="w-3.5 h-3.5 fill-current" />
              <span>Facebook</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyQuizLink}
              className="h-8 px-3 rounded-lg border-[#20205a] bg-[#0c0c3f] hover:bg-[#20205a] text-[#cbd0f2] hover:text-[#f5f7ff] text-xs font-semibold gap-1.5 transition-all"
              title="Copy link to the StarCast Quiz"
            >
              {copiedQuizLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied Link!</span>
                </>
              ) : (
                <>
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Copy Quiz Link</span>
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleNativeShare}
              className="h-8 px-2.5 rounded-lg border-[#20205a] bg-[#0c0c3f] hover:bg-[#20205a] text-[#20efe0] hover:text-white text-xs font-semibold gap-1.5 transition-all"
              title="Share Quiz via Device"
            >
              <Share2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {!quizFinished && (
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex flex-col items-end">
              <span className="text-[11px] font-mono text-[#9a9fc4] uppercase">Mission Progress</span>
              <span className="text-sm font-black text-[#ffd166] font-mono">
                Question {currentIndex + 1} of {totalQuestions}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#05052d] border border-[#20205a] flex items-center justify-center text-lg font-bold">
              {currentQ.icon}
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {!quizFinished && (
        <div className="relative z-10 w-full h-1.5 bg-[#05052d] rounded-full overflow-hidden mt-6 mb-8 border border-[#20205a]/50">
          <div
            className="h-full bg-gradient-to-r from-[#ea6f2a] via-[#ffd166] to-[#20efe0] transition-all duration-300"
            style={{ width: `${((currentIndex + (isAnswered ? 1 : 0)) / totalQuestions) * 100}%` }}
          />
        </div>
      )}

      {/* ACTIVE QUIZ SCREEN */}
      {!quizFinished && currentQ && (
        <div className="relative z-10 space-y-6">
          {/* Question metadata badge */}
          <div className="flex items-center gap-2">
            <Badge className="bg-[#20efe0]/15 text-[#20efe0] border border-[#20efe0]/40 text-xs py-0.5 px-2.5 font-bold">
              {currentQ.show}
            </Badge>
            <Badge variant="outline" className="border-[#20205a] text-[#cbd0f2] bg-[#05052d]/80 text-xs py-0.5 px-2">
              {currentQ.category}
            </Badge>
          </div>

          {/* Question Text */}
          <h3 className="text-xl sm:text-2xl font-bold text-[#f5f7ff] leading-snug">
            {currentQ.question}
          </h3>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            {currentQ.options.map((opt, idx) => {
              const isSelected = selectedOption === idx
              const isCorrect = idx === currentQ.correctIndex
              let btnStyle = "bg-[#05052d]/80 text-[#dbe0fb] border-[#20205a] hover:bg-[#0c0c3f] hover:border-[#20efe0]/50 hover:text-white"

              if (isAnswered) {
                if (isCorrect) {
                  btnStyle = "bg-emerald-500/20 text-emerald-200 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.2)] font-bold"
                } else if (isSelected) {
                  btnStyle = "bg-rose-500/20 text-rose-200 border-rose-500/60 font-semibold"
                } else {
                  btnStyle = "bg-[#05052d]/40 text-[#9a9fc4] border-[#20205a]/40 opacity-60"
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectOption(idx)}
                  disabled={isAnswered}
                  className={`text-left p-4 sm:p-4.5 rounded-2xl border transition-all flex items-start gap-3 relative group ${btnStyle}`}
                >
                  <span className="w-6 h-6 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-sm sm:text-base leading-snug flex-1">{opt}</span>

                  {isAnswered && isCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 animate-in zoom-in-75 duration-200" />
                  )}
                  {isAnswered && isSelected && !isCorrect && (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-in zoom-in-75 duration-200" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Explanation Banner */}
          {isAnswered && (
            <div className="rounded-2xl border border-white/10 bg-[#05052d]/90 p-4 sm:p-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-[#20efe0] shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#20efe0]">
                    Broadcast Fact // {currentQ.show}
                  </p>
                  <p className="text-xs sm:text-sm text-[#e8ecff] mt-1 leading-relaxed">
                    {currentQ.explanation}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#20205a]/60 flex items-center justify-end">
                <Button
                  onClick={handleNext}
                  className="bg-gradient-to-r from-[#ea6f2a] to-[#20efe0] hover:opacity-95 text-[#05052d] font-black rounded-xl h-10 px-5 text-xs sm:text-sm shadow-lg shadow-[#20efe0]/20 gap-2 active:scale-95 transition-all"
                >
                  <span>{currentIndex + 1 === totalQuestions ? "Calculate Result" : "Next Question"}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* QUIZ FINISHED / RESULTS SCREEN */}
      {quizFinished && (
        <div className="relative z-10 py-4 sm:py-6 text-center space-y-6 animate-in zoom-in-95 fade-in duration-300">
          <div className="inline-flex p-1 rounded-3xl bg-gradient-to-tr from-[#ea6f2a] via-[#ffd166] to-[#20efe0] shadow-[0_0_35px_rgba(32,239,224,0.3)]">
            <div className="px-6 py-4 rounded-[22px] bg-[#05052d] flex items-center gap-3">
              <span className="text-3xl sm:text-4xl">{rank.emoji}</span>
              <div className="text-left">
                <p className="text-[10px] font-mono font-bold tracking-widest text-[#20efe0] uppercase">
                  Earned Cosmic Rank
                </p>
                <h3 className="text-xl sm:text-2xl font-black text-white">{rank.title}</h3>
              </div>
            </div>
          </div>

          <div className="max-w-md mx-auto">
            <div className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight">
              <span className="text-[#20efe0]">{score}</span> / {totalQuestions}
            </div>
            <p className="text-xs font-mono text-[#ffd166] font-bold uppercase mt-1">
              Score: {Math.round((score / totalQuestions) * 100)}% Accuracy
            </p>
            <p className="text-sm sm:text-base text-[#dbe0fb] mt-3 leading-relaxed">
              {rank.desc}
            </p>
          </div>

          {/* Social Share & Post Action Rail */}
          <div className="pt-4 max-w-lg mx-auto rounded-2xl border border-[#20205a] bg-[#05052d]/90 p-5 space-y-4">
            <div className="text-center">
              <p className="text-xs font-mono text-[#9a9fc4] uppercase font-bold tracking-wider">
                Share The Quiz With Friends
              </p>
              <p className="text-xs text-[#cbd0f2] mt-0.5">
                Share the quiz on Facebook or copy the link to challenge friends!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
              {/* Share Quiz on Facebook */}
              <Button
                type="button"
                onClick={handleShareFacebook}
                className="w-full sm:w-auto bg-[#1877f2] hover:bg-[#1564d2] text-white font-bold rounded-xl h-11 px-4 text-xs sm:text-sm gap-2 shadow-lg shadow-[#1877f2]/25 active:scale-95 transition-all"
              >
                <Facebook className="w-4 h-4 fill-current" />
                <span>Share Quiz on Facebook</span>
              </Button>

              {/* Copy Quiz Link */}
              <Button
                type="button"
                variant="outline"
                onClick={handleCopyQuizLink}
                className="w-full sm:w-auto border-[#20205a] bg-[#0c0c3f] hover:bg-[#20205a] text-[#cbd0f2] hover:text-white rounded-xl h-11 px-4 text-xs sm:text-sm font-bold gap-2"
              >
                {copiedQuizLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Quiz Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    <span>Copy Quiz Link</span>
                  </>
                )}
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2 border-t border-[#20205a]/60">
              {/* Post to DECK */}
              <Button
                type="button"
                onClick={handlePostToDeck}
                disabled={postingToDeck || postedToDeck}
                className="w-full sm:w-auto bg-gradient-to-r from-[#ffd166] to-[#ea6f2a] hover:opacity-90 text-black font-extrabold rounded-xl h-10 px-4 text-xs gap-1.5 shadow-lg shadow-[#ffd166]/20 transition-all active:scale-95"
              >
                {postedToDeck ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-black" />
                    <span>Posted to The DECK!</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{postingToDeck ? "Broadcasting..." : "Post Score to The DECK"}</span>
                  </>
                )}
              </Button>

              {/* Copy Score text */}
              <Button
                type="button"
                variant="ghost"
                onClick={handleCopy}
                className="w-full sm:w-auto text-[#cbd0f2] hover:text-white hover:bg-white/10 text-xs font-semibold h-10 px-3 gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-[#ffd166]" />}
                <span>{copied ? "Score Copied!" : "Copy Score Text"}</span>
              </Button>
            </div>

            <div className="pt-2 flex items-center justify-center gap-4 text-xs text-[#cbd0f2]">
              <Link
                href="/community"
                className="text-[#20efe0] hover:underline flex items-center gap-1 font-semibold"
              >
                Go to The DECK <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <span>•</span>
              <button
                type="button"
                onClick={handleRestart}
                className="text-[#ffd166] hover:underline flex items-center gap-1 font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retake (New Questions)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
