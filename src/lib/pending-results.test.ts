import { describe, expect, it } from "vitest";
import { flushPending, pendingFor, queuePending, readPending, removePending, type Store } from "./pending-results";

const fakeStore = (): Store & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
};
const prog = [{ id: "a", type: "move" as const }];
const retryable = (e: unknown) => (e as { retryable?: boolean }).retryable === true;
const temp = Object.assign(new Error("sin red"), { retryable: true });
const final = Object.assign(new Error("rechazado"), { retryable: false });

describe("cola de resultados pendientes", () => {
  it("guarda, lee y reemplaza el mismo reto por el más reciente", () => {
    const s = fakeStore();
    queuePending({ userId: "u1", level: 1, challenge: 2, program: prog }, s);
    queuePending({ userId: "u1", level: 1, challenge: 2, program: [...prog, ...prog] }, s);
    queuePending({ userId: "u1", level: 1, challenge: 3, program: prog }, s);
    const list = readPending(s);
    expect(list).toHaveLength(2);
    expect(list.find((p) => p.challenge === 2)?.program).toHaveLength(2);
  });

  it("separa a cada alumno (equipos compartidos)", () => {
    const s = fakeStore();
    queuePending({ userId: "ana", level: 1, challenge: 1, program: prog }, s);
    queuePending({ userId: "luis", level: 1, challenge: 1, program: prog }, s);
    expect(pendingFor("ana", s)).toHaveLength(1);
    removePending({ userId: "ana", level: 1, challenge: 1 }, s);
    expect(pendingFor("ana", s)).toHaveLength(0);
    expect(pendingFor("luis", s)).toHaveLength(1);
  });

  it("soporta almacenamiento roto o vacío sin lanzar errores", () => {
    expect(readPending(null)).toEqual([]);
    const s = fakeStore();
    s.data.set("codekid:pending:v1", "{no es json");
    expect(readPending(s)).toEqual([]);
    expect(() => queuePending({ userId: "u", level: 1, challenge: 1, program: prog }, null)).not.toThrow();
  });

  it("al reintentar con éxito vacía la cola", async () => {
    const s = fakeStore();
    queuePending({ userId: "u1", level: 1, challenge: 1, program: prog }, s);
    queuePending({ userId: "u1", level: 1, challenge: 2, program: prog }, s);
    const sent: number[] = [];
    const n = await flushPending("u1", async (p) => void sent.push(p.challenge), retryable, s);
    expect(n).toBe(2);
    expect(sent.sort()).toEqual([1, 2]);
    expect(pendingFor("u1", s)).toHaveLength(0);
  });

  it("un fallo temporal conserva los resultados y deja de insistir", async () => {
    const s = fakeStore();
    queuePending({ userId: "u1", level: 1, challenge: 1, program: prog }, s);
    queuePending({ userId: "u1", level: 1, challenge: 2, program: prog }, s);
    let intentos = 0;
    const n = await flushPending("u1", async () => { intentos += 1; throw temp; }, retryable, s);
    expect(n).toBe(0);
    expect(intentos).toBe(1);
    expect(pendingFor("u1", s)).toHaveLength(2);
  });

  it("un rechazo definitivo descarta ese resultado y sigue con el resto", async () => {
    const s = fakeStore();
    queuePending({ userId: "u1", level: 1, challenge: 1, program: prog }, s);
    queuePending({ userId: "u1", level: 1, challenge: 2, program: prog }, s);
    const n = await flushPending("u1", async (p) => { if (p.challenge === 1) throw final; }, retryable, s);
    expect(n).toBe(1);
    expect(pendingFor("u1", s)).toHaveLength(0);
  });
});
