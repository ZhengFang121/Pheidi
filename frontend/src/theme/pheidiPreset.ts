import { definePreset } from '@primevue/themes'
import Aura from '@primevue/themes/aura'

const PheidiPreset = definePreset(Aura, {
  primitive: {
    pheidi: {
      50: '#f3fcfc',
      100: '#e3f8f8',
      200: '#c9f0ef',
      300: '#b4ebe6',
      400: '#8bdfdd',
      500: '#5bd0d4',
      600: '#45b8bd',
      700: '#35979c',
      800: '#30787c',
      900: '#2d6568',
      950: '#193f42',
    },
    red: {
      50: 'var(--color-accent-pale)',
      100: 'color-mix(in srgb, var(--color-accent-pale) 72%, var(--color-accent))',
      200: 'var(--color-accent-soft)',
      300: 'var(--color-accent-light)',
      400: 'var(--color-accent)',
      500: 'var(--color-accent)',
      600: 'color-mix(in srgb, var(--color-accent) 84%, var(--color-dark))',
      700: 'color-mix(in srgb, var(--color-accent) 72%, var(--color-dark))',
      800: 'var(--color-accent)',
      900: 'var(--color-accent)',
      950: 'var(--color-dark)',
    },
  },

  semantic: {
    primary: {
      50: '{pheidi.50}',
      100: '{pheidi.100}',
      200: '{pheidi.200}',
      300: '{pheidi.300}',
      400: '{pheidi.400}',
      500: '{pheidi.500}',
      600: '{pheidi.600}',
      700: '{pheidi.700}',
      800: '{pheidi.800}',
      900: '{pheidi.900}',
      950: '{pheidi.950}',
    },
  },
})

export default PheidiPreset
