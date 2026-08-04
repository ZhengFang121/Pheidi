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