<template>
  <div class="max-w-4xl mx-auto space-y-8">
    <!-- Introduction -->
    <div class="prose prose-invert max-w-none">
      <p class="text-neutral-300 text-lg leading-relaxed">
        In D&D combat, understanding the statistical distribution of outcomes helps optimize character builds and strategy.
        This tool uses Monte Carlo simulation to model actual dice rolling, providing accurate probability distributions that account for the full complexity of D&D combat mechanics.
      </p>
    </div>

    <!-- Visualization First -->
    <div class="bg-neutral-800/50 p-6 rounded-lg border border-neutral-700">
      <h3 class="text-lg font-semibold text-white mb-4">Attack Distribution Visualization</h3>
      <p class="text-neutral-300 mb-6">
        This chart shows the probability distribution of combat length using Monte Carlo simulation with 100,000 trials.
        Each simulation actually rolls dice and follows D&D rules precisely, providing highly accurate results.
      </p>
      <div class="bg-neutral-900 p-4 rounded-lg">
        <DnDCombatChart
          v-if="results && results.pmf && results.pmf.length > 0"
          :data="results.pmf.map(p => p.prob * 100)"
          :width="700"
          :height="350"
          title="Probability of Combat Length (% chance)"
        />
        <div v-else class="h-80 flex items-center justify-center text-neutral-500">
          <p>Chart will appear here once valid parameters are entered</p>
        </div>
      </div>
    </div>

    <!-- Character Configuration -->
    <div class="space-y-6">
      <h2 class="text-2xl font-semibold text-white">Configure Your Character</h2>

      <div class="prose prose-invert max-w-none">
        <p class="text-neutral-300">
          Adjust the parameters below to see how combat statistics change in real-time.
        </p>
      </div>

      <div class="grid grid-cols-4 gap-6">
        <!-- Attack Bonus -->
        <div class="space-y-2">
          <div class="text-center">
            <input
              v-model.number="characterStats.attackBonus"
              type="number"
              class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              max="50"
            />
          </div>
          <label class="block text-sm font-medium text-neutral-200 text-center">
            Attack Bonus (+)
          </label>
          <p class="text-xs text-neutral-400 text-center">Your total attack bonus</p>
        </div>

        <!-- Damage -->
        <div class="space-y-2">
          <div class="text-center">
            <input
              v-model="damageInput"
              type="text"
              class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              :class="{ 'border-red-500': showDamageError }"
              placeholder="e.g., 1d8+3"
              @blur="handleDamageBlur"
              @focus="handleDamageFocus"
            />
          </div>
          <label class="block text-sm font-medium text-neutral-200 text-center">
            Damage
          </label>
          <p v-if="showDamageError" class="text-xs text-red-400 text-center">
            Invalid format. Use: 8, 1d8+3, 2D6+2
          </p>
          <p v-else class="text-xs text-neutral-400 text-center">
            Dice notation or flat number
          </p>
        </div>

        <!-- Enemy AC -->
        <div class="space-y-2">
          <div class="text-center">
            <input
              v-model.number="characterStats.enemyAC"
              type="number"
              class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              max="30"
            />
          </div>
          <label class="block text-sm font-medium text-neutral-200 text-center">
            Enemy AC
          </label>
          <p class="text-xs text-neutral-400 text-center">Enemy's armor class</p>
        </div>

        <!-- Enemy HP -->
        <div class="space-y-2">
          <div class="text-center">
            <input
              v-model.number="characterStats.enemyHP"
              type="number"
              class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              max="1000"
            />
          </div>
          <label class="block text-sm font-medium text-neutral-200 text-center">
            Enemy HP
          </label>
          <p class="text-xs text-neutral-400 text-center">Enemy's hit points</p>
        </div>
      </div>

      <!-- Critical Hit Toggle -->
      <div class="flex items-center space-x-3">
        <input
          v-model="characterStats.useCriticalMechanics"
          type="checkbox"
          id="criticalMechanics"
          class="w-4 h-4 text-blue-600 bg-neutral-700 border-neutral-600 rounded focus:ring-blue-500 focus:ring-2"
        />
        <label for="criticalMechanics" class="text-sm font-medium text-neutral-200">
          Include Critical Hit Mechanics (20 = double damage dice)
        </label>
      </div>
    </div>

    <!-- Results -->
    <div class="space-y-6">
      <h2 class="text-2xl font-semibold text-white">Combat Statistics</h2>

      <div v-if="results && isDamageValid && !shouldShowDamageError" class="space-y-6">
        <!-- Key Statistics -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-neutral-800/50 p-4 rounded-lg border border-neutral-700 text-center">
            <div class="text-2xl font-bold text-white">{{ results.mean.toFixed(1) }}</div>
            <div class="text-sm text-neutral-400">Average Attacks</div>
          </div>
          <div class="bg-neutral-800/50 p-4 rounded-lg border border-neutral-700 text-center">
            <div class="text-2xl font-bold text-white">{{ results.median }}</div>
            <div class="text-sm text-neutral-400">Median Attacks</div>
          </div>
          <div class="bg-neutral-800/50 p-4 rounded-lg border border-neutral-700 text-center">
            <div class="text-2xl font-bold text-white">{{ (results.pmf.find(p => p.attacks === results.mode)?.prob * 100 || 0).toFixed(1) }}%</div>
            <div class="text-sm text-neutral-400">Most Likely ({{ results.mode }} attacks)</div>
          </div>
        </div>

        <!-- Distribution Analysis -->
        <div class="bg-neutral-800/50 p-6 rounded-lg border border-neutral-700">
          <h3 class="text-lg font-semibold text-white mb-3">Statistical Distribution</h3>
          <p class="text-neutral-300 mb-4" v-if="!characterStats.useCriticalMechanics">
            Using Monte Carlo simulation to model combat outcomes with precise dice rolling and D&D mechanics. Results are based on 100,000 simulated combats.
          </p>
          <p class="text-neutral-300 mb-4" v-else>
            Using Monte Carlo simulation with full critical hit mechanics. Each trial simulates actual d20 rolls, critical hits with doubled dice,
            and all the complexity of real D&D combat. Results based on 100,000 simulated combats.
          </p>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div class="text-center">
              <div class="text-lg font-semibold text-white">{{ (results.percentiles.p25).toFixed(1) }}</div>
              <div class="text-xs text-neutral-400">25th Percentile</div>
            </div>
            <div class="text-center">
              <div class="text-lg font-semibold text-white">{{ (results.percentiles.p75).toFixed(1) }}</div>
              <div class="text-xs text-neutral-400">75th Percentile</div>
            </div>
            <div class="text-center">
              <div class="text-lg font-semibold text-white">{{ (results.percentiles.p90).toFixed(1) }}</div>
              <div class="text-xs text-neutral-400">90th Percentile</div>
            </div>
            <div class="text-center">
              <div class="text-lg font-semibold text-white">{{ (results.percentiles.p95).toFixed(1) }}</div>
              <div class="text-xs text-neutral-400">95th Percentile</div>
            </div>
          </div>
        </div>

        <!-- Scenario Analysis -->
        <div class="bg-neutral-800/50 p-6 rounded-lg border border-neutral-700">
          <h3 class="text-lg font-semibold text-white mb-3">Combat Scenarios</h3>
          <p class="text-neutral-300 mb-4">
            Probability of finishing combat within specific attack counts:
          </p>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="text-center p-3 bg-neutral-700/50 rounded">
              <div class="text-lg font-semibold text-green-400">{{ ((results.pmf.filter(p => p.attacks === 1).reduce((sum, p) => sum + p.prob, 0)) * 100).toFixed(1) }}%</div>
              <div class="text-xs text-neutral-400">One-shot kill</div>
            </div>
            <div class="text-center p-3 bg-neutral-700/50 rounded">
              <div class="text-lg font-semibold text-blue-400">{{ ((results.pmf.filter(p => p.attacks <= 3).reduce((sum, p) => sum + p.prob, 0)) * 100).toFixed(1) }}%</div>
              <div class="text-xs text-neutral-400">≤ 3 attacks</div>
            </div>
            <div class="text-center p-3 bg-neutral-700/50 rounded">
              <div class="text-lg font-semibold text-yellow-400">{{ ((results.pmf.filter(p => p.attacks <= 5).reduce((sum, p) => sum + p.prob, 0)) * 100).toFixed(1) }}%</div>
              <div class="text-xs text-neutral-400">≤ 5 attacks</div>
            </div>
            <div class="text-center p-3 bg-neutral-700/50 rounded">
              <div class="text-lg font-semibold text-red-400">{{ ((results.pmf.filter(p => p.attacks >= 10).reduce((sum, p) => sum + p.prob, 0)) * 100).toFixed(1) }}%</div>
              <div class="text-xs text-neutral-400">≥ 10 attacks</div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="shouldShowDamageError" class="text-center py-12">
        <div class="text-neutral-400">
          <p>Please enter valid damage format to see statistical analysis.</p>
          <p class="text-sm mt-2">Examples: <code class="bg-neutral-700 px-1 rounded">8</code>, <code class="bg-neutral-700 px-1 rounded">1d8+3</code>, <code class="bg-neutral-700 px-1 rounded">2D6+2</code></p>
        </div>
      </div>

      <div v-else class="text-center py-12">
        <div class="text-neutral-400">
          <p>Statistical analysis will appear here once valid parameters are entered.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import DnDCombatChart from './DnDCombatChart.vue'
