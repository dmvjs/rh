import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
  build: {
    rollupOptions: {
      input: {
        main:      resolve(import.meta.dirname, 'index.html'),
        community: resolve(import.meta.dirname, 'community/index.html'),
        listing:   resolve(import.meta.dirname, 'listing/index.html'),
        post:      resolve(import.meta.dirname, 'post/index.html'),
        login:     resolve(import.meta.dirname, 'login/index.html'),
        register:  resolve(import.meta.dirname, 'register/index.html'),
        admin:     resolve(import.meta.dirname, 'admin/index.html'),
        account:   resolve(import.meta.dirname, 'account/index.html'),
        map:       resolve(import.meta.dirname, 'map/index.html'),
        weather:   resolve(import.meta.dirname, 'weather/index.html'),
        transit:      resolve(import.meta.dirname, 'transit/index.html'),
        restaurants:  resolve(import.meta.dirname, 'restaurants/index.html'),
        government:   resolve(import.meta.dirname, 'government/index.html'),
        cameras:      resolve(import.meta.dirname, 'cameras/index.html'),
        property:     resolve(import.meta.dirname, 'property/index.html'),
      },
    },
  },
})
