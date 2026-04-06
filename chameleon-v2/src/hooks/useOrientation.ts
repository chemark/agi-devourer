import { useEffect, useState } from 'react'

export type Orientation = 'portrait' | 'landscape'

function getOrientation(): Orientation {
  return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
}

export function useOrientation() {
  const [orientation, setOrientation] = useState<Orientation>(getOrientation)

  useEffect(() => {
    const onResize = () => setOrientation(getOrientation())

    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return orientation
}
