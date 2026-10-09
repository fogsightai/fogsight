"""Offline regression tests; never read real credentials or call a provider."""
import asyncio
import importlib
import io
import json
import unittest
from types import SimpleNamespace as NS
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

real_open = open

def fake_open(path, *args, **kwargs):
    if path == 'credentials.json':
        return io.StringIO(json.dumps({'API_KEY': 'sk-test', 'BASE_URL': 'https://example.invalid/v1'}))
    return real_open(path, *args, **kwargs)

with patch('builtins.open', side_effect=fake_open), patch('openai.AsyncOpenAI'):
    app = importlib.import_module('app')

HTML = '<html><body><svg></svg></body></html>'

class StreamTests(unittest.IsolatedAsyncioTestCase):
    def provider(self, chunks, error=None):
        async def response():
            for chunk in chunks:
                yield chunk
            if error:
                raise error
        return NS(chat=NS(completions=NS(create=AsyncMock(return_value=response()))))

    async def collect(self, client):
        with patch.object(app, 'client', client):
            return [json.loads(frame[6:]) async for frame in app.llm_event_stream('test')]

    async def test_metadata_and_content(self):
        result = await self.collect(self.provider([
            NS(), NS(choices=[]), NS(choices=[NS()]),
            NS(choices=[NS(delta=NS(content=None))]),
            NS(choices=[NS(delta=NS(content=HTML))]),
        ]))
        self.assertEqual(result, [{'token': HTML}, {'event': '[DONE]'}])

    async def test_iteration_error(self):
        result = await self.collect(self.provider([NS(choices=[NS(delta=NS(content=HTML))])], RuntimeError('broken stream')))
        self.assertEqual(result[-1], {'error': 'broken stream'})
        self.assertFalse(any('event' in frame for frame in result))

    async def test_provider_error_chunk(self):
        result = await self.collect(self.provider([NS(error={"message": "provider failed"})]))
        self.assertIn('provider failed', result[0]['error'])
        self.assertEqual(len(result), 1)

    async def test_invalid_content(self):
        result = await self.collect(self.provider([NS(choices=[NS(delta=NS(content=['invalid']))])]))
        self.assertIn('error', result[0])

    async def test_creation_error(self):
        client = self.provider([])
        client.chat.completions.create.side_effect = app.OpenAIError('bad request')
        self.assertEqual(await self.collect(client), [{'error': 'bad request'}])

    async def test_gemini_chunks(self):
        provider = NS(models=NS(generate_content=lambda **kwargs: NS(text=HTML)))
        with patch.object(app, 'USE_GEMINI', True), patch.object(app, 'gemini_client', provider, create=True):
            result = [json.loads(frame[6:]) async for frame in app.llm_event_stream('test')]
        self.assertEqual(result, [{'token': HTML}, {'event': '[DONE]'}])

    async def test_gemini_error(self):
        provider = NS(models=NS(generate_content=lambda **kwargs: NS(text=None)))
        with patch.object(app, 'USE_GEMINI', True), patch.object(app, 'gemini_client', provider, create=True):
            result = [json.loads(frame[6:]) async for frame in app.llm_event_stream('test')]
        self.assertIn('error', result[0])
        self.assertEqual(len(result), 1)

    async def test_route_success_and_error(self):
        for error in [None, RuntimeError('provider interrupted')]:
            with patch.object(app, 'client', self.provider([NS(choices=[NS(delta=NS(content=HTML))])], error)):
                with TestClient(app.app) as client:
                    response = client.post('/generate', json={'topic': 'test'})
            self.assertEqual(response.status_code, 200)
            self.assertIn('text/event-stream', response.headers['content-type'])
            self.assertIn(HTML, response.text)
            self.assertEqual('[DONE]' in response.text, error is None)
            self.assertEqual('"error"' in response.text, error is not None)
