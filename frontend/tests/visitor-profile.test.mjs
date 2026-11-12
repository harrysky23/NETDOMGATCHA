import test, { beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { bootstrapVisitor, saveVisitorNickname, readVisitorProfile, normalizeNickname, VISITOR_ID_KEY, VISITOR_PROFILE_KEY } from '../src/services/visitorProfile.ts'
let values
beforeEach(()=>{
  values=new Map()
  Object.defineProperty(globalThis,'localStorage',{ configurable:true, value:{
    getItem:key=>values.get(key)??null, setItem:(key,value)=>values.set(key,value),
  }})
})

test('첫 방문/StrictMode 재실행/닉네임 변경/재방문에서 UUID를 한 번만 생성', t=>{
  const original=crypto.randomUUID.bind(crypto)
  const uuid=t.mock.method(crypto,'randomUUID',original)
  const first=bootstrapVisitor()
  assert.equal(first.profile,null)
  assert.equal(bootstrapVisitor().visitorId,first.visitorId)
  assert.deepEqual(saveVisitorNickname('  처음  '),{visitorId:first.visitorId,nickname:'처음'})
  assert.equal(saveVisitorNickname('나중').visitorId,first.visitorId)
  assert.equal(bootstrapVisitor().profile.nickname,'나중')
  assert.equal(uuid.mock.callCount(),1)
})

test('손상/누락/다른 UUID 프로필은 자동 입장하지 않고 기존의 유효 UUID는 보존', ()=>{
  const id=bootstrapVisitor().visitorId
  values.set(VISITOR_PROFILE_KEY,'{broken')
  assert.equal(bootstrapVisitor().profile,null)
  values.set(VISITOR_PROFILE_KEY,JSON.stringify({visitorId:id,nickname:'   '}))
  assert.equal(readVisitorProfile(),null)
  assert.equal(bootstrapVisitor().visitorId,id)
  values.set(VISITOR_PROFILE_KEY,JSON.stringify({visitorId:crypto.randomUUID(),nickname:'다른사람'}))
  assert.equal(bootstrapVisitor().profile,null)
  assert.equal(bootstrapVisitor().visitorId,id)
})

test('기존 프로필만 남은 경우 UUID를 재발급하지 않고 복원', ()=>{
  const profile=saveVisitorNickname('복원')
  values.delete(VISITOR_ID_KEY)
  assert.deepEqual(bootstrapVisitor().profile,profile)
})

test('공백·12자·이모지·빈 문자열·제어 문자 경계 검증', ()=>{
  assert.equal(normalizeNickname('  NET  '),'NET')
  assert.equal(normalizeNickname('🎉'.repeat(12)),'🎉'.repeat(12))
  for (const value of ['', '   ', '가'.repeat(13), 'a\nb'])
    assert.throws(()=>normalizeNickname(value),e=>e.code==='VALIDATION_ERROR')
})

test('저장소가 막히면 온보딩을 완료한 것으로 처리하지 않음', ()=>{
  localStorage.setItem=()=>{throw Error('blocked')}
  assert.throws(()=>saveVisitorNickname('NET'),e=>e.code==='STORAGE_UNAVAILABLE')
  assert.equal(readVisitorProfile(),null)
})
