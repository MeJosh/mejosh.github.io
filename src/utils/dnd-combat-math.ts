/**
 * D&D Combat Mathematics Utilities
 * 
 * This module contains mathematical functions for calculating D&D combat statistics,
 * probability distributions, and related utility functions.
 */

// Types
export interface TTKPoint {
  attacks: number
  prob: number
}

export interface StatisticalResults {
  hitProbability: number
  hitsNeeded: number
  pmf: TTKPoint[]
  mean: number
  variance: number
  stdev: number
  normalApprox: TTKPoint[]
  roundsDistribution: number[]
}

export interface CombatResults extends StatisticalResults {
  median: number
  mode: number
  percentiles: {
    p25: number
    p75: number
    p90: number
    p95: number
  }
}

export interface DamageResult {
  // For dice notation like "1d8+3"
  numDice?: number
  diceSides?: number
  modifier?: number
  
  // For fixed damage like "8"
  fixedDamage?: number
  
  // Computed values for display
  average: number
  min: number
  max: number
  criticalAverage?: number
  criticalMin?: number
  criticalMax?: number
}

// Damage validation patterns
export const diceRegex = /^\s*(\d+)\s*[dD]\s*(\d+)\s*(?:([+-])\s*(\d+))?\s*$/
export const fixedRegex = /^\s*(\d+)\s*$/

/**
 * Validate damage input string
 */
export function isValidDamageInput(damage: string): boolean {
  if (typeof damage !== 'string') return false
  const cleaned = damage.trim()
  return diceRegex.test(cleaned) || fixedRegex.test(cleaned)
}

/**
 * Parse damage input string into DamageResult
 */
export function parseDamageInput(damageInput: string): DamageResult {
  const cleaned = damageInput.trim()

  // Try fixed damage first
  const fixedMatch = cleaned.match(fixedRegex)
  if (fixedMatch) {
    const damage = parseInt(fixedMatch[1])
    return {
      fixedDamage: damage,
      average: damage,
      min: damage,
      max: damage,
      criticalAverage: damage * 2,
      criticalMin: damage * 2,
      criticalMax: damage * 2
    }
  }

  // Try dice notation
  const diceMatch = cleaned.match(diceRegex)
  if (diceMatch) {
    const numDice = parseInt(diceMatch[1])
    const sides = parseInt(diceMatch[2])
    const operator = diceMatch[3] || '+'
    const modifier = diceMatch[4] ? parseInt(diceMatch[4]) : 0
    const actualModifier = operator === '-' ? -modifier : modifier

    const min = numDice + actualModifier
    const max = numDice * sides + actualModifier
    const average = numDice * (sides + 1) / 2 + actualModifier

    // Critical hits: double the dice, same modifier
    const criticalMin = (numDice * 2) + actualModifier
    const criticalMax = (numDice * 2 * sides) + actualModifier
    const criticalAverage = (numDice * 2 * (sides + 1) / 2) + actualModifier

    return {
      numDice,
      diceSides: sides,
      modifier: actualModifier,
      average,
      min: Math.max(0, min),
      max: Math.max(0, max),
      criticalAverage: Math.max(0, criticalAverage),
      criticalMin: Math.max(0, criticalMin),
      criticalMax: Math.max(0, criticalMax)
    }
  }

  // Fallback
  return {
    fixedDamage: 1,
    average: 1,
    min: 1,
    max: 1,
    criticalAverage: 2,
    criticalMin: 2,
    criticalMax: 2
  }
}

/**
 * Roll a single die with the specified number of sides
 */
function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1
}

/**
 * Roll damage dice and return the total
 */
function rollDamage(damage: DamageResult, isCritical: boolean = false): number {
  if (damage.fixedDamage !== undefined) {
    return isCritical ? damage.fixedDamage * 2 : damage.fixedDamage
  }

  if (damage.numDice && damage.diceSides) {
    const diceToRoll = isCritical ? damage.numDice * 2 : damage.numDice
    let total = 0
    for (let i = 0; i < diceToRoll; i++) {
      total += rollDie(damage.diceSides)
    }
    return total + (damage.modifier || 0)
  }

  return 1 // Fallback
}

