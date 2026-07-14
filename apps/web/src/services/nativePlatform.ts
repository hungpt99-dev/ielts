import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

let nativePlatform: 'ios' | 'android' | null = null
let CapApp: typeof import('@capacitor/app').App | null = null

async function getCapacitor() {
  try {
    const { Capacitor } = await import('@capacitor/core')
    if (!Capacitor.isNativePlatform()) return null
    nativePlatform = Capacitor.getPlatform() as 'ios' | 'android'
    return Capacitor
  } catch (error) {
    console.error('apps/web/src/services/nativePlatform.ts error:', error);
    return null
  }
}

async function loadPlugins() {
  const capacitor = await getCapacitor()
  if (!capacitor) return false

  try {
    const appModule = await import('@capacitor/app')
    CapApp = appModule.App

    const { SplashScreen } = await import('@capacitor/splash-screen')
    await SplashScreen.hide()

    const { StatusBar } = await import('@capacitor/status-bar')
    await StatusBar.setOverlaysWebView({ overlay: false })
    await StatusBar.setBackgroundColor({ color: '#2563eb' })

    const { Keyboard } = await import('@capacitor/keyboard')
    await Keyboard.setAccessoryBarVisible({ isVisible: false })
  } catch (error) {
    console.error('apps/web/src/services/nativePlatform.ts error:', error);
    // plugins not critical — app works without them
  }

  return true
}

let initialised = false

export async function initNativePlatform(): Promise<boolean> {
  if (initialised) return isNativePlatform()
  initialised = true
  const loaded = await loadPlugins()
  return loaded
}

export function isNativePlatform(): boolean {
  return nativePlatform !== null
}

export function getPlatform(): 'ios' | 'android' | 'web' {
  return nativePlatform ?? 'web'
}

export function useNativeBackButton() {
  const navigate = useNavigate()
  const initRef = useRef(false)

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    let cleanup: (() => void) | undefined

    async function setup() {
      if (!CapApp) return
      const { App } = await import('@capacitor/app')
      const handler = await App.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          navigate(-1)
        } else {
          App.exitApp()
        }
      })
      cleanup = () => handler.remove()
    }

    setup()

    return () => {
      cleanup?.()
    }
  }, [navigate])
}

export function useNativeAppState() {
  useEffect(() => {
    let cleanup: (() => void) | undefined

    async function setup() {
      try {
        const { App } = await import('@capacitor/app')
        const handler = await App.addListener('appStateChange', ({ isActive }) => {
          window.dispatchEvent(new CustomEvent('native-app-state', {
            detail: { isActive },
          }))
        })
        cleanup = () => handler.remove()
      } catch (error) {
        console.error('apps/web/src/services/nativePlatform.ts error:', error);
        // not on native
      }
    }

    setup()
    return () => cleanup?.()
  }, [])
}

export async function getAppInfo() {
  try {
    const { App } = await import('@capacitor/app')
    return await App.getInfo()
  } catch (error) {
    console.error('apps/web/src/services/nativePlatform.ts error:', error);
    return null
  }
}

export async function getAppLaunchUrl() {
  try {
    const { App } = await import('@capacitor/app')
    return await App.getLaunchUrl()
  } catch (error) {
    console.error('apps/web/src/services/nativePlatform.ts error:', error);
    return null
  }
}
