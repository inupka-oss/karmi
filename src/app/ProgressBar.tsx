'use client'
import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

// Кастомные стили для NProgress
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    #nprogress {
      pointer-events: none;
    }
    #nprogress .bar {
      background: linear-gradient(90deg, #8b5cf6, #a78bfa);
      position: fixed;
      z-index: 1030;
      top: 0;
      left: 0;
      width: 100%;
      height: 3px;
      box-shadow: 0 0 10px rgba(139, 92, 246, 0.5), 0 0 20px rgba(139, 92, 246, 0.3);
    }
    #nprogress .peg {
      display: block;
      position: absolute;
      right: 0;
      width: 100px;
      height: 100%;
      box-shadow: 0 0 10px #8b5cf6, 0 0 5px #8b5cf6;
      opacity: 1;
      transform: rotate(3deg) translate(0px, -4px);
    }
    #nprogress .spinner {
      display: none;
    }
  `
  document.head.appendChild(style)
}

export default function ProgressBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    NProgress.configure({ 
      showSpinner: false, 
      speed: 400, 
      minimum: 0.2,
      trickleSpeed: 200,
    })
  }, [])

  useEffect(() => {
    NProgress.done()
  }, [pathname, searchParams])

  return null
}