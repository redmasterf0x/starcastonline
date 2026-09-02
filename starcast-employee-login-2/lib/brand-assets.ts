// Brand kit assets served entirely from LOCAL files in /public/images.
// Updated to the 2026 Starcast Media brand kit (astronaut-cameraman mascot).
// Available local files:
//   /images/starcast-mascot-badge.svg  (full-color circular planet badge)
//   /images/starcast-mascot.png        (transparent full-color mascot)
//   /images/starcast-wordmark.png      (transparent "STARCAST MEDIA" text-only logotype)
const WHITE = "/images/starcast-mascot.png"
const COLOR = "/images/starcast-mascot.png"
const SEAL = "/images/starcast-mascot-badge.svg"
const WORDMARK = "/images/starcast-wordmark.png"

export const brandAssets = {
  capstone: {
    white: WHITE,
    black: COLOR,
    fullcolor: COLOR,
  },

  // Full logo: Capstone + Logotype combined
  full: {
    horizontalWhite: WHITE,
    horizontalBlack: COLOR,
    horizontalFullcolor: COLOR,
    horizHoriz: COLOR,
    verticalHorizontal: COLOR,
    verticalWhite: WHITE,
    verticalBlack: COLOR,
    verticalWhiteBlackStroke: WHITE,
    verticalBlackWhiteStroke: COLOR,
  },

  // Logotype (text only, no icon)
  logotype: {
    horizontalWhite: WORDMARK,
    horizontalBlack: WORDMARK,
    horizontalWhiteBlackStroke: WORDMARK,
    horizontalBlackWhiteStroke: WORDMARK,
    verticalWhite: WORDMARK,
    verticalBlack: WORDMARK,
    verticalWhiteBlackStroke: WORDMARK,
    verticalBlackWhiteStroke: WORDMARK,
  },

  // Logo seal (circular badge)
  seal: SEAL,
} as const
