const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const html = '<html><body><svg><text>中文</text></svg></body></html>';
async function generate(output, ending = {event: '[DONE]'}) {
    const dom = new JSDOM(fs.readFileSync('templates/index.html', 'utf8'), {
        url: 'http://localhost', runScripts: 'outside-only', pretendToBeVisual: true,
    });
    const { window } = dom;
    window.HTMLElement.prototype.scrollTo = () => {};
    window.TextDecoder = TextDecoder;
    window.console = { log() {}, warn() {}, error() {} };
    const frames = [...output].map(token => ({token}));
    if (ending) frames.push(ending);
    const bytes = new TextEncoder().encode(frames.map(data => 'data: ' + JSON.stringify(data) + '\n\n').join(''));
    window.fetch = async () => ({ok: true, body: new ReadableStream({start(controller) {
        // Exercise network boundaries separately from model tokens.
        for (let i = 0; i < bytes.length; i += 7) controller.enqueue(bytes.slice(i, i + 7));
        controller.close();
    }})});
    window.eval(fs.readFileSync('static/generation.js', 'utf8'));
    window.eval(fs.readFileSync(process.env.FOGSIGHT_SCRIPT || 'static/script.js', 'utf8'));
    window.document.dispatchEvent(new window.Event('DOMContentLoaded'));
    window.document.getElementById('initial-input').value = 'test';
    window.document.getElementById('initial-form').dispatchEvent(new window.Event('submit', {cancelable: true}));
    // Allow the async stream to drain without a real server or model.
    await new Promise(resolve => setTimeout(resolve, 100));
    return dom;
}
for (const output of [html, 'Plan\n```html\n' + html + '\n```\nSummary']) {
    test('UI completes, renders extracted HTML, and restores submit button', async () => {
        const dom = await generate(output);
        try {
            const doc = dom.window.document;
            assert.equal(doc.querySelector('.animation-iframe').srcdoc, html);
            assert.equal(doc.querySelector('.code-block code')?.textContent || doc.querySelector('#chat-log code').textContent, html);
            assert.equal(doc.querySelector('.submit-button').disabled, false);
        } finally { dom.window.close(); }
    });
}
for (const [output, ending] of [['sorry', {event: '[DONE]'}], ['<html><body>sorry</body></html>', {event: '[DONE]'}], [html, {error: 'provider failed'}], [html, null]]) {
    test('UI rejects invalid content or failed/incomplete stream', async () => {
        const dom = await generate(output, ending);
        try {
            const doc = dom.window.document;
            assert.equal(doc.querySelector('.animation-iframe'), null);
            assert.equal(doc.querySelector('.submit-button').disabled, false);
            assert.equal(doc.getElementById('warning-box').style.display, 'flex');
            assert.match(doc.getElementById('warning-message').textContent, ending?.event ? /parse|解析/ : /unavailable|不可用/);
        } finally { dom.window.close(); }
    });
}
