const { test } = require('node:test');
const assert = require('node:assert/strict');
const { extractHtml, consumeStream } = require('../static/generation.js');
const html = '<!DOCTYPE html><html><head></head><body><svg></svg><script>const s = "[DONE]"; const t = "```";</script></body></html>';
function reader(text, size = 1) {
    const bytes = new TextEncoder().encode(text);
    let offset = 0;
    return { async read() {
        if (offset === bytes.length) return { done: true };
        const value = bytes.slice(offset, offset += size);
        return { done: false, value };
    }, async cancel() {}, releaseLock() {} };
}
function stream(tokens, ending = 'data: {"event":"[DONE]"}\n\n') {
    return tokens.map(token => `data: ${JSON.stringify({token})}\n\n`).join('') + ending;
}
for (const [name, output] of Object.entries({ raw: html, fenced: 'Plan\n```html\n' + html + '\n```\nSummary', uppercase: '```HTML\n' + html + '\n```', chinese: '说明\n```html\n' + html.replace('<svg>', '<svg>中文') + '\n```' })) {
    test(name + ': token and byte boundaries do not affect HTML', async () => {
        let result = '';
        await consumeStream(reader(stream([...output])), token => result += token);
        assert.equal(extractHtml(result), extractHtml(output));
        assert.ok(extractHtml(result));
    });
}
test('single-token fences and raw HTML are identical', () => {
    assert.equal(extractHtml('```html\n' + html + '\n```'), html);
});
test('reject prose, JSON, fragments, empty and truncated documents', () => {
    for (const text of ['sorry', '{"error":"bad"}', '```js\nalert(1)\n```', '<div>hello</div>', '<html><body></body></html>', '<html><body>   </body></html>', '<html><body><svg></svg></body>']) assert.equal(extractHtml(text), '');
});
test('service error and premature EOF cannot complete generation', async () => {
    await assert.rejects(consumeStream(reader(stream([html], 'data: {"error":"provider failed"}\n\n')), () => {}), /service error/);
    await assert.rejects(consumeStream(reader(stream([html], '')), () => {}), /before completion/);
});
test('malformed events are rejected', async () => {
    for (const payload of ['bad', '{"token":123}']) await assert.rejects(consumeStream(reader('data: ' + payload + '\n\n'), () => {}));
});
test('CRLF and standard DONE marker', async () => {
    let result = '';
    await consumeStream(reader(stream([html], 'data: [DONE]\n\n').replaceAll('\n', '\r\n'), 7), token => result += token);
    assert.equal(result, html);
});
