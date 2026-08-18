import type { FC, SVGProps } from 'react'

import type { SourceImageName } from './types'
import Bike from './vectors/bike.svg?react'
import Cat from './vectors/cat.svg?react'
import Coffee from './vectors/coffee.svg?react'
import Flower from './vectors/flower.svg?react'
import Rocket from './vectors/rocket.svg?react'
import Sailboat from './vectors/sailboat.svg?react'

export { SOURCE_IMAGE_NAMES } from './types'
export type { SourceImageName } from './types'

/**
 * Source images are inlined as components rather than referenced by URL: their
 * strokes are `currentColor`, and an `<img>` renders in a document of its own
 * where that can only ever resolve to black. Inline, the consumer's `color`
 * reaches them — the ink is set where the image is used, not baked into the file.
 */
export const SOURCE_IMAGES: Record<SourceImageName, FC<SVGProps<SVGSVGElement>>> = {
	sailboat: Sailboat,
	rocket: Rocket,
	bike: Bike,
	coffee: Coffee,
	cat: Cat,
	flower: Flower,
}
