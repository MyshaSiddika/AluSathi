"""Exercise refresh-token rotation against the isolated local Supabase instance only."""
import concurrent.futures
import json
import subprocess
import urllib.error
import urllib.request
import uuid

output = subprocess.run(['npx.cmd', '--yes', 'supabase', 'status', '--workdir', r'D:\Projects\AluSathi-security-test', '-o', 'env'], capture_output=True, text=True, check=True).stdout
settings = dict(line.split('=', 1) for line in output.splitlines() if '=' in line)
api = settings['API_URL'].strip('"')
assert api == 'http://127.0.0.1:54321', 'Refusing to test a non-local endpoint'
key = settings['ANON_KEY'].strip('"')

def post(path, payload):
    request = urllib.request.Request(api + '/auth/v1/' + path, data=json.dumps(payload).encode(), headers={'apikey': key, 'Content-Type': 'application/json'}, method='POST')
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            return response.status, json.load(response)
    except urllib.error.HTTPError as error:
        return error.code, {}

email = f'security-{uuid.uuid4().hex}@example.invalid'
password = 'Local-only-' + uuid.uuid4().hex
status, user = post('signup', {'email': email, 'password': password})
if not user.get('refresh_token'):
    status, user = post('token?grant_type=password', {'email': email, 'password': password})
assert status == 200 and user.get('refresh_token'), 'Local test sign-in failed'
token = user['refresh_token']
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
    outcomes = list(executor.map(lambda _: post('token?grant_type=refresh_token', {'refresh_token': token}), range(2)))
codes = [status for status, _ in outcomes]
print('Concurrent local refresh HTTP statuses:', codes)
assert codes == [200, 200], 'Concurrent refresh did not succeed for both requests'
for _, response in outcomes:
    assert response.get('refresh_token'), 'A rotated token was missing'
print('Both responses returned the same rotated token:', outcomes[0][1]['refresh_token'] == outcomes[1][1]['refresh_token'])
print('Both responses contained refresh tokens; response ordering and multi-worker behavior still require testing.')
