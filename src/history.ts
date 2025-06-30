export interface HistoryMessage {
  author: "user" | "bot";
  content: string;
}

const maxHistoryLength = 20;

async function getKv() {
  return await Deno.openKv();
}

export async function loadHistory(userId: string): Promise<HistoryMessage[]> {
  const kv = await getKv();
  const result = await kv.get<HistoryMessage[]>(["history", userId]);
  kv.close();
  if (result.value) {
      if (result.value.length > maxHistoryLength) {
          return result.value.slice(result.value.length - maxHistoryLength);
      }
      return result.value;
  }
  return [];
}

export async function saveHistory(userId: string, history: HistoryMessage[]) {
  const kv = await getKv();
  const trimmedHistory = history.slice(-maxHistoryLength);
  await kv.set(["history", userId], trimmedHistory);
  kv.close();
}
