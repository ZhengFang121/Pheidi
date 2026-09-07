<template>
  <BaseCard as="article" class="trend-card">
    <header class="trend-card__header">
      <div class="trend-card__identity">
        <span class="trend-card__icon" aria-hidden="true">
          <component :is="icon" />
        </span>
        <div>
          <p class="trend-card__category">{{ category }}</p>
          <h3 class="trend-card__title">{{ title }}</h3>
        </div>
      </div>
    </header>

    <div v-if="summaryItems.length === 1" class="trend-card__summary">
      <span>{{ summaryItems[0]?.label }}</span>
      <strong>{{ summaryItems[0]?.value.toLocaleString('zh-TW') }}</strong>
    </div>
    <dl v-else class="trend-card__summary-list">
      <div v-for="item in summaryItems" :key="item.label">
        <dt><span :style="{ backgroundColor: item.color }" />{{ item.label }}</dt>
        <dd>{{ item.value.toLocaleString('zh-TW') }}</dd>
      </div>
    </dl>

    <div class="trend-card__chart">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, type Component } from 'vue'
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import { Line } from 'vue-chartjs'

import BaseCard from '@/components/base/BaseCard.vue'

interface TrendSeries {
  label: string
  data: number[]
  tone: 'primary' | 'accent'
}

interface SummaryItem {
  label: string
  value: number
  color?: string
}

const props = defineProps<{
  category: string
  title: string
  icon: Component
  dates: string[]
  series: TrendSeries[]
  summaryItems: SummaryItem[]
  valueUnit: '人' | '篇' | '筆'
}>()

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Filler, Tooltip, Legend)

const colors = ref({
  primary: '#5bd0d4',
  accent: '#ff9c46',
  text: '#6f7185',
  grid: '#dce8e8',
})

onMounted(() => {
  const styles = getComputedStyle(document.documentElement)
  colors.value = {
    primary: styles.getPropertyValue('--color-primary').trim(),
    accent: styles.getPropertyValue('--color-accent').trim(),
    text: styles.getPropertyValue('--color-text-secondary').trim(),
    grid: styles.getPropertyValue('--color-border').trim(),
  }
})

const formatChartDate = (date: string) => {
  const [, month, day] = date.split('-')
  return `${Number(month)}月${Number(day)}日`
}

const chartData = computed<ChartData<'line'>>(() => ({
  labels: props.dates,
  datasets: props.series.map((item) => {
    const color = colors.value[item.tone]

    return {
      label: item.label,
      data: item.data,
      borderColor: color,
      backgroundColor: `${color}24`,
      borderWidth: 2,
      pointRadius: 1.75,
      pointHoverRadius: 4,
      pointBackgroundColor: color,
      pointBorderWidth: 0,
      fill: props.series.length === 1,
      tension: 0.28,
    }
  }),
}))

const chartOptions = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? false
    : { duration: 350 },
  interaction: { intersect: false, mode: 'index' },
  layout: { padding: { top: 6 } },
  plugins: {
    legend: {
      display: props.series.length > 1,
      position: 'bottom',
      align: 'start',
      labels: {
        color: colors.value.text,
        boxWidth: 8,
        boxHeight: 8,
        usePointStyle: true,
        pointStyle: 'circle',
        padding: 16,
      },
    },
    tooltip: {
      callbacks: {
        title: (items) => formatChartDate(String(items[0]?.label ?? '')),
        label: (context) =>
          props.series.length > 1
            ? `${context.dataset.label} ${context.parsed.y} 筆`
            : `${context.parsed.y} ${props.valueUnit}`,
      },
    },
  },
  scales: {
    x: {
      border: { display: false },
      grid: { display: false },
      ticks: {
        color: colors.value.text,
        maxRotation: 0,
        autoSkip: true,
        maxTicksLimit: 5,
        callback: (_value, index) => {
          const date = props.dates[index]
          if (!date) return ''
          const [, month, day] = date.split('-')
          return `${Number(month)}/${Number(day)}`
        },
      },
    },
    y: {
      beginAtZero: true,
      border: { display: false },
      grid: { color: `${colors.value.grid}99` },
      ticks: { color: colors.value.text, precision: 0, maxTicksLimit: 5 },
    },
  },
}))
</script>

<style scoped>
.trend-card {
  display: flex;
  min-width: 0;
  min-height: 25rem;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4);
  overflow: hidden;
  border-radius: var(--radius-lg);
}

.trend-card__header,
.trend-card__identity {
  display: flex;
  align-items: center;
}

.trend-card__header {
  justify-content: space-between;
  gap: var(--space-3);
}

.trend-card__identity {
  min-width: 0;
  gap: var(--space-3);
}

.trend-card__icon {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  color: var(--color-primary);
  background: var(--color-primary-pale);
  border-radius: var(--radius-md);
}

.trend-card__icon :deep(svg) {
  width: 24px;
  height: 24px;
}

.trend-card__category {
  margin: 0 0 var(--space-1);
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}

.trend-card__title {
  margin: 0;
  font-size: var(--font-size-base);
  line-height: var(--line-height-heading);
}

.trend-card__summary {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  padding-inline-start: calc(48px + var(--space-3));
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.trend-card__summary strong {
  color: var(--color-text);
  font-size: var(--font-size-xl);
  line-height: var(--line-height-tight);
}

.trend-card__summary-list {
  display: flex;
  gap: var(--space-6);
  margin: 0;
  padding-inline-start: calc(48px + var(--space-3));
}

.trend-card__summary-list div {
  display: grid;
  gap: var(--space-1);
}

.trend-card__summary-list dt {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}

.trend-card__summary-list dt span {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
}

.trend-card__summary-list dd {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
}

.trend-card__chart {
  position: relative;
  min-width: 0;
  min-height: 0;
  flex: 1;
}

@media (max-width: 640px) {
  .trend-card {
    min-height: 23rem;
    padding: var(--space-3);
  }

  .trend-card__header {
    align-items: flex-start;
  }
}
</style>
