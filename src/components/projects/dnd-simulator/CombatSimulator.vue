<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
    <!-- Controls Section -->
    <div class="bg-gray-50 p-6 rounded-lg border border-gray-200">
      <h2 class="text-xl font-bold text-gray-800 mb-4 border-b-2 border-blue-500 pb-2">Combat Configuration</h2>
      
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-gray-700 mb-4">Character Stats</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex flex-col">
            <label for="armor-class" class="font-semibold mb-2 text-gray-600">Armor Class:</label>
            <input 
              id="armor-class" 
              v-model.number="characterStats.armorClass" 
              type="number" 
              min="1" 
              max="25"
              class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div class="flex flex-col">
            <label for="hit-points" class="font-semibold mb-2 text-gray-600">Hit Points:</label>
            <input 
              id="hit-points" 
              v-model.number="characterStats.hitPoints" 
              type="number" 
              min="1" 
              max="500"
              class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div class="flex flex-col">
            <label for="attack-bonus" class="font-semibold mb-2 text-gray-600">Attack Bonus:</label>
            <input 
              id="attack-bonus" 
              v-model.number="characterStats.attackBonus" 
              type="number" 
              min="0" 
              max="20"
              class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div class="flex flex-col">
            <label for="damage-dice" class="font-semibold mb-2 text-gray-600">Damage (e.g., 1d8+3):</label>
            <input 
              id="damage-dice" 
              v-model="characterStats.damage" 
              type="text" 
              placeholder="1d8+3"
              class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 class="text-lg font-semibold text-gray-700 mb-4">Simulation Parameters</h3>
        <div class="flex flex-col mb-4">
          <label for="iterations" class="font-semibold mb-2 text-gray-600">Number of Simulations:</label>
          <input 
            id="iterations" 
            v-model.number="simulationParams.iterations" 
            type="number" 
            min="100" 
            max="10000"
            class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <button 
          @click="runSimulation" 
          :disabled="isRunning" 
          class="w-full bg-blue-500 text-white border-none px-6 py-3 rounded-md text-base font-semibold cursor-pointer transition-colors duration-300 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {{ isRunning ? 'Running...' : 'Run Combat Simulation' }}
        </button>
      </div>
    </div>

    <!-- Results Section -->
    <div v-if="results" class="bg-gray-100 p-6 rounded-lg border border-gray-300">
      <h2 class="text-xl font-bold text-gray-800 mb-4 border-b-2 border-blue-500 pb-2">Simulation Results</h2>
      
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div class="bg-white p-5 rounded-lg text-center shadow-sm">
          <h4 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Average Rounds to Victory</h4>
          <span class="block text-2xl font-bold text-gray-800">{{ results.averageRounds.toFixed(2) }}</span>
        </div>
        
        <div class="bg-white p-5 rounded-lg text-center shadow-sm">
          <h4 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Hit Rate</h4>
          <span class="block text-2xl font-bold text-gray-800">{{ (results.hitRate * 100).toFixed(1) }}%</span>
        </div>
        
        <div class="bg-white p-5 rounded-lg text-center shadow-sm">
          <h4 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Average Damage per Round</h4>
          <span class="block text-2xl font-bold text-gray-800">{{ results.averageDamage.toFixed(2) }}</span>
        </div>
        
        <div class="bg-white p-5 rounded-lg text-center shadow-sm">
          <h4 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Total Simulations</h4>
          <span class="block text-2xl font-bold text-gray-800">{{ results.totalSimulations }}</span>
        </div>
      </div>
      
      <!-- D3 visualization -->
      <div class="bg-white p-5 rounded-lg shadow-sm">
        <h3 class="text-lg font-semibold text-gray-700 mb-4">Combat Round Distribution</h3>
        <D3Chart 
          v-if="results && results.roundsDistribution.length > 0"
          :data="results.roundsDistribution"
          :width="600"
          :height="300"
          title="Combat Rounds Distribution"
        />
        <div v-else class="h-48 bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-500 italic rounded">
          Chart visualization will appear here after running a simulation
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import D3Chart from './D3Chart.vue'

interface CharacterStats {
  armorClass: number
  hitPoints: number
  attackBonus: number
  damage: string
}

interface SimulationParams {
  iterations: number
}

interface SimulationResults {
  averageRounds: number
  hitRate: number
  averageDamage: number
  totalSimulations: number
  roundsDistribution: number[]
}

// Reactive state
const characterStats = reactive<CharacterStats>({
  armorClass: 15,
  hitPoints: 20,
  attackBonus: 5,
  damage: '1d8+3'
})

const simulationParams = reactive<SimulationParams>({
  iterations: 1000
})

const results = ref<SimulationResults | null>(null)
const isRunning = ref(false)

// Dice rolling utility
function rollDice(diceString: string): number {
  const match = diceString.match(/(\d+)d(\d+)(?:\+(\d+))?/)
  if (!match) return 0
  
  const numDice = parseInt(match[1])
  const sides = parseInt(match[2])
  const modifier = parseInt(match[3] || '0')
  
  let total = modifier
  for (let i = 0; i < numDice; i++) {
    total += Math.floor(Math.random() * sides) + 1
  }
  return total
}

// D20 attack roll
function rollAttack(): number {
  return Math.floor(Math.random() * 20) + 1
}

// Single combat simulation
function simulateSingleCombat(): { rounds: number; hits: number; totalDamage: number } {
  let enemyHP = characterStats.hitPoints
  let rounds = 0
  let hits = 0
  let totalDamage = 0

  while (enemyHP > 0) {
    rounds++
    const attackRoll = rollAttack() + characterStats.attackBonus
    
    if (attackRoll >= characterStats.armorClass) {
      hits++
      const damage = rollDice(characterStats.damage)
      totalDamage += damage
      enemyHP -= damage
    }
  }

  return { rounds, hits, totalDamage }
}

// Main simulation function
async function runSimulation() {
  isRunning.value = true
  
  try {
    const simResults: { rounds: number; hits: number; totalDamage: number }[] = []
    
    // Run simulations
    for (let i = 0; i < simulationParams.iterations; i++) {
      simResults.push(simulateSingleCombat())
      
      // Allow UI to update every 100 iterations
      if (i % 100 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1))
      }
    }

    // Calculate statistics
    const totalRounds = simResults.reduce((sum, result) => sum + result.rounds, 0)
    const totalHits = simResults.reduce((sum, result) => sum + result.hits, 0)
    const totalDamage = simResults.reduce((sum, result) => sum + result.totalDamage, 0)
    const totalAttacks = simResults.reduce((sum, result) => sum + result.rounds, 0)

    // Create rounds distribution for visualization
    const roundsDistribution = new Array(Math.max(...simResults.map(r => r.rounds)) + 1).fill(0)
    simResults.forEach(result => {
      roundsDistribution[result.rounds]++
    })

    results.value = {
      averageRounds: totalRounds / simulationParams.iterations,
      hitRate: totalHits / totalAttacks,
      averageDamage: totalDamage / totalRounds,
      totalSimulations: simulationParams.iterations,
      roundsDistribution
    }
  } finally {
    isRunning.value = false
  }
}
</script>