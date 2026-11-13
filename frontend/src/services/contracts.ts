import type {
  DrawResult,
  EventTable,
  ParticipantSession,
  Question,
  SubmitQuestionInput,
  TableStatus,
  TableMember,
  VisitorProfile,
} from '../types'

/** Phase 2 HTTP 어댑터도 이 인터페이스를 구현합니다. 토큰 검증은 서버 책임입니다. */
export interface NetApi {
  listTables(): Promise<EventTable[]>
  createTable(name?: string): Promise<EventTable>
  renameTable(tableId: string, name: string): Promise<EventTable>
  listParticipants(
    session: ParticipantSession,
    tableId: string,
  ): Promise<TableMember[]>
  getParticipant(session: ParticipantSession): Promise<ParticipantSession>
  createParticipant(
    input: VisitorProfile & { table_id: string },
  ): Promise<ParticipantSession>
  updateParticipantProfile(
    session: ParticipantSession,
    profile: VisitorProfile,
  ): Promise<ParticipantSession>
  changeTable(
    session: ParticipantSession,
    tableId: string,
  ): Promise<ParticipantSession>
  getStatus(session: ParticipantSession, tableId: string): Promise<TableStatus>
  submitQuestion(
    session: ParticipantSession,
    tableId: string,
    input: SubmitQuestionInput,
  ): Promise<Question>
  listQuestions(
    session: ParticipantSession,
    tableId: string,
  ): Promise<Question[]>
  draw(
    session: ParticipantSession,
    tableId: string,
    idempotencyKey: string,
  ): Promise<DrawResult>
  getHistory(
    session: ParticipantSession,
    tableId: string,
  ): Promise<DrawResult[]>
  getLatestDraw(
    session: ParticipantSession,
    tableId: string,
  ): Promise<DrawResult | null>
}
