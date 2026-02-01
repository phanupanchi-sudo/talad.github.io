import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path' 

export default defineConfig({
  plugins: [
    tailwindcss(), 
  ],
  // 3. เพิ่มส่วนนี้เข้าไป เพื่อให้ Vite รู้จักหน้า kormoon.html
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        kormoon: resolve(__dirname, 'kormoon.html'),
      },
    },
  },
})