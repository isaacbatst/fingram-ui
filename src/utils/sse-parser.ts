export type SSEEvent = {
  event: string;
  data: string;
};

export async function* parseSSE(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): AsyncGenerator<SSEEvent> {
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';

    for (const part of parts) {
      if (!part.trim()) continue;

      let event = 'message';
      let data = '';

      for (const line of part.split('\n')) {
        if (line.startsWith('event: ')) {
          event = line.slice(7);
        } else if (line.startsWith('data: ')) {
          data = line.slice(6);
        }
      }

      if (data) {
        yield { event, data };
      }
    }
  }
}
