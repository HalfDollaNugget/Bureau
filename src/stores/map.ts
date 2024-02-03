import { type ref } from 'vue'
import { defineStore } from "pinia"
import mapboxgl, { Map }  from "mapbox-gl"
import { overpassJson } from 'overpass-ts'
import osmtogeojson from 'osmtogeojson'

export const useMapStore = defineStore('map', {
  state: () => ({
    map: {} as mapboxgl.Map,
    token: 'pk.eyJ1IjoiaGFsZmRvbGxhbnVnZ2V0IiwiYSI6ImNscmhvbWJqYjAxMGwyanBoNWNkMmE2ZmwifQ.yxvy-dtPE7IhptLxXlJdUg',
    overpassQuery: '' as string,
    overpassOutput: {},
    currentPosition: {
      latitude: 0,
      longitude: 0
    },
    bbox: {
      latitude: {
        min: 0,
        max: 0
      },
      longitude: {
        min: 0,
        max: 0
      },
      default: {
        latitude: 0,
        longitude: 0
      }
    },
    tooltip: {
      isShown: false,
      data: {}
    }
  }),
  getters: {
    getMap: (state) => state.map,
    getOverpassQuery: (state) => state.overpassQuery,
    getOverpassOutput: (state) => state.overpassOutput,
    isTooltipShown: (state) => state.tooltip.isShown,
  },
  actions: {
    async setMap(container: any) {
      mapboxgl.accessToken = this.token
      await this.getCurrentPosition().then()
      this.map = new mapboxgl.Map({
        //@ts-ignore
        container: container,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [this.bbox.default.longitude, this.bbox.default.latitude],
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
      this.map.on('load', async () => {
        let output = {} as any
        await this.fetchOverpass().then((data) => output = data)
        console.log(output)
        const { longitude, latitude } = this.bbox.default
        this.map.setCenter([longitude, latitude])
        this.map.addSource('areas', {
          type: 'geojson',
          //@ts-ignore
          data: output
        }).setFog({
          "range": [0.8, 8],
          "color": "#dc9f9f",
          "horizon-blend": 0.5,
          "high-color": "#245bde",
          "space-color": "#000000",
          "star-intensity": 0.15
        })
        this.map.addLayer({
          id: 'areas-layer',
          type: 'fill',
          source: 'areas',
          paint: {
            'fill-color': '#0080ff',
            'fill-opacity': 0.5
          }
        }).on('click', 'areas-layer', (e: any) => {
          const coordinates = e.features[0].geometry.coordinates
          this.tooltip.isShown = !this.tooltip.isShown 
        }).on('mouseenter', 'areas-layer', () => {
          this.map.getCanvas().style.cursor = 'pointer'
          //this.map.setPaintProperty('areas-layer', 'fill-color', '#22e3f5')
        }).on('mouseleave', 'areas-layer', () => {
          this.map.getCanvas().style.cursor = ''
          //this.map.setPaintProperty('areas-layer', 'fill-color', '#0080ff')
        })
      })
    },
    getCurrentPosition() {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition((position) => {
          this.currentPosition.latitude = position.coords.latitude
          this.currentPosition.longitude = position.coords.longitude
          resolve(this.currentPosition)
        })
      })
    },
    calcLat(lat: number, meters: number) {
      const earth = 6378.137
      const pi = Math.PI
      let m = (1 / ((2 * pi / 360) * earth)) / 1000
    
      return {
        oldLat: lat,
        newLat: lat + (meters * m)
      }
    },
    calcLon(lon: number, lat: number, meters: number) {
      const earth = 6378.137
      const pi = Math.PI
      const cos = Math.cos
      const m = (1 / ((2 * pi / 360) * earth)) / 1000
    
      return {
        oldLon: lon,
        newLon: lon + (meters * m) / cos(lat * (pi / 180))
      }
    },
    calcBBOX(latitude: number, longitude: number, min: number, max: number) {
        const earth = 6378.137
        const pi = Math.PI
        const cos = Math.cos
        const m = (1 / ((2 * pi / 360) * earth)) / 1000
        this.bbox =  {
          latitude: {
            min: this.calcLat(latitude, min).newLat,
            max: this.calcLat(latitude, max).newLat
          },
          longitude: {
            min: this.calcLon(longitude, latitude, min).newLon,
            max: this.calcLon(longitude, latitude, max).newLon
          },
          default: {
            latitude,
            longitude
          }
        }
        return this.bbox
    },
    prepareCoordsForOverpassQuery() {
      const { longitude, latitude } = this.calcBBOX(this.currentPosition.latitude, this.currentPosition.longitude, -500, 500)
      return `${latitude.min}, ${longitude.min}, ${latitude.max}, ${longitude.max}`
    },
    async fetchOverpass() {
      const parsedCoords = this.prepareCoordsForOverpassQuery()
      return new Promise(async (resolve) => {
        await overpassJson(`
        [out:json];
        (
          //way["landuse"="forest"](${parsedCoords});
          //way["natural"="wood"](${parsedCoords});
          way["natural"~"water|wood"](${parsedCoords});
          //nwr["highway"="bus_stop"](${parsedCoords});
        );
        out geom;
        `).then(data => {
          const parsedData = osmtogeojson(data)
          this.overpassOutput = parsedData
          resolve(parsedData)
        })
      })
    }
  }
})