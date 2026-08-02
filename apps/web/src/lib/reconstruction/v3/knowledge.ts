export type BranchEpistemicState = 'KNOWN' | 'BELIEVED' | 'SUSPECTED' | 'REJECTED' | 'OUTDATED'
export type TransferReliability = 'trusted' | 'unverified' | 'deceptive' | 'unknown'

export interface BranchKnowledgeRecord {
  factId: string
  state: BranchEpistemicState
  confidence: number
  acquiredAtDecisionId: string
  sourceCharacterId: string | null
  transmissionPath: readonly string[]
}

export interface BranchKnowledgeState {
  byObserver: Record<string, Record<string, BranchKnowledgeRecord>>
}

export interface BranchInformationTransfer {
  id: string
  senderId: string
  receiverIds: readonly string[]
  factId: string
  reliability: TransferReliability
  deceptive: boolean
}

export interface KnowledgePropagationResult {
  state: BranchKnowledgeState
  traces: KnowledgeTransferTrace[]
}

export interface KnowledgeTransferTrace {
  transferId: string
  receiverId: string
  status: 'received' | 'blocked'
  reason: string
  record: BranchKnowledgeRecord | null
}

export function propagateKnowledge(
  previous: BranchKnowledgeState,
  transfer: BranchInformationTransfer,
): KnowledgePropagationResult {
  const state = cloneKnowledge(previous)
  const senderRecord = previous.byObserver[transfer.senderId]?.[transfer.factId]
  if (!transfer.deceptive && (!senderRecord || senderRecord.state === 'REJECTED')) {
    return {
      state,
      traces: transfer.receiverIds.map((receiverId) => ({
        transferId: transfer.id,
        receiverId,
        status: 'blocked',
        reason: `${transfer.senderId} cannot truthfully transmit unknown fact ${transfer.factId}`,
        record: null,
      })),
    }
  }

  const traces: KnowledgeTransferTrace[] = []
  for (const receiverId of [...new Set(transfer.receiverIds)]) {
    const confidence = transmittedConfidence(senderRecord?.confidence ?? 1, transfer.reliability)
    const record: BranchKnowledgeRecord = {
      factId: transfer.factId,
      state: transfer.deceptive
        ? 'BELIEVED'
        : confidence >= 0.75
          ? 'KNOWN'
          : confidence >= 0.4
            ? 'BELIEVED'
            : 'SUSPECTED',
      confidence,
      acquiredAtDecisionId: transfer.id,
      sourceCharacterId: transfer.senderId,
      transmissionPath: [...(senderRecord?.transmissionPath ?? [transfer.senderId]), receiverId],
    }
    const observer = state.byObserver[receiverId] ?? {}
    observer[transfer.factId] = strongerRecord(observer[transfer.factId], record)
    state.byObserver[receiverId] = observer
    traces.push({
      transferId: transfer.id,
      receiverId,
      status: 'received',
      reason: transfer.deceptive
        ? `${receiverId} received a deceptive claim from ${transfer.senderId}`
        : `${receiverId} received ${transfer.factId} with ${Math.round(confidence * 100)}% confidence`,
      record: observer[transfer.factId],
    })
  }
  return { state, traces }
}

export function markKnowledgeOutdated(
  previous: BranchKnowledgeState,
  factId: string,
): BranchKnowledgeState {
  const state = cloneKnowledge(previous)
  for (const records of Object.values(state.byObserver)) {
    const record = records[factId]
    if (record && record.state !== 'REJECTED') records[factId] = { ...record, state: 'OUTDATED' }
  }
  return state
}

function transmittedConfidence(source: number, reliability: TransferReliability): number {
  const factor = { trusted: 1, unverified: 0.65, deceptive: 0.55, unknown: 0.35 }[reliability]
  return Math.max(0, Math.min(1, source * factor))
}

function strongerRecord(
  current: BranchKnowledgeRecord | undefined,
  incoming: BranchKnowledgeRecord,
): BranchKnowledgeRecord {
  if (!current || incoming.confidence >= current.confidence || current.state === 'OUTDATED') {
    return incoming
  }
  return current
}

function cloneKnowledge(value: BranchKnowledgeState): BranchKnowledgeState {
  return {
    byObserver: Object.fromEntries(
      Object.entries(value.byObserver).map(([observer, records]) => [
        observer,
        Object.fromEntries(
          Object.entries(records).map(([fact, record]) => [
            fact,
            { ...record, transmissionPath: [...record.transmissionPath] },
          ]),
        ),
      ]),
    ),
  }
}
