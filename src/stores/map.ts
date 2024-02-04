import { defineStore } from "pinia"
import mapboxgl  from "mapbox-gl"
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
      data: {} as any
    },
    layers: {
      pois: {
        name: 'pois',
        query: `
        [out:json];
        nwr["highway"="bus_stop"]({{bbox}});
        out geom;`,
        options: {
          id: 'pois-layer',
          type: 'circle',
          source: 'pois',
          paint: {
            'circle-color': '#11b4da',
            'circle-radius': 4,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#fff'
          }
        },
        data: {}
      },
      geoms: {
        name: 'geoms',
        query: `
        [out:json];
        way["natural"~"water|wood"]({{bbox}});
        out geom;

        way["leisure"="playground"]({{bbox}});
        out geom;
        
        way["religion"]({{bbox}});
        out geom;`,
        options: {
          id: 'geoms-layer',
          type: 'fill',
          source: 'geoms',
          paint: {
            'fill-color': '#0080ff',
            'fill-opacity': 0.5
          },
        },
        data: {}
      }
    } as ILayerObj
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
      })
      /* this.map.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true,
          },
          trackUserLocation: true,
          showUserHeading: true,
        })
      ) */
      this.map.on('load', async () => {
        const { longitude, latitude } = this.bbox.default
        this.map.setCenter([longitude, latitude])
        for (const layer in this.layers) {
          const thisLayer = this.layers[layer]
          const layerName = thisLayer.name
          const layerId = thisLayer.options.id
          const layerOptions = thisLayer.options
          await this.fetchLayer(thisLayer).then((data) => thisLayer.data = data)
          this.map.addSource(layerName, {
            type: 'geojson',
            data: thisLayer.data
          })
          this.map.addLayer(layerOptions)
            .on('contextmenu', layerId, (e: any) => {
              console.log(e.features[0])
            })
            .on('click', layerId, (e: any) => {
              if (e.features[0].properties.name) this.setTooltipState(true, e.features[0].properties)
            }).on('mouseenter', layerId, (e: any) => {
              if (e.features[0].properties.name) this.map.getCanvas().style.cursor = 'pointer'
              //this.map.setPaintProperty('areas-layer', 'fill-color', '#22e3f5')
            }).on('mouseleave', layerId, (e: any) => {
              this.map.getCanvas().style.cursor = ''
              //this.map.setPaintProperty('areas-layer', 'fill-color', '#0080ff')
            })
        }
      })
    },
    getCurrentPosition() {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition((position) => {
          this.currentPosition.latitude = position.coords.latitude
          this.currentPosition.longitude = position.coords.longitude
          this.calcBBOX(this.currentPosition.latitude, this.currentPosition.longitude, -1000, 1000)
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
      const { longitude, latitude } = this.calcBBOX(this.currentPosition.latitude, this.currentPosition.longitude, -1000, 1000)
      return `${latitude.min}, ${longitude.min}, ${latitude.max}, ${longitude.max}`
    },
    async fetchLayer(layer: ILayer) {
      const parsedCoords = this.prepareCoordsForOverpassQuery()
      return new Promise(async (resolve) => {
        await overpassJson(layer.query.replaceAll('{{bbox}}', parsedCoords)).then(data => {
          const parsedData = osmtogeojson(data)
          layer.data = parsedData
          resolve(parsedData)
        })
      })
    },
    setTooltipState(isShown: boolean, data: any) {
      this.tooltip.isShown = isShown
      this.tooltip.data = data
    }
  }
})

export interface ILayer {
  name: string
  query: string
  options: any
  data: any 
}

export interface ILayerObj {
  [name: string]: ILayer
}