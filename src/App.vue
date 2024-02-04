<template>
  <div class="hidden absolute z-10 w-auto h-auto px-2 font-bold py-1 bg-slate-300 top-1 left-1 rounded-md">Clicko</div>
  <!-- <div ref="mapContainer" class="flex w-screen h-screen bg-slate-800"></div> -->
  <div ref="mapContainer2" class="flex flex-1 w-screen h-screen bg-slate-800"></div>
  <div v-show="mapStore.isTooltipShown" @click.self="mapStore.setTooltipState(false, {})" class="absolute top-0 left-0 w-screen h-screen flex flex-1 bg-slate-700/50 justify-center items-center z-50 overflow-y-hidden">
    <div v-if="mapStore.isTooltipShown" class="w-2/3 h-auto bg-slate-700 shadow-md rounded-md flex flex-col justify-center items-center pointer-events-auto cursor-pointer animate-showup overflow-y-auto text-slate-50">
      <div v-show="mapStore.tooltip.data.name" class="px-4 py-2">{{ mapStore.tooltip.data.name }}</div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useMapStore } from './stores/map.ts'
import '../node_modules/mapbox-gl/dist/mapbox-gl.css'
/* import { overpassJson } from 'overpass-ts'
import '../node_modules/mapbox-gl/dist/mapbox-gl.css'
import mapboxgl, { Map } from 'mapbox-gl'
import osmtogeojson from 'osmtogeojson'
mapboxgl.accessToken = 'pk.eyJ1IjoiaGFsZmRvbGxhbnVnZ2V0IiwiYSI6ImNscmhvbWJqYjAxMGwyanBoNWNkMmE2ZmwifQ.yxvy-dtPE7IhptLxXlJdUg';

const mapContainer = ref(null)
const coords = reactive({
  lat: 0 as number,
  lon: 0 as number
})
let map = {} as mapboxgl.Map

const calcLat = (lat: number, meters: number) => {
  const earth = 6378.137
  const pi = Math.PI
  let m = (1 / ((2 * pi / 360) * earth)) / 1000

  return {
    oldLat: lat,
    newLat: lat + (meters * m)
  }
}

const calcLon = (lon: number, lat: number, meters: number) => {
  const earth = 6378.137
  const pi = Math.PI
  const cos = Math.cos
  const m = (1 / ((2 * pi / 360) * earth)) / 1000

  return {
    oldLon: lon,
    newLon: lon + (meters * m) / cos(lat * (pi / 180))
  }
}

const calcBBOX = (lat: number, lon: number, min: number, max: number) => {
  return {
    lon: {
      min: calcLon(lon, lat, min).newLon,
      max: calcLon(lon, lat, max).newLon
    },
    lat: {
      min: calcLat(lat, min).newLat,
      max: calcLat(lat, max).newLat
    },
    defaults: {
      lon,
      lat
    }
  }
}
onMounted(() => {
  const geoJSON = {
    "type": "FeatureCollection",
    "features": [] as any[]
  }
  let output = {}
  navigator.geolocation.getCurrentPosition((position) => {
    coords.lat = position.coords.latitude
    coords.lon = position.coords.longitude
    //const { lon, lat, defaults } = calcBBOX(56.0641195, -3.3909015, -500, 500)
    const { lon, lat, defaults } = calcBBOX(position.coords.latitude, position.coords.longitude, -500, 500)
    console.log(`node(${lat.min}, ${lon.min}, ${lat.max}, ${lon.max});`, position.coords.latitude, position.coords.longitude)
    const parsedCoords = `${lat.min}, ${lon.min}, ${lat.max}, ${lon.max}`
    overpassJson(`
    [out:json];
    (
      //way["landuse"="forest"](${parsedCoords});
      //way["natural"="wood"](${parsedCoords});
      way["natural"~"water|wood"](${parsedCoords});
    );
    out geom;
    `).then(data => output = osmtogeojson(data))
    console.log(output)
    map = new mapboxgl.Map({
      //@ts-ignore
      container: mapContainer.value,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [defaults.lon, defaults.lat],
      zoom: 16,
      attributionControl: false,
      logoPosition: 'bottom-left'
    }).addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showUserHeading: true,
      })
    )
    map.on('load', () => {
      navigator.geolocation.getCurrentPosition((position) => {
        map.setCenter([defaults.lon, defaults.lat])
      })
      map.addSource('areas', {
        type: 'geojson',
        //@ts-ignore
        data: output
      })
      map.addLayer({
        id: 'areas-layer',
        type: 'fill',
        source: 'areas',
        paint: {
          'fill-color': '#0080ff',
          'fill-opacity': 0.5
        }
      })
      map.on('click', 'areas-layer', (e: any) => {
        const coordinates = e.features[0].geometry.coordinates
      })
      map.on('mouseenter', 'areas-layer', () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'areas-layer', () => {
        map.getCanvas().style.cursor = ''
      })
    })
  })
}) */

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
