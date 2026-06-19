<template>
  <div class="resource-panel">
    <h3 class="panel-title">资源</h3>
    <div class="resources-grid">
      <div class="resource-item">
        <span class="resource-icon">🔥</span>
        <div class="resource-info">
          <span class="resource-name">热量</span>
          <div class="resource-bar-container">
            <div class="resource-bar" :style="{ width: heat + '%', background: getHeatColor() }"></div>
          </div>
          <span class="resource-value">{{ Math.round(heat) }}/100</span>
        </div>
      </div>
      <div class="resource-item">
        <span class="resource-icon">💧</span>
        <div class="resource-info">
          <span class="resource-name">口渴度</span>
          <div class="resource-bar-container">
            <div class="resource-bar" :style="{ width: thirst + '%', background: getThirstColor() }"></div>
          </div>
          <span class="resource-value">{{ Math.round(thirst) }}/100</span>
        </div>
      </div>
      <div class="resource-item">
        <span class="resource-icon">🪵</span>
        <div class="resource-info">
          <span class="resource-name">木头</span>
          <span class="resource-value-large">{{ wood }}</span>
        </div>
      </div>
      <div class="resource-item">
        <span class="resource-icon">🍖</span>
        <div class="resource-info">
          <span class="resource-name">食物</span>
          <span class="resource-value-large">{{ food }}</span>
        </div>
      </div>
      <div class="resource-item">
        <span class="resource-icon">🥤</span>
        <div class="resource-info">
          <span class="resource-name">净水</span>
          <span class="resource-value-large">{{ water }}</span>
        </div>
      </div>
      <div class="resource-item">
        <span class="resource-icon">❄️</span>
        <div class="resource-info">
          <span class="resource-name">雪</span>
          <span class="resource-value-large">{{ snow }}</span>
        </div>
      </div>
      <div class="resource-item">
        <span class="resource-icon">🦊</span>
        <div class="resource-info">
          <span class="resource-name">兽皮</span>
          <span class="resource-value-large">{{ hide }}</span>
        </div>
      </div>
      <div class="resource-item">
        <span class="resource-icon">🔪</span>
        <div class="resource-info">
          <span class="resource-name">工具</span>
          <span class="resource-value-large">{{ tools }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  heat: { type: Number, default: 0 },
  wood: { type: Number, default: 0 },
  food: { type: Number, default: 0 },
  hide: { type: Number, default: 0 },
  tools: { type: Number, default: 0 },
  water: { type: Number, default: 0 },
  snow: { type: Number, default: 0 },
  thirst: { type: Number, default: 100 }
})

function getHeatColor() {
  if (props.heat > 60) return 'linear-gradient(to right, #ff6600, #ffcc00)'
  if (props.heat > 30) return 'linear-gradient(to right, #ff9933, #ffcc00)'
  return 'linear-gradient(to right, #cc3300, #ff6600)'
}

function getThirstColor() {
  if (props.thirst > 60) return 'linear-gradient(to right, #00b4d8, #0077b6)'
  if (props.thirst > 30) return 'linear-gradient(to right, #0077b6, #023e8a)'
  return 'linear-gradient(to right, #c1121f, #660708)'
}
</script>

<style scoped>
.resource-panel {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 20px;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.panel-title {
  color: white;
  font-size: 18px;
  margin-bottom: 15px;
  text-align: center;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.resources-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  transition: transform 0.2s;
}

.resource-item:hover {
  transform: translateX(5px);
  background: rgba(0, 0, 0, 0.3);
}

.resource-icon {
  font-size: 28px;
  width: 40px;
  text-align: center;
}

.resource-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.resource-name {
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
}

.resource-bar-container {
  height: 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  overflow: hidden;
}

.resource-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.resource-value {
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.resource-value-large {
  color: white;
  font-size: 24px;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}
</style>
