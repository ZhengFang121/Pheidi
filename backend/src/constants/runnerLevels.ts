export const RUNNER_LEVELS = [
  {
    level: 1,
    name: '啟程者',
    requirements: {},
  },
  {
    level: 2,
    name: '習跑者',
    requirements: {
      runCount: 5,
      totalDistance: 10,
    },
  },
  {
    level: 3,
    name: '冒險者',
    requirements: {
      runCount: 10,
      totalDistance: 30,
      distinctLocationCount: 3,
    },
  },
  {
    level: 4,
    name: '挑戰者',
    requirements: {
      runCount: 25,
      totalDistance: 100,
      badgeCount: 10,
    },
  },
  {
    level: 5,
    name: '菲迪同行者',
    requirements: {
      runCount: 50,
      totalDistance: 250,
      requiresPheidiMission: true,
    },
  },
] as const

export type RunnerLevel = (typeof RUNNER_LEVELS)[number]['level']

export const MAXIMUM_AUTOMATIC_RUNNER_LEVEL: RunnerLevel = 4

export const getRunnerLevelDefinition = (level: RunnerLevel) => {
  return RUNNER_LEVELS.find((definition) => definition.level === level)!
}
