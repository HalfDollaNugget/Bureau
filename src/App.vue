<template>
  <div class="hidden absolute z-10 w-auto h-auto px-2 font-bold py-1 bg-slate-300 top-1 left-1 rounded-md">Clicko</div>
  <div ref="mapContainer2" class="flex flex-1 w-screen h-screen bg-slate-800"></div>
  <div v-show="mapStore.isTooltipShown" @click.self="mapStore.setTooltipState(false, {})" class="absolute top-0 left-0 w-screen h-screen flex flex-1 bg-slate-700/50 justify-center items-center z-50 overflow-y-hidden">
    <div v-if="mapStore.isTooltipShown" class="w-2/3 h-auto bg-slate-700 shadow-md rounded-md flex flex-col justify-center items-center pointer-events-auto cursor-pointer animate-showup overflow-y-auto text-slate-50">
      <div v-show="mapStore.tooltip.data.name" class="px-4 py-2 flex flex-col items-center justify-center space-y-2">
        <p class="">{{ mapStore.tooltip.data.name }}</p>
        <p class="">{{ mapStore.tooltip.data.id }}</p>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMapStore } from './stores/map.ts'
import '../node_modules/mapbox-gl/dist/mapbox-gl.css'

const mapStore = useMapStore()
const mapContainer2 = ref(null)
onMounted(async () => {
  mapStore.setMap(mapContainer2.value)
})
</script>
<style>
body,
#app,
#map {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}
</style>
