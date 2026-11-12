from uuid import uuid4
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from app.main import create_app
from app.models import Participant, Question


@pytest.fixture
def client():
    with TestClient(create_app('sqlite+pysqlite:///:memory:', initialize=True)) as client:
        yield client


def entry(client, nickname='NET', table=None, visitor=None):
    table = table or client.get('/api/tables').json()[0]['id']
    body = {'nickname': nickname, 'visitorId': visitor or str(uuid4()), 'table_id': table}
    response = client.post('/api/participants', json=body)
    assert response.status_code == 201, response.text
    data = response.json()
    return data, {'Authorization': 'Bearer '+data['token']}, body


def post_question(client, session, headers, **changes):
    body = {'visitorId': session['participant']['visitor_id'], 'nickname': session['participant']['nickname'], 'content': '질문입니다', 'target': 'all'}
    body.update(changes)
    return client.post('/api/tables/'+session['participant']['table_id']+'/questions', json=body, headers=headers)


def test_author_snapshot_private_and_token_required(client):
    session, headers, body = entry(client, '  질문자  ')
    result = post_question(client, session, headers)
    assert result.status_code == 201
    assert not any(k.startswith('author') for k in result.json())
    assert post_question(client, session, {}).status_code == 401
    assert post_question(client, session, headers, visitorId=str(uuid4())).status_code == 403
    assert post_question(client, session, headers, nickname='사칭').status_code == 403
    assert client.get('/api/health').json()['database'] == 'ok'
    with client.app.state.engine.connect() as db:
        row = db.execute(select(Question.__table__)).mappings().one()
        assert str(row['author_visitor_id']) == body['visitorId']
        assert row['author_nickname'] == '질문자'
        assert str(row['author_id']) == session['participant']['id']
        token = db.execute(select(Participant.session_token_hash)).scalar_one()
        assert token != session['token'] and len(token) == 64
    listing = client.get('/api/tables/'+body['table_id']+'/questions', headers=headers).json()
    assert len(listing) == 1 and 'author_nickname' not in listing[0]


def test_rename_preserves_ids_and_old_snapshot(client):
    session, headers, body = entry(client, '이전이름')
    assert post_question(client, session, headers).status_code == 201
    changed = client.patch('/api/participants/me/profile', json={'visitorId': body['visitorId'], 'nickname': '  새이름  '}, headers=headers)
    assert changed.status_code == 200
    updated = changed.json()
    for key in ['id', 'visitor_id']:
        assert updated['participant'][key] == session['participant'][key]
    assert updated['token'] == session['token']
    assert updated['participant']['nickname'] == '새이름'
    assert post_question(client, updated, headers).status_code == 201
    assert post_question(client, session, headers).status_code == 403
    assert client.patch('/api/participants/me/profile', json={'visitorId': str(uuid4()), 'nickname': '가짜'}, headers=headers).status_code == 403
    with client.app.state.engine.connect() as db:
        assert db.execute(select(Question.author_nickname).order_by(Question.created_at)).scalars().all() == ['이전이름', '새이름']


@pytest.mark.parametrize('value', ['', '   ', '가'*13, 123, '닉\x00네임'])
def test_bad_nicknames_rejected(client, value):
    table = client.get('/api/tables').json()[0]['id']
    assert client.post('/api/participants', json={'nickname': value, 'visitorId': str(uuid4()), 'table_id': table}).status_code == 422


def test_uuid_table_access_and_same_visitor_is_not_auth(client):
    table = client.get('/api/tables').json()[0]['id']
    assert client.post('/api/participants', json={'nickname': 'NET', 'visitorId': 'wrong', 'table_id': table}).status_code == 422
    session, headers, body = entry(client)
    same, _, _ = entry(client, visitor=body['visitorId'])
    assert same['participant']['id'] != session['participant']['id'] and same['token'] != session['token']
    second = client.get('/api/tables').json()[1]['id']
    assert client.get('/api/tables/'+second+'/questions', headers=headers).status_code == 403
    moved = client.patch('/api/participants/me/table', json={'table_id': second}, headers=headers)
    assert moved.status_code == 200
    assert client.get('/api/tables/'+table+'/questions', headers=headers).status_code == 403
    assert moved.json()['participant']['id'] == session['participant']['id']


def test_draw_idempotency_status_history_anonymity(client):
    session, headers, body = entry(client)
    for content in ['하나', '둘']:
        assert post_question(client, session, headers, content=content).status_code == 201
    url = '/api/tables/'+body['table_id']
    first = client.post(url+'/draw', headers={**headers, 'Idempotency-Key':'same'})
    assert first.status_code == 200
    assert client.post(url+'/draw', headers={**headers, 'Idempotency-Key':'same'}).json() == first.json()
    assert client.get(url+'/status', headers=headers).json()['remaining_count'] == 1
    second = client.post(url+'/draw', headers={**headers, 'Idempotency-Key':'next'})
    assert second.json()['question']['id'] != first.json()['question']['id']
    assert 'author_visitor_id' not in first.json()['question']
    assert len(client.get(url+'/history', headers=headers).json()) == 2
    assert client.get(url+'/draws/latest', headers=headers).json() == second.json()
    assert client.post(url+'/draw', headers={**headers, 'Idempotency-Key':'empty'}).json()['detail']['code'] == 'NO_QUESTIONS_AVAILABLE'
