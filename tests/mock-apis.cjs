// Mock Attio + Resend for local lead-flow tests. Logs every request to mock-log.jsonl.
const http = require('http');
const fs = require('fs');
const log = require('os').tmpdir() + '/ponenti-mock-log.jsonl';
fs.writeFileSync(log, '');
let n = 0;
http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    n += 1;
    let parsed = null;
    try { parsed = body ? JSON.parse(body) : null; } catch { parsed = body; }
    fs.appendFileSync(log, JSON.stringify({ method: req.method, url: req.url, auth: req.headers.authorization, body: parsed }) + '\n');
    const send = (status, obj) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };
    const u = req.url;
    if (u.startsWith('/v2/objects/companies/records/query')) return send(200, { data: [] });
    if (u.startsWith('/v2/objects/companies/records')) return send(200, { data: { id: { workspace_id: 'w', object_id: 'companies', record_id: 'comp_' + n } } });
    if (u.startsWith('/v2/objects/people/records')) {
      // Simulate a workspace where the custom attributes were not created yet on the first call.
      if (process.env.REJECT_CUSTOM && parsed?.data?.values?.ponenti_language) return send(400, { status_code: 400, type: 'invalid_request_error', code: 'value_not_found', message: 'Cannot find attribute with slug/ID "ponenti_language".' });
      return send(200, { data: { id: { workspace_id: 'w', object_id: 'people', record_id: 'pers_' + n } } });
    }
    if (u.startsWith('/v2/notes')) return send(200, { data: { id: { workspace_id: 'w', note_id: 'note_' + n } } });
    if (u.startsWith('/emails')) return send(200, { id: 'email_' + n });
    send(404, { error: 'unknown ' + u });
  });
}).listen(4010, () => console.log('mock on 4010'));
