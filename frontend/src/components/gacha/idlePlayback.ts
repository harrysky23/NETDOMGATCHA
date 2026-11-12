interface IdleMedia extends EventTarget {
  muted: boolean
  play(): Promise<void>
  pause(): void
}
interface PageVisibility extends EventTarget {
  readonly visibilityState: string
}

/** 재생 차단은 포스터로 대체합니다. 탭 복귀나 늦은 play() 응답이 추첨을 재생하지 않습니다. */
export function attachIdlePlayback(
  media: IdleMedia,
  page: PageVisibility,
  onBlocked: () => void,
) {
  let active = false
  let disposed = false
  let revision = 0
  const canPlay = () =>
    active && !disposed && page.visibilityState === 'visible'
  function sync() {
    const request = ++revision
    if (!canPlay()) {
      media.pause()
      return
    }
    media.muted = true
    void media.play().then(
      () => {
        if (!disposed && !canPlay()) media.pause()
      },
      () => {
        if (request === revision && canPlay()) onBlocked()
      },
    )
  }
  const onPlaying = () => {
    if (!canPlay()) media.pause()
  }
  page.addEventListener('visibilitychange', sync)
  media.addEventListener('playing', onPlaying)
  return {
    setActive(value: boolean) {
      active = value
      sync()
    },
    dispose() {
      disposed = true
      revision++
      page.removeEventListener('visibilitychange', sync)
      media.removeEventListener('playing', onPlaying)
      media.pause()
    },
  }
}

interface MediaConnection {
  saveData?: boolean
  effectiveType?: string
  type?: string
}

/** iOS처럼 회선 정보를 제공하지 않는 브라우저에서는 추첨 영상을 metadata까지만 준비합니다. */
export function mediaPolicy(connection?: MediaConnection) {
  const limited =
    !!connection?.saveData ||
    ['slow-2g', '2g'].includes(connection?.effectiveType ?? '')
  return {
    idleEnabled: !limited,
    drawPreload: limited
      ? 'none'
      : connection?.type === 'wifi' || connection?.type === 'ethernet'
        ? 'auto'
        : 'metadata',
  } as const
}