import { timeToKillWithCriticals, parseDamageInput, type CharacterStats, type CombatResults } from '../../../utils/dnd-combat-math'

// Reactive state
const characterStats = ref<CharacterStats>({
  attackBonus: 5,
  enemyAC: 15,
  enemyHP: 25,
  useCriticalMechanics: true
})

const damageInput = ref('1d8+3')
const lastValidDamageInput = ref('1d8+3')
const results = ref<CombatResults | null>(null)
const showDamageError = ref(false)

// Computed properties
const isDamageValid = computed(() => {
  return parseDamageInput(damageInput.value) !== null
})

const shouldShowDamageError = computed(() => {
  return showDamageError.value && !isDamageValid.value
})

// Methods
function handleDamageBlur() {
  if (!isDamageValid.value) {
    showDamageError.value = true
  }
}

function handleDamageFocus() {
  showDamageError.value = false
}

function saveToStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const state = {
        characterStats: characterStats.value,
        damageInput: damageInput.value
      }
      localStorage.setItem('dnd-combat-simulator', JSON.stringify(state))
    } catch (error) {
      console.warn('Failed to save to localStorage:', error)
    }
  }
}

function loadFromStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = localStorage.getItem('dnd-combat-simulator')
      if (saved) {
        const state = JSON.parse(saved)
        if (state.characterStats) {
          characterStats.value = { ...characterStats.value, ...state.characterStats }
        }
        if (state.damageInput) {
          damageInput.value = state.damageInput
          lastValidDamageInput.value = state.damageInput
        }
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error)
    }
  }
}

function calculateDistribution() {
  try {
    const damageResult = parseDamageInput(lastValidDamageInput.value)
    if (!damageResult) {
      results.value = null
      return
    }

    results.value = timeToKillWithCriticals(
      characterStats.value.attackBonus,
      characterStats.value.enemyAC,
      damageResult,
      characterStats.value.enemyHP,
      characterStats.value.useCriticalMechanics
    )
  } catch (error) {
    console.error('Error calculating distribution:', error)
    results.value = null
  }
}

// Watch for changes and recalculate
watch([characterStats, lastValidDamageInput], calculateDistribution, { deep: true })

// Watch for valid damage input changes and update lastValidDamageInput
watch(damageInput, (newValue) => {
  if (isDamageValid.value) {
    lastValidDamageInput.value = newValue
    showDamageError.value = false
  }
}, { immediate: false })

// Watch for changes and save to localStorage (with debouncing)
let saveTimeout: NodeJS.Timeout | null = null
watch([characterStats, damageInput], () => {
  // Debounce saves to avoid excessive localStorage writes
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
  saveTimeout = setTimeout(() => {
    saveToStorage()
  }, 300)
}, { deep: true })

// Initialize component
onMounted(() => {
  loadFromStorage()
  calculateDistribution()
})
</script>