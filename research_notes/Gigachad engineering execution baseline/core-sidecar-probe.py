import json, runpy, socket, threading, urllib.request, time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
module=runpy.run_path(str(ROOT/'laya_sidecar.py'),run_name='gigachad_probe')
server=module['ThreadingHTTPServer'](('127.0.0.1',0), module['SidecarHandler'])
thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
port=server.server_port
result={'port':port,'optional_models_loaded':False,'cloud_calls':False}
raw=socket.create_connection(('127.0.0.1',port),timeout=1);raw.settimeout(.5)
try:
 raw.sendall(b'POST /ner_pii HTTP/1.1\r\nHost: 127.0.0.1\r\nContent-Length: 2000001\r\n\r\n')
 start=time.monotonic()
 try: result['oversize_without_body_response']=raw.recv(1024).decode(errors='replace')
 except socket.timeout: result['oversize_without_body_response']='timed out after 0.5 seconds without 413'
 result['elapsed_seconds']=round(time.monotonic()-start,3)
 body=json.dumps({'text':'Contact fixture@example.test'}).encode()
 req=urllib.request.Request(f'http://127.0.0.1:{port}/ner_pii',data=body,headers={'Content-Type':'text/plain','Origin':'https://fixture.example.test'})
 with urllib.request.urlopen(req,timeout=2) as res:
  answer=json.load(res);result['cross_origin_text_plain_status']=res.status;result['pii_redacted_count']=answer.get('pii_redacted_count')
finally:
 raw.shutdown(socket.SHUT_WR)
 try: raw.recv(4096)
 except Exception: pass
 raw.close();server.shutdown();server.server_close();thread.join(timeout=2)
print(json.dumps(result,indent=2))
