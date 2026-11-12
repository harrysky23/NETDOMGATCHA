"""Build two cyclic idle candidates from the untouched 24 fps Flow original.

Usage: python3 scripts/build_idle_loop.py --ffmpeg /path/to/ffmpeg
Only Python's standard library and FFmpeg are required.
"""

import argparse
import json
from pathlib import Path
import shutil
import statistics
import subprocess


def main():
    root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ffmpeg', default=shutil.which('ffmpeg'))
    parser.add_argument('--source', type=Path, default=root / 'Animate_gashapon_machine_capsule…_ac9055dc.mp4')
    args = parser.parse_args()
    if not args.ffmpeg:
        parser.error('FFmpeg가 필요합니다. --ffmpeg /path/to/ffmpeg를 지정하세요.')
    if not args.source.is_file():
        parser.error(f'원본 영상을 찾을 수 없습니다: {args.source}')

    assets = root / 'frontend/src/assets'
    comparison = root / 'artifacts/idle-loops'
    comparison.mkdir(parents=True, exist_ok=True)
    simple = comparison / 'gacha-idle-pingpong.mp4'
    chosen = assets / 'gacha-idle-pingpong-crossfade.mp4'
    poster = assets / 'gacha-idle-pingpong-crossfade-poster.webp'
    # Source frames 120..189 (70 frames, 5.0..7.875 seconds).
    # Forward: 0..69; reverse: 68..1. Neither turn repeats an endpoint.
    selection = (
        '[0:v]trim=start_frame=120:end_frame=190,setpts=PTS-STARTPTS,'
        'settb=AVTB,split=2[f][r0];'
        '[r0]reverse,trim=start_frame=1:end_frame=69,setpts=PTS-STARTPTS[r];'
    )
    filters = {
        simple: selection + '[f][r]concat=n=2:v=1:a=0,format=yuv420p[v]',
        # 3-frame (0.125 second) dissolves at BOTH turning points.
        # First join: 70 + 68 - 3 = 135 frames. Circular head overlap: 132.
        chosen: selection + (
            '[f][r]xfade=transition=fade:duration=0.125:offset=2.791666667[j];'
            '[j]split=2[tail0][head0];'
            '[tail0]trim=start_frame=3,setpts=PTS-STARTPTS[tail];'
            '[head0]trim=end_frame=3,setpts=PTS-STARTPTS[head];'
            '[tail][head]xfade=transition=fade:duration=0.125:offset=5.375,'
            'format=yuv420p[v]'
        ),
    }
    for path, graph in filters.items():
        subprocess.run([
            args.ffmpeg, '-hide_banner', '-loglevel', 'error', '-y',
            '-i', str(args.source), '-filter_complex_threads', '1',
            '-filter_complex', graph, '-map', '[v]', '-an', '-map_metadata', '-1',
            '-c:v', 'libx264', '-preset', 'medium', '-crf', '22',
            '-profile:v', 'main', '-level:v', '3.1', '-pix_fmt', 'yuv420p',
            '-fps_mode', 'cfr', '-movflags', '+faststart', str(path),
        ], check=True)
        print(f'{path.relative_to(root)}: {path.stat().st_size:,} bytes')
    subprocess.run([
        args.ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', '-i', str(chosen),
        '-frames:v', '1', '-c:v', 'libwebp', '-quality', '88', str(poster),
    ], check=True)

    # Compare source hashes BEFORE lossy encoding: the concatenated order must
    # be exactly F0..F69,F68..F1, with no repeated endpoint at either turn.
    def hashes(graph):
        text = subprocess.check_output([
            args.ffmpeg, '-v', 'error', '-i', str(args.source),
            '-filter_complex_threads', '1', '-filter_complex', graph,
            '-map', '[v]', '-an', '-f', 'framemd5', '-',
        ], text=True)
        return [line.rsplit(',', 1)[1].strip() for line in text.splitlines()
                if line and not line.startswith('#')]
    forward = hashes('[0:v]trim=start_frame=120:end_frame=190,setpts=PTS-STARTPTS,format=yuv420p[v]')
    pingpong = hashes(filters[simple])
    assert len(forward) == 70
    assert pingpong == forward + forward[-2:0:-1], 'Ping-Pong 프레임 순서 오류'
    assert pingpong[69] != pingpong[70] and pingpong[-1] != pingpong[0], '연결 프레임 중복'

    report = {'source': args.source.name, 'source_selection': {
        'start_frame': 120, 'end_frame_exclusive': 190, 'fps': 24,
        'first_frame_seconds': 5.0, 'last_frame_seconds': 7.875,
    }, 'unencoded_pingpong_order_verified': True, 'candidates': {}}
    for path, expected, turns in [(simple, 138, [69, 0]), (chosen, 132, [65, 130])]:
        raw = subprocess.check_output([
            args.ffmpeg, '-v', 'error', '-i', str(path), '-vf', 'scale=90:160',
            '-pix_fmt', 'gray', '-an', '-f', 'rawvideo', '-',
        ])
        frames = [raw[i:i + 14400] for i in range(0, len(raw), 14400)]
        assert len(frames) == expected, f'{path.name}: 프레임 수 오류'
        pairs = list(zip(frames, frames[1:] + frames[:1]))
        duplicates = sum(a == b for a, b in pairs)
        assert duplicates == 0, f'{path.name}: 중복 프레임 발견'
        diffs = [sum(abs(a-b) for a, b in zip(p, q))/14400 for p, q in pairs]
        accelerations = [
            sum(abs(a-2*b+c) for a, b, c in zip(
                frames[(i-1) % len(frames)], frames[i], frames[(i+1) % len(frames)],
            )) / 14400 for i in turns
        ]
        report['candidates'][str(path.relative_to(root))] = {
            'frames': len(frames), 'duration_seconds': len(frames)/24,
            'size_bytes': path.stat().st_size,
            'duplicate_neighbors_including_wrap': duplicates,
            'seam_luma_difference': round(diffs[-1], 4),
            'median_adjacent_luma_difference': round(statistics.median(diffs), 4),
            'max_adjacent_luma_difference': round(max(diffs), 4),
            'turn_luma_second_difference': [round(a, 4) for a in accelerations],
        }
    (comparison / 'analysis.json').write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
    print('Verified frame order, frame counts, both wrap boundaries; analysis.json written.')


if __name__ == '__main__':
    main()
