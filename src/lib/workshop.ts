// Workshop id is set after auth loads (in AppLayout via setCurrentWorkshopId).
// Hooks call getCurrentWorkshopId() for inserts; SELECTs are scoped by RLS.
let _currentWorkshopId: string | null = null;
const listeners = new Set<(id: string | null) => void>();

export function setCurrentWorkshopId(id: string | null) {
  _currentWorkshopId = id;
  listeners.forEach((fn) => fn(id));
}

export function getCurrentWorkshopId(): string {
  if (!_currentWorkshopId) {
    throw new Error("Oficina não carregada. Faça login novamente.");
  }
  return _currentWorkshopId;
}

export function peekCurrentWorkshopId(): string | null {
  return _currentWorkshopId;
}

export function subscribeWorkshopId(fn: (id: string | null) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}