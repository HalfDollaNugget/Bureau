import { defineStore } from "pinia"
import mapboxgl from "mapbox-gl"
import { overpassJson } from 'overpass-ts'
import osmtogeojson from 'osmtogeojson'

const useMapStore = defineStore('map', {
  state: () => ({
    map: {} as mapboxgl.Map,
    token: 'pk.eyJ1IjoiaGFsZmRvbGxhbnVnZ2V0IiwiYSI6ImNscmhvbWJqYjAxMGwyanBoNWNkMmE2ZmwifQ.yxvy-dtPE7IhptLxXlJdUg',
    overpassQuery: '' as string,
    overpassOutput: {},
    currentPosition: {
      latitude: 0,
      longitude: 0
    }
  }),
  getters: {
    getMap: (state) => state.map,
    getOverpassQuery: (state) => state.overpassQuery,
    getOverpassOutput: (state) => state.overpassOutput,
  },
  actions: {
    async setMap() {
    },
    getCurrentPosition() {
        navigator.geolocation.getCurrentPosition((position) => {
            this.currentPosition.latitude = position.coords.latitude
            this.currentPosition.longitude = position.coords.longitude
        })
        return this.currentPosition
    },
    calcBBOX(latitude: number, longitude: number, min: number, max: number) {
        const earth = 6378.137
        const pi = Math.PI
        const cos = Math.cos
        const m = (1 / ((2 * pi / 360) * earth)) / 1000
        return {
            lon: {
              min: longitude + (min * m) / cos(latitude * (pi / 180)),
              max: longitude + (max * m) / cos(latitude * (pi / 180))
            },
            lat: {
              min: latitude + (min * m),
              max: latitude + (max * m),
            },
            defaults: {
              longitude,
              latitude
            }
          }
    },
    fetchOverpass(query: string) {

    }
  }
})