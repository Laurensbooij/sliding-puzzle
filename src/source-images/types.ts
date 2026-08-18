export const SOURCE_IMAGE_NAMES = ['sailboat', 'rocket', 'bike', 'coffee', 'cat', 'flower'] as const

export type SourceImageName = (typeof SOURCE_IMAGE_NAMES)[number]
