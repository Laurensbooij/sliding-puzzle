import type { RouteHandle } from './types'

export const isRouteHandle = (value: unknown): value is RouteHandle =>
	typeof value === 'object' &&
	value !== null &&
	'title' in value &&
	typeof value.title === 'object' &&
	value.title !== null &&
	'defaultMessage' in value.title
