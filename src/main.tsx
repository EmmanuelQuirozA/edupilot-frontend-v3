import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { API_BASE_URL } from './config'
import './index.css'
import App from './App.tsx'

const setFavicon = (url: string) => {
  let faviconLink = document.querySelector("link[rel='icon']") as HTMLLinkElement | null
  if (!faviconLink) {
    faviconLink = document.createElement('link')
    faviconLink.rel = 'icon'
    faviconLink.type = 'image/png'
    document.head.appendChild(faviconLink)
  }
  faviconLink.href = url
}

const ensureFavicon = () => {
  const faviconUrl = `${API_BASE_URL}/schools/schools-image`
  const fallbackUrl = '/img/logo.png'

  fetch(faviconUrl)
    .then((response) => {
      if (response.ok) {
        setFavicon(faviconUrl)
      } else {
        setFavicon(fallbackUrl)
      }
    })
    .catch(() => {
      setFavicon(fallbackUrl)
    })
}

ensureFavicon()



createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
