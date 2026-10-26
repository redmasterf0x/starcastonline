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
  {
    id: "q1",
    show: "The Observation Deck",
    category: "Show Hosts",
    icon: "🎙️",
    question: "Who are the dynamic co-hosts of StarCast Media's flagship podcast 'The Observation Deck'?",
    options: [
      "Dirty Dave & DJ GK Smoke",
      "Todd Price & Nic Nassuet",
      "Chad Matlock & Psyco G",
      "Ray Starnes & Grizz Lee",
    ],
    correctIndex: 0,
    explanation: "Dirty Dave and DJ GK Smoke are the charismatic co-hosts running the table on The Observation Deck every week!",
  },
  {
    id: "q2",
    show: "The Observation Deck",
    category: "Milestones",
    icon: "🎉",
    question: "Which special guest joined Dirty Dave and DJ GK Smoke on Episode 28 to celebrate the 500 Subscribers milestone?",
    options: [
      "DJ Wobbelz",
      "Just JP",
      "AK Sin",
      "Kreepy Isotope",
    ],
    correctIndex: 0,
    explanation: "DJ Wobbelz joined Episode 28 of The Observation Deck for an epic celebration of crossing the 500 subs milestone!",
  },
  {
    id: "q3",
    show: "The Observation Deck",
    category: "Episode Trivia",
    icon: "🔥",
    question: "Which artist joined The Observation Deck for Episode 24 to break down their music and journey?",
    options: [
      "AK Sin",
      "Chad Matlock",
      "Vicky Tremblay",
      "Todd Price",
    ],
    correctIndex: 0,
    explanation: "Episode 24 was headlined by AK Sin in an unforgettable deep-dive session on The Observation Deck.",
  },
  {
    id: "q4",
    show: "The Observation Deck",
    category: "Episode Trivia",
    icon: "🎤",
    question: "Who was the featured guest on Episode 25 of The Observation Deck?",
    options: [
      "Just JP",
      "Colter Grant Robinson",
      "Silent Ave",
      "Dan Jack",
    ],
    correctIndex: 0,
    explanation: "Just JP pulled up for Episode 25 to talk life, hustle, and the independent grind.",
  },
  {
    id: "q5",
    show: "The Observation Deck",
    category: "Episode Trivia",
    icon: "⚡",
    question: "Which recurring StarCast creator and artist joined Episode 26 to talk about the independent music grind and creative process?",
    options: [
      "Grizz Lee",
      "Bumble Bree",
      "Yxng Ched",
      "Efrain",
    ],
    correctIndex: 0,
    explanation: "Grizz Lee broke down real talk about surviving the independent grind and staying authentic on Ep 26.",
  },
  {
    id: "q6",
    show: "The Observation Deck",
    category: "Episode Trivia",
    icon: "🛸",
    question: "Which eccentric creator brought wild energy and underground vibes to Episode 12 of The Observation Deck?",
    options: [
      "Kreepy Isotope",
      "Tyler Swain",
      "Prolific",
      "FrenzyFingerz",
    ],
    correctIndex: 0,
    explanation: "Kreepy Isotope joined The Observation Deck for Episode 12 bringing unforgettable eccentric underground energy.",
  },
  {
    id: "q7",
    show: "Star Talk",
    category: "Show Hosts",
    icon: "⭐",
    question: "Who hosts 'Star Talk' on StarCast Media, spotlighting regional figures, sports culture, and local leaders?",
    options: [
      "Todd Price",
      "Dirty Dave",
      "DJ GK Smoke",
      "Nic Nassuet",
    ],
    correctIndex: 0,
    explanation: "Todd Price helms Star Talk, conducting in-depth interviews with influential figures across sports and media.",
  },
  {
    id: "q8",
    show: "Hollywood: After Babylon",
    category: "Show Hosts",
    icon: "🎬",
    question: "Who guides viewers through forgotten cinema scandals and entertainment lore on 'Hollywood: After Babylon'?",
    options: [
      "Nic Nassuet",
      "Todd Price",
      "Psyco G",
      "Dirty Dave",
    ],
    correctIndex: 0,
    explanation: "Nic Nassuet explores vintage cinematic history, suppressed stories, and Hollywood enigmas on Hollywood: After Babylon.",
  },
  {
    id: "q9",
    show: "StarCast Network",
    category: "Network Lore",
    icon: "👑",
    question: "Who is the visionary founder and executive producer behind StarCast Media in Topeka, KS?",
    options: [
      "Ray Starnes",
      "Dave Miller",
      "Todd Price",
      "Chad Matlock",
    ],
    correctIndex: 0,
    explanation: "Ray Starnes founded StarCast Media to create an independent multi-camera 4K broadcast network and recording home in Topeka, KS.",
  },
  {
    id: "q10",
    show: "The Psyco G Spot",
    category: "Show Hosts",
    icon: "🎧",
    question: "Who is the outspoken host behind the unfiltered discussions and subculture debate on 'The Psyco G Spot'?",
    options: [
      "Psyco G",
      "DJ GK Smoke",
      "Grizz Lee",
      "Just JP",
    ],
    correctIndex: 0,
    explanation: "Psyco G brings raw, unscripted commentary and underground soundwaves to The Psyco G Spot.",
  },
  {
    id: "q11",
    show: "Talkin' With 40",
    category: "Network Shows",
    icon: "🥃",
    question: "Who was the featured debut guest on Episode 1 of StarCast's 'Talkin' With 40'?",
    options: [
      "Chad Matlock",
      "Ray Starnes",
      "DJ Wobbelz",
      "AK Sin",
    ],
    correctIndex: 0,
    explanation: "Chad Matlock joined the premiere episode of Talkin' With 40 for candid stories and deep discussion.",
  },
  {
    id: "q12",
    show: "Soundstage & Music",
    category: "Artist Rights",
    icon: "🎸",
    question: "Under the StarCast Soundstage Music Agreement, how much master and publishing ownership do artists retain?",
    options: [
      "100% Artist Master & Publishing Ownership",
      "50% split with the studio",
      "25% streaming royalty escrow",
      "Ownership transfers to the YouTube network",
    ],
    correctIndex: 0,
    explanation: "StarCast is 100% artist-first: creators retain complete master rights and publishing royalties with timestamped proof of ownership.",
  },
  {
    id: "q13",
    show: "The Observation Deck",
    category: "Episode Trivia",
    icon: "👥",
    question: "Which duo joined Dirty Dave and DJ GK Smoke on Episode 29 of The Observation Deck?",
    options: [
      "Vicky Tremblay & Dan Jack",
      "Logan & Prolific",
      "Efrain & FrenzyFingerz",
      "Tyler Swain & Grizz Lee",
    ],
    correctIndex: 0,
    explanation: "Vicky Tremblay and Dan Jack joined The Observation Deck for a wide-ranging conversation in Episode 29.",
  },
  {
    id: "q14",
    show: "StarCast Network",
    category: "Broadcast Studio",
    icon: "📍",
    question: "Where is StarCast Media's multi-camera 4K broadcast studio and live soundstage located?",
    options: [
      "Topeka, Kansas",
      "Kansas City, Missouri",
      "Omaha, Nebraska",
      "Wichita, Kansas",
    ],
    correctIndex: 0,
    explanation: "StarCast Media is proudly headquartered and produced in Topeka, Kansas, powering original Midwest broadcasting.",
  },
  {
    id: "q15",
    show: "Community Lounge",
    category: "Community Rules",
    icon: "⭐",
    question: "What is the defining rule of 'The DECK' community wall on StarCast Online?",
    options: [
      "Every member gets 1 post on the wall every 24 hours (unlimited replies)",
      "Only verified channel sponsors can post updates",
      "Posts require an entry fee or paid ticket purchase",
      "Posts automatically expire after 10 minutes",
    ],
    correctIndex: 0,
    explanation: "The DECK is StarCast's shared daily wall where each member claims a single spot every 24 hours, keeping the conversation authentic.",
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
  }

  const rank = useMemo(
    () => getRank(score, totalQuestions),
    [score, totalQuestions]
  )

  const shareText = `🎯 StarCast Observation Deck Quiz: I scored ${score}/${totalQuestions} and earned the rank of ${rank.emoji} ${rank.title}! Can you beat my score? https://starcast.online#quiz`

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
            <span>THE OBSERVATION DECK // LIVE TRIVIA CHALLENGE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#f5f7ff] tracking-tight">
            How Well Do You Know StarCast?
          </h2>
          <p className="text-xs sm:text-sm text-[#cbd0f2] mt-1 max-w-xl">
            Test your knowledge of rocket telemetry, cinema investigations, Soundstage artists, and Kansas broadcasts.
          </p>
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
          <div className="pt-4 max-w-lg mx-auto rounded-2xl border border-[#20205a] bg-[#05052d]/90 p-5 space-y-3.5">
            <p className="text-xs font-mono text-[#9a9fc4] uppercase font-semibold">
              Share your score with the community:
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <Button
                onClick={handlePostToDeck}
                disabled={postingToDeck || postedToDeck}
                className="w-full sm:w-auto bg-gradient-to-r from-[#ffd166] to-[#ea6f2a] hover:opacity-90 text-black font-extrabold rounded-xl h-11 px-5 text-xs sm:text-sm gap-2 shadow-lg shadow-[#ffd166]/20 transition-all active:scale-95"
              >
                {postedToDeck ? (
                  <>
                    <Check className="w-4 h-4 text-black" />
                    <span>Posted to Community!</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{postingToDeck ? "Broadcasting..." : "Post Score to The DECK"}</span>
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleCopy}
                className="w-full sm:w-auto border-[#20205a] bg-[#0c0c3f] hover:bg-[#20205a] text-[#20efe0] hover:text-white rounded-xl h-11 px-4 text-xs sm:text-sm font-bold gap-2"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                <span>{copied ? "Copied!" : "Copy Result"}</span>
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
