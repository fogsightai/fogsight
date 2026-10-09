/* Shared stream/format handling; no dependence on model token boundaries. */
(function (root) {
    function extractHtml(text) {
        // Require an explicit, complete document: DOMParser repairs plain text and
        // truncated markup, so a nonempty parsed body alone is not validation.
        const match = text.match(/^[ \t]*(?:<!doctype\s+html\s*>\s*)?<html\b[^>]*>[\s\S]*?<\/html\s*>/im);
        if (!match) return '';
        const html = match[0];
        if (!/<body\b[^>]*>[\s\S]*\S[\s\S]*<\/body\s*>/i.test(html)) return '';
        return html;
    }

    async function consumeStream(reader, onToken) {
        const decoder = new TextDecoder();
        let buffer = '';
        try {
            while (true) {
                const { done, value } = await reader.read();
                buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
                let boundary;
                while ((boundary = /\r?\n\r?\n/.exec(buffer))) {
                    const frame = buffer.slice(0, boundary.index);
                    buffer = buffer.slice(boundary.index + boundary[0].length);
                    const payload = frame.split(/\r?\n/)
                        .filter(line => line.startsWith('data:'))
                        .map(line => line.slice(5).replace(/^ /, '')).join('\n');
                    if (!payload) continue;
                    const data = payload === '[DONE]' ? { event: '[DONE]' } : JSON.parse(payload);
                    if (data.error) throw new Error('LLM service error: ' + data.error);
                    if (data.event === '[DONE]') return;
                    if (data.token !== undefined && typeof data.token !== 'string') {
                        throw new Error('Invalid SSE token');
                    }
                    if (data.token) onToken(data.token);
                }
                if (done) throw new Error('Generation stream ended before completion');
            }
        } finally {
            try { await reader.cancel(); } finally { reader.releaseLock(); }
        }
    }
    const api = { extractHtml, consumeStream };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.FogsightGeneration = api;
})(globalThis);
