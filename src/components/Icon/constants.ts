import type { LucideIcon } from 'lucide-react'
import {
	ArrowLeft,
	Check,
	ChevronDown,
	CircleHelp,
	Flame,
	Footprints,
	Grid3x3,
	Hand,
	ImageIcon,
	Info,
	Keyboard,
	Lightbulb,
	Maximize,
	Minus,
	PartyPopper,
	Pause,
	Play,
	Plus,
	RotateCcw,
	Settings,
	Shuffle,
	Timer,
	Trophy,
	Volume2,
	VolumeX,
	X,
} from 'lucide-react'

export const ICON_TESTIDS = {
	BASE: 'icon',
} as const

/** Steps of the icon scale, smallest first. */
export const ICON_SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const

/**
 * The designed set: the 26 stock Lucide glyphs the design system draws from
 * (ADR-0011). Naming them one by one keeps the bundle to the designed set
 * rather than all of Lucide — a wildcard re-export would pull in everything.
 *
 * It does not narrow further than that: a runtime lookup by name keeps every
 * entry reachable, so a screen rendering one glyph still carries all 26 (~10 kB
 * raw). Per-glyph shaking would mean giving up the name union for a component
 * argument, which is the trade the design system did not want.
 *
 * Adding a glyph means adding it in Figma first; the keys mirror Lucide's own
 * kebab-case names so the two stay comparable by eye.
 */
export const ICON_GLYPHS = {
	'arrow-left': ArrowLeft,
	check: Check,
	'chevron-down': ChevronDown,
	'circle-help': CircleHelp,
	flame: Flame,
	footprints: Footprints,
	'grid-3x3': Grid3x3,
	hand: Hand,
	image: ImageIcon,
	info: Info,
	keyboard: Keyboard,
	lightbulb: Lightbulb,
	maximize: Maximize,
	minus: Minus,
	'party-popper': PartyPopper,
	pause: Pause,
	play: Play,
	plus: Plus,
	'rotate-ccw': RotateCcw,
	settings: Settings,
	shuffle: Shuffle,
	timer: Timer,
	trophy: Trophy,
	'volume-2': Volume2,
	'volume-x': VolumeX,
	x: X,
} as const satisfies Record<string, LucideIcon>
