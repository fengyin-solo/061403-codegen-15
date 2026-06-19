import { ref, computed, onMounted, onUnmounted } from 'vue'

export function useGame() {
  const temperature = ref(80)
  const heat = ref(50)
  const wood = ref(10)
  const food = ref(5)
  const hide = ref(0)
  const tools = ref(0)
  const water = ref(3)
  const snow = ref(0)
  const thirst = ref(100)
  const isDay = ref(true)
  const dayCount = ref(1)
  const isBlizzard = ref(false)
  const gameOver = ref(false)
  const gameOverReason = ref('')
  const actionLog = ref([])

  const DAY_DURATION = 30000
  const NIGHT_DURATION = 20000
  const HEAT_CONSUMPTION_RATE = 2
  const WATER_CONSUMPTION_RATE = 1
  const THIRST_CONSUMPTION_RATE = 3
  const BLIZZARD_CHANCE = 0.15

  let dayNightTimer = null
  let nightConsumptionTimer = null
  let autoSaveTimer = null

  const isNight = computed(() => !isDay.value)
  const isDanger = computed(() => temperature.value < 30 || thirst.value < 30)
  const isThirsty = computed(() => thirst.value < 50)
  const isDehydrated = computed(() => thirst.value < 20)
  const thirstEfficiencyPenalty = computed(() => {
    if (thirst.value < 20) return 2.0
    if (thirst.value < 40) return 1.5
    if (thirst.value < 60) return 1.2
    return 1.0
  })
  const recoveryEfficiency = computed(() => {
    if (thirst.value < 20) return 0.3
    if (thirst.value < 40) return 0.5
    if (thirst.value < 60) return 0.7
    return 1.0
  })
  const canMakeFire = computed(() => wood.value >= 3)
  const canHunt = computed(() => tools.value > 0)
  const canMeltSnow = computed(() => snow.value >= 2 && heat.value >= 10)
  const canBoilWater = computed(() => snow.value >= 1 && heat.value >= 20 && wood.value >= 1)
  const canDrink = computed(() => water.value >= 1)
  const huntSuccessRate = computed(() => 0.3 + tools.value * 0.15)

  function addLog(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString()
    actionLog.value.unshift({ message, type, timestamp })
    if (actionLog.value.length > 20) {
      actionLog.value.pop()
    }
  }

  function checkGameOver() {
    if (temperature.value <= 20 && !gameOver.value) {
      gameOver.value = true
      gameOverReason.value = '体温过低，你在严寒中失去了意识...'
      stopTimers()
      addLog('游戏结束：体温过低！', 'danger')
      saveGame('auto')
    }
    if (thirst.value <= 0 && !gameOver.value) {
      gameOver.value = true
      gameOverReason.value = '严重脱水，你在口渴中倒下了...'
      stopTimers()
      addLog('游戏结束：脱水而亡！', 'danger')
      saveGame('auto')
    }
    if (temperature.value >= 100) {
      temperature.value = 100
    }
    if (thirst.value >= 100) {
      thirst.value = 100
    }
  }

  function consumeHeat() {
    if (gameOver.value) return
    
    const multiplier = isBlizzard.value ? 2 : 1
    const heatConsumption = HEAT_CONSUMPTION_RATE * multiplier
    const thirstConsumption = THIRST_CONSUMPTION_RATE * multiplier * thirstEfficiencyPenalty.value
    
    thirst.value = Math.max(0, thirst.value - thirstConsumption)
    
    if (thirst.value < 30 && thirst.value > 0) {
      addLog('你感到非常口渴，行动效率下降了...', 'warning')
    }
    
    if (heat.value >= heatConsumption) {
      heat.value -= heatConsumption
      if (temperature.value < 80) {
        const tempRecovery = Math.floor(1 * recoveryEfficiency.value)
        temperature.value = Math.min(80, temperature.value + tempRecovery)
      }
    } else {
      heat.value = 0
      const tempLoss = heatConsumption * thirstEfficiencyPenalty.value
      temperature.value = Math.max(0, temperature.value - tempLoss)
      addLog('热量不足！体温正在下降...', 'warning')
    }
    
    checkGameOver()
  }

  function startNightCycle() {
    addLog(`夜幕降临，第 ${dayCount.value} 天结束`, 'info')
    nightConsumptionTimer = setInterval(() => {
      consumeHeat()
    }, 1000)
    
    if (Math.random() < BLIZZARD_CHANCE) {
      triggerBlizzard()
    }
  }

  function startDayCycle() {
    dayCount.value++
    addLog(`天亮了，第 ${dayCount.value} 天开始`, 'success')
    isBlizzard.value = false
    if (nightConsumptionTimer) {
      clearInterval(nightConsumptionTimer)
      nightConsumptionTimer = null
    }
  }

  function toggleDayNight() {
    isDay.value = !isDay.value
    if (isDay.value) {
      startDayCycle()
    } else {
      startNightCycle()
    }
  }

  function triggerBlizzard() {
    isBlizzard.value = true
    addLog('⚠️ 暴风雪来袭！所有消耗加倍！', 'danger')
  }

  function chopWood() {
    if (gameOver.value || isNight.value) return
    
    const multiplier = isBlizzard.value ? 2 : 1
    const tempCost = Math.floor(5 * multiplier * thirstEfficiencyPenalty.value)
    const thirstCost = 5 * multiplier
    
    temperature.value = Math.max(0, temperature.value - tempCost)
    thirst.value = Math.max(0, thirst.value - thirstCost)
    const woodGained = Math.floor(Math.random() * 3) + 2
    wood.value += woodGained
    
    addLog(`砍柴：获得 ${woodGained} 木头，消耗 ${tempCost} 体温，消耗 ${thirstCost} 口渴度`, 'action')
    
    if (Math.random() < BLIZZARD_CHANCE * 0.5) {
      triggerBlizzard()
    }
    
    checkGameOver()
  }

  function hunt() {
    if (gameOver.value || isNight.value) return
    
    const multiplier = isBlizzard.value ? 2 : 1
    const tempCost = Math.floor(8 * multiplier * thirstEfficiencyPenalty.value)
    const thirstCost = 8 * multiplier
    
    temperature.value = Math.max(0, temperature.value - tempCost)
    thirst.value = Math.max(0, thirst.value - thirstCost)
    
    if (Math.random() < huntSuccessRate.value) {
      const foodGained = Math.floor(Math.random() * 3) + 2
      const hideGained = Math.floor(Math.random() * 2) + 1
      food.value += foodGained
      hide.value += hideGained
      addLog(`狩猎成功：获得 ${foodGained} 食物，${hideGained} 兽皮，消耗 ${tempCost} 体温，消耗 ${thirstCost} 口渴度`, 'success')
    } else {
      addLog(`狩猎失败：消耗 ${tempCost} 体温，消耗 ${thirstCost} 口渴度，空手而归`, 'warning')
    }
    
    if (Math.random() < BLIZZARD_CHANCE * 0.5) {
      triggerBlizzard()
    }
    
    checkGameOver()
  }

  function makeTools() {
    if (gameOver.value || isNight.value) return
    if (wood.value < 2 || hide.value < 1) {
      addLog('材料不足：需要 2 木头和 1 兽皮', 'warning')
      return
    }
    
    const multiplier = isBlizzard.value ? 2 : 1
    const tempCost = Math.floor(6 * multiplier * thirstEfficiencyPenalty.value)
    const thirstCost = 4 * multiplier
    
    wood.value -= 2
    hide.value -= 1
    tools.value += 1
    temperature.value = Math.max(0, temperature.value - tempCost)
    thirst.value = Math.max(0, thirst.value - thirstCost)
    
    addLog(`制作工具：获得 1 工具，消耗 ${tempCost} 体温，消耗 ${thirstCost} 口渴度`, 'success')
    checkGameOver()
  }

  function makeFire() {
    if (gameOver.value || !canMakeFire.value) {
      addLog('木头不足：生火需要 3 木头', 'warning')
      return
    }
    
    wood.value -= 3
    const heatGained = Math.floor(Math.random() * 20) + 25
    heat.value = Math.min(100, heat.value + heatGained)
    temperature.value = Math.min(100, temperature.value + 10)
    
    addLog(`生火：获得 ${heatGained} 热量，体温上升 10`, 'success')
  }

  function eatFood() {
    if (gameOver.value || food.value < 1) {
      addLog('没有食物了！', 'warning')
      return
    }
    
    food.value -= 1
    const tempGained = Math.floor((Math.random() * 10 + 5) * recoveryEfficiency.value)
    temperature.value = Math.min(100, temperature.value + tempGained)
    
    addLog(`进食：体温恢复 ${tempGained}`, 'success')
  }

  function collectSnow() {
    if (gameOver.value || isNight.value) return
    
    const multiplier = isBlizzard.value ? 2 : 1
    const tempCost = Math.floor(3 * multiplier * thirstEfficiencyPenalty.value)
    const thirstCost = 3 * multiplier
    
    temperature.value = Math.max(0, temperature.value - tempCost)
    thirst.value = Math.max(0, thirst.value - thirstCost)
    const snowGained = Math.floor(Math.random() * 3) + 2
    snow.value += snowGained
    
    addLog(`收集雪：获得 ${snowGained} 雪，消耗 ${tempCost} 体温，消耗 ${thirstCost} 口渴度`, 'action')
    
    if (Math.random() < BLIZZARD_CHANCE * 0.3) {
      triggerBlizzard()
    }
    
    checkGameOver()
  }

  function meltSnow() {
    if (gameOver.value || !canMeltSnow.value) {
      addLog('条件不足：需要 2 雪和 10 热量', 'warning')
      return
    }
    
    snow.value -= 2
    heat.value -= 10
    const waterGained = 1
    water.value += waterGained
    
    addLog(`融雪：获得 ${waterGained} 水，消耗 2 雪和 10 热量`, 'success')
  }

  function boilWater() {
    if (gameOver.value || !canBoilWater.value) {
      addLog('条件不足：需要 1 雪、20 热量和 1 木头', 'warning')
      return
    }
    
    snow.value -= 1
    heat.value -= 20
    wood.value -= 1
    const waterGained = 2
    water.value += waterGained
    
    addLog(`烧水煮雪：获得 ${waterGained} 净化水，消耗 1 雪、20 热量和 1 木头`, 'success')
  }

  function drinkWater() {
    if (gameOver.value || !canDrink.value) {
      addLog('没有水了！去收集雪来烧水吧', 'warning')
      return
    }
    
    water.value -= 1
    const thirstGained = Math.floor(Math.random() * 25) + 30
    thirst.value = Math.min(100, thirst.value + thirstGained)
    const tempGained = Math.floor(5 * recoveryEfficiency.value)
    temperature.value = Math.min(100, temperature.value + tempGained)
    
    addLog(`喝水：口渴度恢复 ${thirstGained}，体温恢复 ${tempGained}`, 'success')
  }

  function startTimers() {
    dayNightTimer = setInterval(() => {
      toggleDayNight()
    }, isDay.value ? DAY_DURATION : NIGHT_DURATION)
    
    autoSaveTimer = setInterval(() => {
      saveGame('auto')
    }, 10000)
  }

  function stopTimers() {
    if (dayNightTimer) {
      clearInterval(dayNightTimer)
      dayNightTimer = null
    }
    if (nightConsumptionTimer) {
      clearInterval(nightConsumptionTimer)
      nightConsumptionTimer = null
    }
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer)
      autoSaveTimer = null
    }
  }

  function saveGame(slot = 'manual') {
    const gameState = {
      temperature: temperature.value,
      heat: heat.value,
      wood: wood.value,
      food: food.value,
      hide: hide.value,
      tools: tools.value,
      water: water.value,
      snow: snow.value,
      thirst: thirst.value,
      isDay: isDay.value,
      dayCount: dayCount.value,
      isBlizzard: isBlizzard.value,
      gameOver: gameOver.value,
      gameOverReason: gameOverReason.value,
      savedAt: Date.now()
    }
    localStorage.setItem(`snowSurvival_${slot}`, JSON.stringify(gameState))
    addLog(`游戏已保存到存档位：${slot === 'auto' ? '自动存档' : slot}`, 'info')
  }

  function loadGame(slot = 'auto') {
    const saved = localStorage.getItem(`snowSurvival_${slot}`)
    if (!saved) {
      return false
    }
    
    try {
      const gameState = JSON.parse(saved)
      temperature.value = gameState.temperature
      heat.value = gameState.heat
      wood.value = gameState.wood
      food.value = gameState.food
      hide.value = gameState.hide
      tools.value = gameState.tools
      water.value = gameState.water ?? 3
      snow.value = gameState.snow ?? 0
      thirst.value = gameState.thirst ?? 100
      isDay.value = gameState.isDay
      dayCount.value = gameState.dayCount
      isBlizzard.value = gameState.isBlizzard
      gameOver.value = gameState.gameOver ?? false
      gameOverReason.value = gameState.gameOverReason ?? ''
      actionLog.value = []
      
      stopTimers()
      
      if (!gameOver.value) {
        startTimers()
        if (!isDay.value) {
          startNightCycle()
        }
        addLog(`成功加载存档：${slot === 'auto' ? '自动存档' : slot}`, 'success')
      } else {
        addLog(`加载存档：游戏已结束`, 'info')
      }
      
      return true
    } catch (e) {
      addLog('存档损坏，无法加载', 'danger')
      return false
    }
  }

  function getSaveSlots() {
    const slots = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key.startsWith('snowSurvival_')) {
        const slotName = key.replace('snowSurvival_', '')
        try {
          const data = JSON.parse(localStorage.getItem(key))
          slots.push({
            name: slotName,
            dayCount: data.dayCount,
            savedAt: data.savedAt
          })
        } catch (e) {}
      }
    }
    return slots
  }

  function deleteSave(slot) {
    localStorage.removeItem(`snowSurvival_${slot}`)
    addLog(`已删除存档：${slot}`, 'info')
  }

  function restartGame() {
    temperature.value = 80
    heat.value = 50
    wood.value = 10
    food.value = 5
    hide.value = 0
    tools.value = 0
    water.value = 3
    snow.value = 0
    thirst.value = 100
    isDay.value = true
    dayCount.value = 1
    isBlizzard.value = false
    gameOver.value = false
    gameOverReason.value = ''
    actionLog.value = []
    
    stopTimers()
    startTimers()
    
    addLog('新游戏开始！祝你好运！记得收集雪来获得饮用水。', 'success')
  }

  onMounted(() => {
    const autoLoaded = loadGame('auto')
    if (!autoLoaded) {
      startTimers()
      addLog('欢迎来到雪地生存！白天收集资源，夜晚保持温暖。记得收集雪来获得饮用水。', 'info')
    }
  })

  onUnmounted(() => {
    stopTimers()
  })

  return {
    temperature,
    heat,
    wood,
    food,
    hide,
    tools,
    water,
    snow,
    thirst,
    isDay,
    isNight,
    dayCount,
    isBlizzard,
    gameOver,
    gameOverReason,
    actionLog,
    isDanger,
    isThirsty,
    isDehydrated,
    recoveryEfficiency,
    thirstEfficiencyPenalty,
    canMakeFire,
    canHunt,
    canMeltSnow,
    canBoilWater,
    canDrink,
    huntSuccessRate,
    chopWood,
    hunt,
    makeTools,
    makeFire,
    eatFood,
    collectSnow,
    meltSnow,
    boilWater,
    drinkWater,
    saveGame,
    loadGame,
    getSaveSlots,
    deleteSave,
    restartGame
  }
}
