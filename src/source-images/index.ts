import bike from './bike.svg'
import cat from './cat.svg'
import coffee from './coffee.svg'
import flower from './flower.svg'
import rocket from './rocket.svg'
import sailboat from './sailboat.svg'

export const SOURCE_IMAGE_NAMES = ['sailboat', 'rocket', 'bike', 'coffee', 'cat', 'flower'] as const

export type SourceImageName = (typeof SOURCE_IMAGE_NAMES)[number]

export const SOURCE_IMAGES: Record<SourceImageName, string> = {
	sailboat,
	rocket,
	bike,
	coffee,
	cat,
	flower,
}
