import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        // SỬA 1: Đổi từ 'src/assets' sang 'src/imports' để khớp với thư mục thực tế đang chứa ảnh của bạn
        return path.resolve(__dirname, 'src/imports', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
      // SỬA 2: Thêm alias riêng cho thư mục imports. 
      // Giờ đây thay vì viết: import bg from '../../imports/bg.jpg'
      // Bạn có thể viết gọn là: import bg from '@imports/bg.jpg'
      '@imports': path.resolve(__dirname, './src/imports'),
    },
  },

  server: {
    proxy: {
      // Mọi request bắt đầu bằng /api sẽ được Vite tự động chuyển hướng sang Backend
      '/api': {
        target: 'http://127.0.0.1:5000', // Cổng chạy Flask của bạn
        changeOrigin: true,
        secure: false,
      }
    }
  },

  // THÊM ĐOẠN NÀY: Cho phép Render truy cập vào server preview mà không bị chặn host
  preview: {
    allowedHosts: true,
  },

  // SỬA 3: Bổ sung các định dạng ảnh (.jpg, .png, .jpeg) vào assetsInclude 
  // để Vite chắc chắn load chúng như một tệp tĩnh (asset) không bị lỗi parse code.
  assetsInclude: ['**/*.svg', '**/*.csv', '**/*.jpg', '**/*.jpeg', '**/*.png'],
})