/**
 * Compute d20 hit probability vs AC given a flat attack modifier.
 */
export function d20HitProb(attackModifier: number, armorClass: number, enforceNatRules = true): number {
  const raw = (21 + attackModifier - armorClass) / 20
  let p = Math.max(0, Math.min(1, raw))

  if (enforceNatRules) {
    // Natural 1 always misses, natural 20 always hits
    p = Math.max(1 / 20, Math.min(19 / 20, p))
  }

  return p
}

/**
 * Negative Binomial PMF: P(N = n) where N = #trials to get r successes with hit prob p.
 */
export function negBinomPMF(n: number, r: number, p: number): number {
  if (n < r) return 0
  return comb(n - 1, r - 1) * Math.pow(p, r) * Math.pow(1 - p, n - r)
}

/**
 * Numerically stable binomial coefficient
 */
export function comb(n: number, k: number): number {
  if (k < 0 || k > n) return 0
  k = Math.min(k, n - k)
  let num = 1
  let den = 1

  for (let i = 1; i <= k; i++) {
    num *= (n - (k - i))
    den *= i
    const g = gcd(num, den)
    num /= g
    den /= g
  }

  return num / den
}

function gcd(a: number, b: number): number {
  a = Math.abs(a)
  b = Math.abs(b)
  while (b) {
    const t = b
    b = a % b
    a = t
  }
  return a || 1
}

/**
 * Standard normal PDF
 */
export function normalPdf(z: number): number {
  return Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI)
}

/**
 * Monte Carlo simulation for time-to-kill with accurate dice rolling
 */
export function timeToKillWithCriticals(
  attackModifier: number,
  armorClass: number,
  damage: DamageResult,
  health: number,
  useCriticalMechanics: boolean
): CombatResults {
  if (health <= 0) throw new Error('health must be > 0')

  const numSimulations = 100000
  const maxAttacks = 200
  const attackCounts: number[] = new Array(maxAttacks + 1).fill(0)

  for (let sim = 0; sim < numSimulations; sim++) {
    let remainingHealth = health
    let attacks = 0

    while (remainingHealth > 0 && attacks < maxAttacks) {
      attacks++
      
      // Roll d20 attack
      const d20Roll = Math.floor(Math.random() * 20) + 1
      const attackTotal = d20Roll + attackModifier
      
      let hits = false
      let isCritical = false
      
      if (useCriticalMechanics) {
        if (d20Roll === 1) {
          hits = false // Natural 1 always misses
        } else if (d20Roll === 20) {
          hits = true // Natural 20 always hits
          isCritical = true
        } else {
          hits = attackTotal >= armorClass
        }
      } else {
        hits = attackTotal >= armorClass
      }

      if (hits) {
        const damageDealt = rollDamage(damage, isCritical)
        remainingHealth -= damageDealt
      }
    }

    if (attacks < maxAttacks) {
      attackCounts[attacks]++
    }
  }

  // Convert counts to probabilities
  const pmf: TTKPoint[] = []
  let totalCount = 0
  for (let i = 1; i <= maxAttacks; i++) {
    if (attackCounts[i] > 0) {
      totalCount += attackCounts[i]
    }
  }

  let mean = 0
  let variance = 0
  for (let i = 1; i <= maxAttacks; i++) {
    if (attackCounts[i] > 0) {
      const prob = attackCounts[i] / totalCount
      pmf.push({ attacks: i, prob })
      mean += i * prob
      variance += i * i * prob
    }
  }
  variance -= mean * mean

  const stdev = Math.sqrt(variance)

  // Calculate hit probability
  const hitProbability = d20HitProb(attackModifier, armorClass, useCriticalMechanics)
  
  // Estimate effective hits needed
  const avgDamagePerHit = damage.average + (useCriticalMechanics ? 0.05 * (damage.criticalAverage! - damage.average) : 0)
  const effectiveHitsNeeded = health / avgDamagePerHit

  // Calculate additional statistics
  // Find mode (most probable number of attacks)
  let mode = 1
  let maxProb = 0
  for (const point of pmf) {
    if (point.prob > maxProb) {
      maxProb = point.prob
      mode = point.attacks
    }
  }

  // Calculate median and percentiles
  let cumulativeProb = 0
  let median = 1
  let p25 = 1
  let p75 = 1
  let p90 = 1
  let p95 = 1

  for (const point of pmf) {
    cumulativeProb += point.prob
    
    if (median === 1 && cumulativeProb >= 0.5) {
      median = point.attacks
    }
    if (p25 === 1 && cumulativeProb >= 0.25) {
      p25 = point.attacks
    }
    if (p75 === 1 && cumulativeProb >= 0.75) {
      p75 = point.attacks
    }
    if (p90 === 1 && cumulativeProb >= 0.90) {
      p90 = point.attacks
    }
    if (p95 === 1 && cumulativeProb >= 0.95) {
      p95 = point.attacks
    }
  }

  return {
    hitProbability,
    hitsNeeded: effectiveHitsNeeded,
    pmf,
    mean,
    variance,
    stdev,
    normalApprox: [], // Skip normal approximation for Monte Carlo
    roundsDistribution: [],
    median,
    mode,
    percentiles: {
      p25,
      p75,
      p90,
      p95
    }
  }
}

