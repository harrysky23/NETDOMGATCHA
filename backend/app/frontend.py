"""동일한 HTTPS 주소에서 Vite 정적 파일과 FastAPI를 제공합니다."""
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles


def attach_frontend(app: FastAPI, directory: Path):
    root = directory.resolve()
    index = root / 'index.html'
    if not index.is_file():
        return  # 프론트를 별도 실행하는 로컬/API 전용 배포도 지원합니다.

    for name in ('assets', 'fonts'):
        folder = root / name
        if folder.is_dir():
            app.mount('/'+name, StaticFiles(directory=folder), name='frontend-'+name)

    @app.get('/{path:path}', include_in_schema=False)
    def frontend(path: str):
        # 알 수 없는 API/정적 파일 요청을 HTML로 돌려주지 않습니다.
        if path == 'api' or path.startswith('api/'):
            raise HTTPException(404, detail='Not Found')
        candidate = (root / path).resolve()
        if not candidate.is_relative_to(root):
            raise HTTPException(404, detail='Not Found')
        if candidate.is_file():
            return FileResponse(candidate)
        if Path(path).suffix:
            raise HTTPException(404, detail='Not Found')
        return FileResponse(index, headers={'Cache-Control': 'no-cache'})
