import asyncio
import io
import json
import threading
import unittest
import urllib.error
from unittest.mock import patch

from fastapi import HTTPException, Request
from ml import marketplace


class MarketplaceSafety(unittest.TestCase):
    @unittest.expectedFailure
    def test_simultaneous_requests_survive_refresh_rotation(self):
        lock = threading.Lock()
        consumed = set()
        def refresh(_path, data):
            with lock:
                if data['refresh_token'] in consumed:
                    raise HTTPException(400, 'auth_failed')
                consumed.add(data['refresh_token'])
            return {'user': {'id': 'u'}, 'access_token': 'a', 'refresh_token': 'new'}
        async def both():
            requests = [Request({'type': 'http', 'headers': [(b'cookie', b'alusathi_refresh=old')]}) for _ in range(2)]
            return await asyncio.gather(*(marketplace.current_user(r) for r in requests), return_exceptions=True)
        with patch.object(marketplace, 'call', side_effect=refresh):
            results = asyncio.run(both())
        self.assertTrue(all(not isinstance(result, BaseException) for result in results))

    def test_listing_rejects_untrusted_image_url(self):
        request = Request({"type": "http", "headers": []})
        data = {"photos": ["https://attacker.invalid/image.jpg"]}
        with patch.object(marketplace, "guard", return_value=data), patch.object(marketplace, "current_user", return_value=({"id": "u"}, "token")):
            with self.assertRaises(HTTPException) as caught:
                asyncio.run(marketplace.publish_lot(request))
        self.assertEqual(caught.exception.status_code, 400)

    def test_listing_rejects_invalid_calendar_date(self):
        request = Request({"type": "http", "headers": []})
        data = {"variety": "Potato", "quantityKg": 100, "district": "Rangpur", "readyDate": "2026-02-30"}
        with patch.object(marketplace, "guard", return_value=data), patch.object(marketplace, "current_user", return_value=({"id": "u"}, "token")):
            with self.assertRaises(HTTPException) as caught:
                asyncio.run(marketplace.publish_lot(request))
        self.assertEqual(caught.exception.status_code, 400)

    def test_rotated_refresh_is_preserved(self):
        request = Request({"type": "http", "headers": [(b"cookie", b"alusathi_refresh=old")]})
        with patch.object(marketplace, "call", return_value={"user": {"id": "u"}, "access_token": "a", "refresh_token": "new"}):
            asyncio.run(marketplace.current_user(request))
        self.assertEqual(request.state.market_refresh_token, "new")

    def test_refresh_without_replacement_fails_closed(self):
        request = Request({"type": "http", "headers": [(b"cookie", b"alusathi_refresh=old")]})
        with patch.object(marketplace, "call", return_value={"user": {"id": "u"}, "access_token": "a"}):
            with self.assertRaises(HTTPException):
                asyncio.run(marketplace.current_user(request))

    def test_postgrest_conflict_is_not_generic_error(self):
        error = urllib.error.HTTPError("https://example.invalid", 400, "error", {}, io.BytesIO(json.dumps({"code": "40001"}).encode()))
        with patch.object(marketplace, "URL", "https://example.invalid"), patch.object(marketplace, "KEY", "x"), patch("urllib.request.urlopen", side_effect=error):
            with self.assertRaises(HTTPException) as caught:
                marketplace.api("rpc/test")
        self.assertEqual(caught.exception.status_code, 409)

    def test_stale_offer_is_conflict(self):
        error = urllib.error.HTTPError("https://example.invalid", 400, "error", {}, io.BytesIO(json.dumps({"code": "P0001", "message": "stale offer"}).encode()))
        with patch.object(marketplace, "URL", "https://example.invalid"), patch.object(marketplace, "KEY", "x"), patch("urllib.request.urlopen", side_effect=error):
            with self.assertRaises(HTTPException) as caught:
                marketplace.api("rpc/test")
        self.assertEqual(caught.exception.status_code, 409)


if __name__ == "__main__":
    unittest.main()