/**
 * Standard TTK distribution calculation using Negative Binomial Distribution.
 */
export function timeToKillDistribution(
  attackModifier: number,
  armorClass: number,
  damage: number,
  health: number,
  useCriticalMechanics: boolean
): StatisticalResults {
  if (damage <= 0) throw new Error('damage must be > 0')
  if (health <= 0) throw new Error('health must be > 0')

  const maxTailProb = 1e-6
  const approxWidth = 4

  // 1) Hit probability from d20 check
  const hitProbability = d20HitProb(attackModifier, armorClass, useCriticalMechanics)

  if (hitProbability === 0) {
    return {
      hitProbability,
      hitsNeeded: Infinity,
      pmf: [],
      mean: Infinity,
      variance: Infinity,
      stdev: Infinity,
      normalApprox: [],
      roundsDistribution: []
    }
  }

  const hitsNeeded = Math.ceil(health / damage)

  // 2) Exact PMF calculation
  const pmf: TTKPoint[] = []
  let n = hitsNeeded
  let tail = 1

  while (tail > maxTailProb && n - hitsNeeded < 1000) {
    const prob = negBinomPMF(n, hitsNeeded, hitProbability)
    pmf.push({ attacks: n, prob })
    tail -= prob
    n++
  }

  // 3) Moments and normal approximation
  const mean = hitsNeeded / hitProbability
  const variance = (hitsNeeded * (1 - hitProbability)) / (hitProbability * hitProbability)
  const stdev = Math.sqrt(variance)

  // Sample the normal at integers within mean ± approxWidth*stdev
  const nMin = Math.max(hitsNeeded, Math.floor(mean - approxWidth * stdev))
  const nMax = Math.max(nMin, Math.ceil(mean + approxWidth * stdev))
  const normalApprox: TTKPoint[] = []

  for (let k = nMin; k <= nMax; k++) {
    const z = (k - mean) / stdev
    const pdf = normalPdf(z) / stdev
    normalApprox.push({ attacks: k, prob: pdf })
  }

  // Normalize the approximation
  const approxSum = normalApprox.reduce((s, x) => s + x.prob, 0)
  if (approxSum > 0) {
    const exactWindowSum = pmf
      .filter(x => x.attacks >= nMin && x.attacks <= nMax)
      .reduce((s, x) => s + x.prob, 0)
    const target = exactWindowSum > 0 ? exactWindowSum : 1
    for (const pt of normalApprox) pt.prob *= target / approxSum
  }

  // Convert to rounds distribution for visualization
  const roundsDistribution = pmf.map(point => point.prob * 100) // Convert to percentage

  return {
    hitProbability,
    hitsNeeded,
    pmf,
    mean,
    variance,
    stdev,
    normalApprox,
    roundsDistribution
  }
}