import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Vitest globals are off, so RTL can't self-register its cleanup — do it here.
afterEach(cleanup)
