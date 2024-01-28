<template>
  <div class="hidden absolute z-10 w-auto h-auto px-2 font-bold py-1 bg-slate-300 top-1 left-1 rounded-md">Clicko</div>
  <div ref="mapContainer" class="w-screen h-screen bg-slate-800"></div>
</template>
<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { overpassJson } from 'overpass-ts'
import '../node_modules/mapbox-gl/dist/mapbox-gl.css'
import mapboxgl, { Map } from 'mapbox-gl';
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
  navigator.geolocation.getCurrentPosition((position) => {
    coords.lat = position.coords.latitude
    coords.lon = position.coords.longitude
    const { lon, lat, defaults } = calcBBOX(56.0641195, -3.3909015, -500, 500)
    //console.log(`node(${lat.min}, ${lon.min}, ${lat.max}, ${lon.max});`)
    overpassJson(`
    [out:json];
    node["highway"="bus_stop"](${lat.min}, ${lon.min}, ${lat.max}, ${lon.max});
    out geom;
    `).then(data => {
      //console.log(data.elements)
      data.elements.forEach(point => {
        let coordinates = [point.lon, point.lat]
        let properties = point
        //delete properties.geometry
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
      console.log(geoJSON)
      map.addSource('stuff', {
        type: 'geojson',
        //@ts-ignore
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
