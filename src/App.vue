<template>
  <div ref="mapContainer" class="w-screen h-screen bg-slate-800"></div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { overpassJson } from 'overpass-ts'
import { useGeolocation } from '@vueuse/core'
import '../node_modules/mapbox-gl/dist/mapbox-gl.css'
import mapboxgl from 'mapbox-gl';
mapboxgl.accessToken =
  'pk.eyJ1IjoiaGFsZmRvbGxhbnVnZ2V0IiwiYSI6ImNscmhvbWJqYjAxMGwyanBoNWNkMmE2ZmwifQ.yxvy-dtPE7IhptLxXlJdUg';

const mapContainer = ref(null)
const { coords, locatedAt, error, resume, pause } = useGeolocation()
resume()

onMounted(() => {
  console.log(coords.value)
  const geoJSON = {
    "type": "FeatureCollection",
    "features": [] as any[]
  }
  overpassJson(`
  [out:json];
  node(626639517);
  convert item ::=::,::geom=geom(),_osm_type=type();
  out geom;
  `).then(data => {
    data.elements.forEach(point => {
      let coordinates = point.geometry.coordinates
      let properties = point
      delete properties.geometry
      let feature = {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          coordinates
        },
        properties
      }
      geoJSON.features.push(feature)
    })
  })
  const map = new mapboxgl.Map({
    //@ts-ignore
    container: mapContainer.value,
    style: 'mapbox://styles/mapbox/streets-v12', // Replace with your preferred map style
    center: [-3.4716808, 56.075106],
    zoom: 9,
    attributionControl: false
  })

  map.on('load', () => {
    map.addSource('stuff', {
      type: 'geojson',
      data: geoJSON
    })
    map.addLayer({
      id: 'stuff-layer',
      type: 'circle',
      source: 'stuff',
      paint: {
        "circle-radius": 4,
        "circle-stroke-width": 2,
        "circle-color": 'red',
        "circle-stroke-color": 'white'
      }
    })
  })
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
