"""Only run against a disposable local net_test database, never Supabase production."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import os
from uuid import uuid4
import psycopg
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.engine import make_url
from app.main import create_app


@pytest.mark.skipif(not os.getenv('NET_TEST_DATABASE_URL'), reason='임시 PostgreSQL 연결 정보 없음')
def test_migration_repeated_legacy_preservation_and_20_concurrent_draws():
    url = os.environ['NET_TEST_DATABASE_URL']
    parsed = make_url(url)
    assert parsed.database == 'net_test' and parsed.host in ('127.0.0.1', 'localhost'), '임시 로컬 net_test DB에서만 실행하세요.'
    sql_url = url.replace('postgresql+psycopg://', 'postgresql://', 1)
    migrations = sorted((Path(__file__).resolve().parents[2]/'supabase/migrations').glob('*.sql'))
    with psycopg.connect(sql_url) as conn:
        for migration in migrations:
            conn.execute(migration.read_text(), prepare=False)
        table = conn.execute('SELECT id FROM public.tables WHERE number=1').fetchone()[0]
        legacy_id = uuid4()
        conn.execute('INSERT INTO public.questions(id,table_id,content,target) VALUES(%s,%s,%s,%s)',
                     (legacy_id, table, '기존 데이터 보존', 'all'))
        conn.commit()
        for _ in range(2):
            for migration in migrations:
                conn.execute(migration.read_text(), prepare=False)
        assert conn.execute('SELECT count(*) FROM public.tables').fetchone()[0] == 3
        assert conn.execute('SELECT content,author_visitor_id,author_nickname FROM public.questions WHERE id=%s', (legacy_id,)).fetchone() == ('기존 데이터 보존', None, None)

    with TestClient(create_app(url)) as client:
        table_id = client.get('/api/tables').json()[1]['id']
        entries=[]
        for i in range(20):
            visitor=str(uuid4())
            response=client.post('/api/participants',json={'nickname':f'참가자{i}', 'visitorId':visitor, 'table_id':table_id})
            assert response.status_code==201,response.text
            session=response.json()
            headers={'Authorization':'Bearer '+session['token']}
            entries.append((session,headers,visitor))
            response=client.post(f'/api/tables/{table_id}/questions',headers=headers,json={'nickname':f'참가자{i}', 'visitorId':visitor,'content':f'동시 질문 {i}', 'target':'all'})
            assert response.status_code==201,response.text
        def draw(i):
            response=client.post(f'/api/tables/{table_id}/draw',headers={**entries[i][1],'Idempotency-Key':f'concurrent-{i}'})
            assert response.status_code==200,response.text
            return response.json()
        with ThreadPoolExecutor(max_workers=20) as pool:
            results=list(pool.map(draw,range(20)))
        assert len({r['question']['id'] for r in results})==20
        assert client.get(f'/api/tables/{table_id}/status',headers=entries[0][1]).json()['remaining_count']==0
        session,headers,visitor=entries[0]
        assert client.post(f'/api/tables/{table_id}/questions',headers=headers,json={'nickname':'참가자0','visitorId':visitor,'content':'멱등 테스트','target':'all'}).status_code==201
        def retry(_):
            response=client.post(f'/api/tables/{table_id}/draw',headers={**headers,'Idempotency-Key':'identical-concurrent-key'})
            assert response.status_code==200,response.text
            return response.json()
        with ThreadPoolExecutor(max_workers=20) as pool:
            repeated=list(pool.map(retry,range(20)))
        assert all(result==repeated[0] for result in repeated)
        assert len(client.get(f'/api/tables/{table_id}/history',headers=headers).json())==21


@pytest.mark.skipif(not os.getenv('NET_TEST_DATABASE_URL'), reason='임시 PostgreSQL 연결 정보 없음')
def test_20_concurrent_public_table_creations_have_unique_numbers():
    url=os.environ['NET_TEST_DATABASE_URL']
    parsed=make_url(url)
    assert parsed.database=='net_test' and parsed.host in ('127.0.0.1','localhost')
    with TestClient(create_app(url)) as client:
        def create(i):
            response=client.post('/api/tables',json={'name':f'그룹 {i}'})
            assert response.status_code==201,response.text
            return response.json()
        with ThreadPoolExecutor(max_workers=20) as pool:
            created=list(pool.map(create,range(20)))
        assert len({t['id'] for t in created})==20
        assert len({t['number'] for t in created})==20
