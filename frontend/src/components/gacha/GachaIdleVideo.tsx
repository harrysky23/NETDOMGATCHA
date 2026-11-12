import { useEffect, useRef, useState } from 'react'
import { attachIdlePlayback } from './idlePlayback'

export function GachaIdleVideo({
  src,
  poster,
  active,
  enabled,
}: {
  src: string
  poster: string
  active: boolean
  enabled: boolean
}) {
  const video = useRef<HTMLVideoElement>(null)
  const playback = useRef<ReturnType<typeof attachIdlePlayback> | null>(null)
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const element = video.current
    if (!element || !enabled || failed) return
    const controller = attachIdlePlayback(element, document, () =>
      setFailed(true),
    )
    playback.current = controller
    return () => {
      controller.dispose()
      playback.current = null
    }
  }, [src, enabled, failed])

  useEffect(() => {
    playback.current?.setActive(active)
  }, [active, enabled, failed, src])

  return (
    <>
      <img
        className="machine-poster"
        src={poster}
        alt="NET 3D 가챠 머신. 왼쪽 아래 손잡이로 질문을 뽑고, 위쪽 캡슐 보관통으로 질문을 넣을 수 있어요."
        fetchPriority="high"
        width={720}
        height={1280}
      />
      {enabled && !failed && (
        <video
          ref={video}
          className="machine-idle-video"
          data-ready={ready}
          src={src}
          poster={poster}
          autoPlay={active}
          muted
          loop
          playsInline
          preload="auto"
          controls={false}
          disablePictureInPicture
          disableRemotePlayback
          aria-hidden="true"
          onPlaying={() => setReady(true)}
          onError={() => setFailed(true)}
        />
      )}
    </>
  )
}
