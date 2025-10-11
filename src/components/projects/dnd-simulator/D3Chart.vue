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

// Chart dimensions and margins
const margin = { top: 20, right: 30, bottom: 40, left: 40 }
const chartWidth = props.width - margin.left - margin.right
const chartHeight = props.height - margin.top - margin.bottom

function createChart() {
  if (!chartContainer.value || !props.data.length) return

  // Clear previous chart
  d3.select(chartContainer.value).selectAll('*').remove()

  // Prepare data - filter out empty bins and create proper format
  const chartData = props.data
    .map((count, rounds) => ({ rounds, count }))
    .filter(d => d.count > 0 && d.rounds > 0)

  if (chartData.length === 0) return

  // Create SVG
  const svg = d3.select(chartContainer.value)
    .append('svg')
    .attr('width', props.width)
    .attr('height', props.height)
    .style('background-color', '#ffffff')
    .style('border-radius', '8px')

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // Scales
  const xScale = d3.scaleBand()
    .domain(chartData.map(d => d.rounds.toString()))
    .range([0, chartWidth])
    .padding(0.1)

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(chartData, d => d.count) || 0])
    .range([chartHeight, 0])

  // Create bars
  g.selectAll('.bar')
    .data(chartData)
    .enter().append('rect')
    .attr('class', 'bar')
    .attr('x', d => xScale(d.rounds.toString()) || 0)
    .attr('y', chartHeight)
    .attr('width', xScale.bandwidth())
    .attr('height', 0)
    .attr('fill', '#3b82f6')
    .attr('stroke', '#2563eb')
    .attr('stroke-width', 1)
    .style('cursor', 'pointer')
    .on('mouseover', function(event, d) {
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
      tooltip.html(`Rounds: ${d.rounds}<br/>Frequency: ${d.count}`)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px')
    })
    .on('mouseout', function() {
      d3.select(this).attr('fill', '#3b82f6')
      d3.selectAll('.tooltip').remove()
    })
    .transition()
    .duration(800)
    .delay((d, i) => i * 50)
    .attr('y', d => yScale(d.count))
    .attr('height', d => chartHeight - yScale(d.count))

  // X-axis
  g.append('g')
    .attr('transform', `translate(0,${chartHeight})`)
    .call(d3.axisBottom(xScale))
    .append('text')
    .attr('x', chartWidth / 2)
    .attr('y', 35)
    .attr('fill', 'black')
    .style('text-anchor', 'middle')
    .style('font-size', '12px')
    .text('Rounds to Victory')

  // Y-axis
  g.append('g')
    .call(d3.axisLeft(yScale))
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', -30)
    .attr('x', -chartHeight / 2)
    .attr('fill', 'black')
    .style('text-anchor', 'middle')
    .style('font-size', '12px')
    .text('Frequency')

  // Title
  svg.append('text')
    .attr('x', props.width / 2)
    .attr('y', 16)
    .attr('text-anchor', 'middle')
    .style('font-size', '14px')
    .style('font-weight', 'bold')
    .style('fill', '#1f2937')
    .text(props.title)

  // Add grid lines
  g.append('g')
    .attr('class', 'grid')
    .attr('transform', `translate(0,${chartHeight})`)
    .call(d3.axisBottom(xScale)
      .tickSize(-chartHeight)
      .tickFormat(() => '')
    )
    .style('stroke-dasharray', '2,2')
    .style('opacity', 0.3)

  g.append('g')
    .attr('class', 'grid')
    .call(d3.axisLeft(yScale)
      .tickSize(-chartWidth)
      .tickFormat(() => '')
    )
    .style('stroke-dasharray', '2,2')
    .style('opacity', 0.3)
}

// Watch for data changes and recreate chart
watch(() => props.data, () => {
  nextTick(() => {
    createChart()
  })
}, { deep: true })

onMounted(() => {
  createChart()
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