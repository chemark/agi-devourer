import { useEffect, useState } from 'react'

export type Orientation = 'portrait' | 'landscape'

export type ViewportProfile = {
  orientation: Orientation
  isCompactLandscape: boolean
}

function getViewportProfile(): ViewportProfile {
  const orientation =
    window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'

  return {
    orientation,
    isCompactLandscape:
      orientation === 'landscape' && window.innerHeight <= 430,
  }
}

export function useViewportProfile() {
  const [profile, setProfile] = useState<ViewportProfile>(getViewportProfile)

  useEffect(() => {
    const onResize = () => setProfile(getViewportProfile())

    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return profile
}

export function useOrientation() {
  return useViewportProfile().orientation
}
