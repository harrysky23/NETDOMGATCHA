import { useId } from 'react'

/** 자체 제작 SVG 에셋. Phase 3에서 각 그룹을 애니메이션 컴포넌트로 분리합니다. */
export function GachaMachine({ compact = false }: { compact?: boolean }) {
  const id = useId().replace(/:/g, '')
  const url = (name: string) => `url(#${id}-${name})`
  const capsules = [
    { x: 157, y: 147, r: -25, color: '#b39bf5' },
    { x: 224, y: 139, r: 32, color: '#96c3f5' },
    { x: 272, y: 179, r: -18, color: '#e6a7d2' },
    { x: 130, y: 207, r: 30, color: '#9acaca' },
    { x: 196, y: 201, r: -15, color: '#f4cf88' },
    { x: 248, y: 235, r: 28, color: '#a5a3ed' },
    { x: 162, y: 253, r: -34, color: '#c3acec' },
    { x: 210, y: 271, r: 12, color: '#a0bcf2' },
  ]
  return (
    <div className={`machine-illustration ${compact ? 'machine-compact' : ''}`}>
      <svg
        viewBox="0 0 420 510"
        role="img"
        aria-label="파스텔 캡슐이 가득 담긴 라벤더색 NET 가챠 머신"
      >
        <defs>
          <linearGradient id={`${id}-body`} x1="0" x2="1" y2=".6">
            <stop stopColor="#d4c0ff" />
            <stop offset=".55" stopColor="#b19add" />
            <stop offset="1" stopColor="#8972b9" />
          </linearGradient>
          <linearGradient id={`${id}-glass`} x1="0" y1="0" x2=".9" y2="1">
            <stop stopColor="#c3c3f5" stopOpacity=".34" />
            <stop offset=".5" stopColor="#8e8ac8" stopOpacity=".15" />
            <stop offset="1" stopColor="#d1c5f9" stopOpacity=".25" />
          </linearGradient>
          <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#dacaff" />
            <stop offset="1" stopColor="#9a83cd" />
          </linearGradient>
          <linearGradient id={`${id}-base`} x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#b69bdf" />
            <stop offset="1" stopColor="#8f75bd" />
          </linearGradient>
          <radialGradient id={`${id}-glow`}>
            <stop stopColor="#a88aef" stopOpacity=".3" />
            <stop offset="1" stopColor="#a88aef" stopOpacity="0" />
          </radialGradient>
          <clipPath id={`${id}-dome`}>
            <path d="M100 282V181a110 110 0 0 1 220 0v101Z" />
          </clipPath>
          <filter
            id={`${id}-shadow`}
            x="-50%"
            y="-30%"
            width="200%"
            height="180%"
          >
            <feDropShadow
              dx="0"
              dy="15"
              stdDeviation="14"
              floodColor="#070811"
              floodOpacity=".5"
            />
          </filter>
        </defs>
        <ellipse cx="211" cy="265" rx="200" ry="220" fill={url('glow')} />
        <ellipse
          cx="215"
          cy="472"
          rx="137"
          ry="19"
          fill="#080b14"
          opacity=".5"
        />
        <g filter={url('shadow')}>
          <path
            d="M103 274h214l18 165q1 20-20 20H105q-20 0-18-20Z"
            fill={url('body')}
            stroke="#d0b9f2"
            strokeWidth="2"
          />
          <path
            d="M298 282h19l18 157q1 20-20 20h-20q19-3 16-23Z"
            fill="#77619d"
            opacity=".35"
          />
          <path
            d="M100 282V181a110 110 0 0 1 220 0v101Z"
            fill={url('glass')}
            stroke="#d1c9f5"
            strokeOpacity=".6"
            strokeWidth="3"
          />
          <g clipPath={url('dome')}>
            {capsules.map((c, index) => (
              <g
                key={index}
                transform={`translate(${c.x} ${c.y}) rotate(${c.r})`}
              >
                <circle
                  r="34"
                  fill={c.color}
                  stroke="#fff"
                  strokeOpacity=".25"
                  strokeWidth="1.5"
                />
                <path
                  d="M-34 0a34 34 0 0 0 68 0Z"
                  fill="#eeeafa"
                  fillOpacity=".85"
                />
                <path
                  d="M-33 0h66"
                  stroke="#66578d"
                  strokeOpacity=".4"
                  strokeWidth="2"
                />
                <path
                  d="M-22-14a25 25 0 0 1 14-10"
                  stroke="#fff"
                  strokeOpacity=".6"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <ellipse
                  cx="10"
                  cy="14"
                  rx="10"
                  ry="3"
                  fill="#fff"
                  fillOpacity=".25"
                />
              </g>
            ))}
            <path
              d="M124 173a86 86 0 0 1 49-71"
              stroke="white"
              strokeOpacity=".3"
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M126 199v37"
              stroke="white"
              strokeOpacity=".18"
              strokeWidth="7"
              strokeLinecap="round"
            />
          </g>
          <path
            d="M96 277h228a8 8 0 0 1 8 8v10a8 8 0 0 1-8 8H96a8 8 0 0 1-8-8v-10a8 8 0 0 1 8-8Z"
            fill={url('rim')}
            stroke="#d6c4f8"
            strokeWidth="2"
          />
          <rect
            x="165"
            y="312"
            width="90"
            height="29"
            rx="14.5"
            fill="#e4d8f7"
            fillOpacity=".75"
          />
          <text
            x="210"
            y="332"
            fill="#54416f"
            fontSize="22"
            fontWeight="900"
            fontFamily="Arial, sans-serif"
            textAnchor="middle"
            letterSpacing="5"
          >
            NET
          </text>
          <circle
            cx="210"
            cy="373"
            r="27"
            fill="#776294"
            stroke="#e2d1fc"
            strokeWidth="3"
          />
          <circle cx="210" cy="373" r="21" fill="#d4c1ef" />
          <rect
            x="182"
            y="367"
            width="56"
            height="12"
            rx="6"
            fill="#f0e7ff"
            transform="rotate(-24 210 373)"
            stroke="#ad94cd"
            strokeWidth="2"
          />
          <circle cx="210" cy="373" r="4" fill="#b8a0d7" />
          <rect
            x="170"
            y="416"
            width="80"
            height="31"
            rx="14"
            fill="#58456f"
            stroke="#bda2dc"
            strokeWidth="3"
          />
          <path
            d="M177 430h66"
            stroke="#3c314e"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d="M89 447h242v13a9 9 0 0 1-9 9H98a9 9 0 0 1-9-9Z"
            fill={url('base')}
          />
          <path
            d="M92 449h235"
            stroke="#dfc7ff"
            strokeOpacity=".5"
            strokeWidth="3"
          />
          <circle cx="116" cy="321" r="3" fill="#e2cef8" />
          <circle cx="304" cy="321" r="3" fill="#e2cef8" />
        </g>
        <g fill="#d5c4ff">
          <path d="m333 92 4 12 12 4-12 4-4 12-4-12-12-4 12-4Z" />
          <path d="m67 255 3 9 9 3-9 3-3 9-3-9-9-3 9-3Z" />
        </g>
        <g fill="#9b92cf">
          <circle cx="71" cy="152" r="3" />
          <circle cx="351" cy="234" r="3" />
          <circle cx="319" cy="51" r="2" />
          <circle cx="88" cy="373" r="2" />
        </g>
        <g transform="translate(330 409) rotate(24)">
          <circle r="28" fill="#a9bcee" />
          <path d="M-28 0a28 28 0 0 0 56 0Z" fill="#ebe6f7" />
          <path d="M-27 0h54" stroke="#7b7bab" strokeWidth="1.5" />
          <path
            d="M-17-12q4-7 11-8"
            stroke="#fff"
            strokeOpacity=".6"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  )
}
