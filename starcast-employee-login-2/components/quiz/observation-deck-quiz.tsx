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
    category: "Spaceflight",
    icon: "🚀",
    question: "In rocket aerodynamics frequently broken down on The Observation Deck, what does 'Max Q' refer to?",
    options: [
      "The point of maximum aerodynamic dynamic pressure on the rocket",
      "The instant the booster reaches minimum orbital velocity",
      "The thermal ceiling before entering the upper ionosphere",
      "The highest engine gimbal angle permitted during liftoff",
    ],
    correctIndex: 0,
    explanation: "Max Q is the moment when mechanical stress on the ascending vehicle reaches its absolute peak due to high speed through dense air.",
  },
  {
    id: "q2",
    show: "The Observation Deck",
    category: "Spaceflight",
    icon: "🌕",
    question: "Which NASA flagship exploration initiative aims to return humanity to the Moon and establish the orbital Gateway station?",
    options: [
      "Artemis Program",
      "Apollo Redux",
      "Orion Horizon",
      "Celestia Gateway",
    ],
    correctIndex: 0,
    explanation: "The Artemis program represents NASA's ongoing campaign to land astronauts on the lunar South Pole and build a permanent lunar presence.",
  },
  {
    id: "q3",
    show: "The Observation Deck",
    category: "Spaceflight",
    icon: "🔥",
    question: "What cryogenic propellant combination fuels SpaceX's Starship Raptor engines?",
    options: [
      "Liquid Methane (CH4) & Liquid Oxygen (LOX)",
      "RP-1 Rocket Kerosene & LOX",
      "Liquid Hydrogen (LH2) & Liquid Ozone",
      "Aerozine 50 & Dinitrogen Tetroxide",
    ],
    correctIndex: 0,
    explanation: "Raptor utilizes sub-cooled liquid methane and oxygen ('methalox'), engineered for high efficiency and eventual in-situ production on Mars.",
  },
  {
    id: "q4",
    show: "Hollywood After Babylon",
    category: "Cinema & Lore",
    icon: "🎬",
    question: "What classic 1927 silent sci-fi masterwork is celebrated on Hollywood After Babylon for shaping modern dystopian cinema?",
    options: [
      "Metropolis (directed by Fritz Lang)",
      "Solaris (directed by Andrei Tarkovsky)",
      "The Cabinet of Dr. Caligari",
      "A Trip to the Moon (Georges Méliès)",
    ],
    correctIndex: 0,
    explanation: "Fritz Lang's 1927 masterpiece 'Metropolis' revolutionized special effects and dystopian cityscapes nearly a century ago.",
  },
  {
    id: "q5",
    show: "Hollywood After Babylon",
    category: "Cinema & Lore",
    icon: "🕵️",
    question: "What is the journalistic investigative mission of StarCast's Hollywood After Babylon series?",
    options: [
      "Uncovering forgotten media scandals, lost cinema history, and entertainment mysteries",
      "Ranking weekend box office spreadsheet earnings",
      "Scouting fashion outfits from major Hollywood red carpets",
      "Reviewing animated Saturday morning cartoons",
    ],
    correctIndex: 0,
    explanation: "Hollywood After Babylon dives deep into vintage Hollywood scandals, suppressed films, and enigmatic entertainment lore.",
  },
  {
    id: "q6",
    show: "Soundstage & Music",
    category: "Music & Soundstage",
    icon: "🎸",
    question: "Under the StarCast Soundstage Music Agreement, how much master and publishing rights do independent artists retain?",
    options: [
      "100% Artist Master & Publishing Ownership",
      "50% split with the broadcast studio",
      "25% royalty escrow fee",
      "Masters transfer exclusively to the broadcast channel",
    ],
    correctIndex: 0,
    explanation: "StarCast champions local musicians: independent artists retain 100% of their master rights and publishing royalties with timestamped proof of ownership.",
  },
  {
    id: "q7",
    show: "Star Talk & Network",
    category: "StarCast Culture",
    icon: "🎙️",
    question: "Where is StarCast Media's multi-camera 4K broadcast studio and recording soundstage located?",
    options: [
      "Topeka, Kansas",
      "Austin, Texas",
      "Nashville, Tennessee",
      "Boulder, Colorado",
    ],
    correctIndex: 0,
    explanation: "StarCast Media is headquartered and produced right here in Topeka, Kansas, powering original Midwest broadcasting and live creator content.",
  },
  {
    id: "q8",
    show: "Community Lounge",
    category: "StarCast Culture",
    icon: "⭐",
    question: "What is the defining rule of 'The DECK' community wall on StarCast Online?",
    options: [
      "Every member gets 1 post on the wall every 24 hours, with unlimited replies",
      "Only verified staff members can post updates",
      "Posts require an entry fee or paid ticket purchase",
      "Posts automatically delete after 60 seconds",
    ],
    correctIndex: 0,
    explanation: "The DECK is StarCast's shared daily wall where every member claims a single spot every 24 hours, fostering deliberate, high-quality broadcasts.",
  },
  {
    id: "q9",
    show: "StarCast Presents: The Psyco G Spot",
    category: "StarCast Culture",
    icon: "⚡",
    question: "What style and tone characterizes 'StarCast Presents: The Psyco G Spot'?",
    options: [
      "Unfiltered pop culture critique, underground sounds, and spontaneous creative debate",
      "Formal corporate accounting tutorials",
      "Relaxing ASMR sleep frequencies",
      "Competitive chess analysis",
    ],
    correctIndex: 0,
    explanation: "The Psyco G Spot brings raw, unapologetic subculture commentary, indie sounds, and high-energy artistic debates to the network.",
  },
  {
    id: "q10",
    show: "The Observation Deck",
    category: "Spaceflight",
    icon: "🛰️",
    question: "What is a 'Gravity Assist' (or gravitational slingshot) maneuver commonly referenced during planetary trajectory analysis?",
    options: [
      "Using the relative movement and gravity of a planet to alter a spacecraft's velocity and path without expending propellant",
      "Firing reverse thrusters while orbiting inside planetary rings",
      "Dropping scientific payloads directly into deep oceans",
      "Detaching solar sails upon atmospheric entry",
    ],
    correctIndex: 0,
    explanation: "A gravitational slingshot uses a planet's orbital momentum to accelerate or reshape a spacecraft's trajectory while conserving valuable fuel.",
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
