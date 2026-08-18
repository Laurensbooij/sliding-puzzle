import type { SourceImageName } from './types'
import bike from './vectors/bike.svg'
import cat from './vectors/cat.svg'
import coffee from './vectors/coffee.svg'
import flower from './vectors/flower.svg'
import rocket from './vectors/rocket.svg'
import sailboat from './vectors/sailboat.svg'

export { SOURCE_IMAGE_NAMES } from './types'
export type { SourceImageName } from './types'

export const SOURCE_IMAGES: Record<SourceImageName, string> = {
	sailboat,
	rocket,
	bike,
	coffee,
	cat,
	flower,
}
