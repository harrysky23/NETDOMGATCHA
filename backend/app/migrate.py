"""선택한 NET DB에 명시적으로 적용: python -m app.migrate (자동 시작 시 실행하지 않음)."""
import os
from pathlib import Path
import psycopg
from dotenv import load_dotenv


def migrate():
    load_dotenv(Path(__file__).resolve().parents[1] / '.env')
    url = os.environ.get('DATABASE_URL')
    if not url:
        raise SystemExit('DATABASE_URL을 서버 환경변수에 설정하세요.')
    url = url.replace('postgresql+psycopg://', 'postgresql://', 1)
    files = sorted((Path(__file__).resolve().parents[2] / 'supabase' / 'migrations').glob('*.sql'))
    if not files:
        raise SystemExit('마이그레이션 SQL 파일을 찾지 못했습니다.')
    # 각 SQL 파일 자체의 BEGIN/COMMIT을 유지합니다. 실패 시 연결 문자열을 출력하지 않습니다.
    try:
        with psycopg.connect(url, autocommit=True, connect_timeout=15) as conn:
            for file in files:
                conn.execute(file.read_text(), prepare=False)
                print(f'적용 완료: {file.name}')
    except psycopg.Error:
        raise SystemExit('마이그레이션을 완료하지 못했습니다. DB 연결/권한과 스키마를 확인하세요.') from None


if __name__ == '__main__':
    migrate()
