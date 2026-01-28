import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'school-image-endpoint',
      configureServer(server) {
        const logoPath = path.resolve(__dirname, 'public', 'img', 'logo.png')
        server.middlewares.use('/schools/school-image', (req, res, next) => {
          if (req.method && !['GET', 'HEAD'].includes(req.method)) {
            next()
            return
          }

          fs.readFile(logoPath, (error, data) => {
            if (error) {
              res.statusCode = 404
              res.end()
              return
            }

            res.statusCode = 200
            res.setHeader('Content-Type', 'image/png')
            res.end(data)
          })
        })
      },
    },
  ],
})
