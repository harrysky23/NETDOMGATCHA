from fastapi.testclient import TestClient
from app.main import create_app


def test_spa_routes_static_files_range_and_api_isolation(tmp_path):
    (tmp_path/'index.html').write_text('<html>NET SPA</html>')
    (tmp_path/'assets').mkdir()
    (tmp_path/'assets'/'movie.mp4').write_bytes(b'0123456789')
    (tmp_path/'fonts').mkdir()
    (tmp_path/'fonts'/'handwriting.ttf').write_bytes(b'font-data')
    with TestClient(create_app('sqlite+pysqlite:///:memory:',initialize=True,frontend_dir=tmp_path)) as client:
        for path in ['/', '/profile', '/questions/list', '/history']:
            response=client.get(path)
            assert response.status_code==200 and 'NET SPA' in response.text
        assert client.get('/api/health').json()=={'status':'ok','database':'ok'}
        assert client.get('/api/missing').status_code==404
        assert 'application/json' in client.get('/api/missing').headers['content-type']
        assert client.get('/assets/missing.mp4').status_code==404
        assert client.get('/fonts/handwriting.ttf').content==b'font-data'
        assert client.get('/fonts/missing.ttf').status_code==404
        assert client.get('/missing.png').status_code==404
        assert client.get('/%2e%2e/requirements.txt').status_code==404
        partial=client.get('/assets/movie.mp4',headers={'Range':'bytes=2-5'})
        assert partial.status_code==206 and partial.content==b'2345'
        assert partial.headers['content-range']=='bytes 2-5/10'
