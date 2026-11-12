import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { fitMachine, type MachineSize } from './machineGeometry'

/** 대기/추첨 영상과 터치 영역이 공유하는 단일 contain 프레임. 원본은 크롭하지 않습니다. */
export function MachineFrame({
  children,
}: {
  children: ReactNode | ((size: MachineSize) => ReactNode)
}) {
  const space = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<MachineSize>({ width: 0, height: 0 })
  useLayoutEffect(() => {
    const element = space.current
    if (!element) return
    const measure = () => {
      const style = getComputedStyle(element)
      const next = fitMachine(
        element.clientWidth -
          parseFloat(style.paddingLeft) -
          parseFloat(style.paddingRight),
        element.clientHeight -
          parseFloat(style.paddingTop) -
          parseFloat(style.paddingBottom),
      )
      setSize((previous) =>
        previous.width === next.width && previous.height === next.height
          ? previous
          : next,
      )
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return (
    <div className="machine-space" ref={space}>
      <div
        className="machine-art-frame"
        style={
          size.width ? { width: size.width, height: size.height } : undefined
        }
      >
        {typeof children === 'function' ? children(size) : children}
      </div>
    </div>
  )
}
