import { defineConfig } from 'vitest/config'
import path from 'path'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],

    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@imports': path.resolve(__dirname, './src/imports'),
        },
    },

    test: {
        environment: 'jsdom',
        globals: true,
    },
})