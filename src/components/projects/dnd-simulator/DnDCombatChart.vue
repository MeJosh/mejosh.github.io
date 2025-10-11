<template>
  <div ref="chartContainer" class="w-full flex justify-center bg-white rounded-lg p-3 shadow-sm"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'

interface Props {
  data: number[]
  title?: string
  width?: number
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Combat Rounds Distribution',
  width: 600,
  height: 300
})

const chartContainer = ref<HTMLElement>()
let svg: any = null
let g: any = null
let xScale: any = null
let yScale: any = null

// Chart dimensions and margins
const margin = { top: 20, right: 30, bottom: 40, left: 40 }
const chartWidth = props.width - margin.left - margin.right
const chartHeight = props.height - margin.top - margin.bottom

function initializeChart() {
  if (!chartContainer.value) return

  // Clear any existing chart
  d3.select(chartContainer.value).selectAll('*').remove()

  // Create SVG
  svg = d3.select(chartContainer.value)
    .append('svg')
    .attr('width', props.width)
    .attr('height', props.height)
    .style('background-color', 'transparent')
    .style('border-radius', '8px')

  g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // Initialize scales
  xScale = d3.scaleBand()
    .range([0, chartWidth])
    .padding(0.1)

  yScale = d3.scaleLinear()
    .range([chartHeight, 0])

  // Add static elements (axes, grid, title)
  setupStaticElements()
}

function setupStaticElements() {
  // Title
  svg.append('text')
    .attr('class', 'chart-title')
    .attr('x', props.width / 2)
    .attr('y', 16)
    .attr('text-anchor', 'middle')
    .style('font-size', '14px')
    .style('font-weight', 'bold')
    .style('fill', '#111827')
    .text(props.title)

  // Create axis groups (will be updated later)
  g.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${chartHeight})`)

  g.append('g')
    .attr('class', 'y-axis')

  // Create grid groups (will be updated later)
  g.append('g')
    .attr('class', 'x-grid')
    .attr('transform', `translate(0,${chartHeight})`)

  g.append('g')
    .attr('class', 'y-grid')

  // X-axis label
  g.append('text')
    .attr('class', 'x-label')
    .attr('x', chartWidth / 2)
    .attr('y', chartHeight + 35)
    .attr('fill', '#374151')
    .style('text-anchor', 'middle')
    .style('font-size', '12px')
    .text('Number of Attacks')

  // Y-axis label
  g.append('text')
    .attr('class', 'y-label')
    .attr('transform', 'rotate(-90)')
    .attr('y', -30)
    .attr('x', -chartHeight / 2)
    .attr('fill', '#374151')
    .style('text-anchor', 'middle')
    .style('font-size', '12px')
    .text('Probability (%)')
}

function updateChart() {
  if (!chartContainer.value || !props.data.length || !svg) return

  // Prepare data - filter out empty bins and create proper format
  const chartData = props.data
    .map((count, rounds) => ({ rounds, count }))
    .filter(d => d.count > 0 && d.rounds > 0)

  if (chartData.length === 0) {
    // Hide all bars if no data
    g.selectAll('.bar')
      .transition()
      .duration(500)
      .attr('height', 0)
      .attr('y', chartHeight)
    return
  }

  // Update scales
  xScale.domain(chartData.map(d => d.rounds.toString()))
  yScale.domain([0, d3.max(chartData, d => d.count) || 0])

  // Update axes with transitions
  // For x-axis, limit to max 30 ticks to prevent overcrowding
  const xAxisTicks = chartData.length <= 30 ?
    chartData.map(d => d.rounds.toString()) :
    chartData.filter((_, i) => i % Math.ceil(chartData.length / 30) === 0).map(d => d.rounds.toString())

  const xAxis = d3.axisBottom(xScale)
    .tickValues(xAxisTicks)
  const yAxis = d3.axisLeft(yScale)

  g.select('.x-axis')
    .transition()
    .duration(500)
    .call(xAxis)
    .selectAll('text')
    .style('fill', '#374151')

  g.select('.x-axis .domain')
    .style('stroke', '#374151')

  g.select('.x-axis').selectAll('.tick line')
    .style('stroke', '#374151')

  g.select('.y-axis')
    .transition()
    .duration(500)
    .call(yAxis)
    .selectAll('text')
    .style('fill', '#374151')

  g.select('.y-axis .domain')
    .style('stroke', '#374151')

  g.select('.y-axis').selectAll('.tick line')
    .style('stroke', '#374151')

  // Update grid lines
  g.select('.x-grid')
    .transition()
    .duration(500)
    .call(d3.axisBottom(xScale)
      .tickValues(xAxisTicks)
      .tickSize(-chartHeight)
      .tickFormat(() => '')
    )
    .selectAll('line')
    .style('stroke', '#9ca3af')
    .style('stroke-dasharray', '2,2')
    .style('opacity', 0.5)

  g.select('.y-grid')
    .transition()
    .duration(500)
    .call(d3.axisLeft(yScale)
      .tickSize(-chartWidth)
      .tickFormat(() => '')
    )
    .selectAll('line')
    .style('stroke', '#9ca3af')
    .style('stroke-dasharray', '2,2')
    .style('opacity', 0.5)

  // Data join for bars
  const bars = g.selectAll('.bar')
    .data(chartData, (d: any) => d.rounds)

  // Handle new bars (enter)
  bars.enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', (d: any) => xScale(d.rounds.toString()) || 0)
    .attr('y', chartHeight)
    .attr('width', xScale.bandwidth())
    .attr('height', 0)
    .attr('fill', '#3b82f6')
    .attr('stroke', '#2563eb')
    .attr('stroke-width', 1)
    .style('cursor', 'pointer')
    .on('mouseover', function(event: any, d: any) {
      d3.select(this).attr('fill', '#2563eb')

      // Tooltip
      const tooltip = d3.select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('background', 'rgba(0, 0, 0, 0.8)')
        .style('color', 'white')
        .style('padding', '8px 12px')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('opacity', 0)

      tooltip.transition().duration(200).style('opacity', 1)
      tooltip.html(`Attacks: ${d.rounds}<br/>Probability: ${d.count.toFixed(2)}%`)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px')
    })
    .on('mouseout', function() {
      d3.select(this).attr('fill', '#3b82f6')
      d3.selectAll('.tooltip').remove()
    })
    .transition()
    .duration(600)
    .delay((d: any, i: number) => i * 30)
    .attr('y', (d: any) => yScale(d.count))
    .attr('height', (d: any) => chartHeight - yScale(d.count))

  // Handle existing bars (update) - this is the key for smooth transitions
  bars.transition()
    .duration(600)
    .attr('x', (d: any) => xScale(d.rounds.toString()) || 0)
    .attr('width', xScale.bandwidth())
    .attr('y', (d: any) => yScale(d.count))
    .attr('height', (d: any) => chartHeight - yScale(d.count))

  // Handle removed bars (exit)
  bars.exit()
    .transition()
    .duration(400)
    .attr('height', 0)
    .attr('y', chartHeight)
    .remove()
}

// Watch for data changes and update chart
watch(() => props.data, () => {
  nextTick(() => {
    updateChart()
  })
}, { deep: true })

onMounted(() => {
  initializeChart()
  updateChart()
})
</script>

<style>
.tooltip {
  z-index: 1000;
}

.grid line {
  stroke: #d1d5db;
}

.grid path {
  stroke-width: 0;
}
</style>