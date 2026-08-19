import { isJsonObject } from '@/lib/storage'

import type { Settings } from './types'

export const isSettings = (value: unknown): value is Settings =>
	isJsonObject(value) &&
	typeof value.referenceImage === 'boolean' &&
	typeof value.numberedTiles === 'boolean' &&
	typeof value.showTimer === 'boolean'
