import asyncio
import unittest
from unittest.mock import patch
from fastapi import HTTPException, Request
from ml.auth import auth_action, session_response

def request(body=b'{}', origin='http://127.0.0.1:4173', cookie=None):
    headers=[(b'origin',origin.encode()),(b'x-alusathi-request',b'1'),(b'content-type',b'application/json')]
    if cookie: headers.append((b'cookie',f'alusathi_refresh={cookie}'.encode()))
    async def receive(): return {'type':'http.request','body':body,'more_body':False}
    return Request({'type':'http','client':('auth-test',1),'headers':headers},receive)

class AuthSafety(unittest.TestCase):
    def test_cross_origin_denied(self):
        with self.assertRaises(HTTPException) as caught: asyncio.run(auth_action('signin',request(origin='https://evil.example')))
        self.assertEqual(caught.exception.status_code,403)
    def test_no_cookie_returns_guest(self):
        self.assertIsNone(asyncio.run(auth_action('session',request()))['user'])
    def test_cookie_is_not_exposed_in_body(self):
        response=session_response({'refresh_token':'secret','access_token':'short-lived'},request(origin='https://alusathi.example'))
        cookie=response.headers['set-cookie']
        self.assertIn('HttpOnly',cookie);self.assertIn('Secure',cookie);self.assertIn('SameSite=strict',cookie)
        self.assertNotIn(b'secret',response.body)
    def test_invalid_refresh_clears_cookie(self):
        with patch('ml.auth.call',side_effect=HTTPException(400,'auth_failed')):
            response=asyncio.run(auth_action('session',request(cookie='expired')))
        self.assertIn('Max-Age=0',response.headers['set-cookie'])
    def test_oversized_request_rejected(self):
        with self.assertRaises(HTTPException) as caught: asyncio.run(auth_action('signin',request(b' '*4097)))
        self.assertEqual(caught.exception.status_code,413)
    def test_weak_password_rejected(self):
        with self.assertRaises(HTTPException) as caught: asyncio.run(auth_action('signup',request(b'{"email":"x@example.invalid","password":"123"}')))
        self.assertEqual(caught.exception.status_code,400)
    def test_signup_confirmation_returns_to_account(self):
        body = b'{"email":"x@example.invalid","password":"password123","name":"Farmer"}'
        with patch('ml.auth.call', return_value={}) as send:
            asyncio.run(auth_action('signup', request(body)))
        self.assertIn('%2Faccount', send.call_args.args[0])

if __name__=='__main__': unittest.main()
