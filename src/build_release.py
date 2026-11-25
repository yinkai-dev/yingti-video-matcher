"""Build one portable HTML containing the app, all videos, and a source download."""
import base64
import io
import json
import mimetypes
import re
import zipfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'

def project_zip():
    out=io.BytesIO()
    files=[ROOT/'README.md']
    for name in ('dist','research','src'):
        files.extend(sorted(p for p in (ROOT/name).rglob('*') if p.is_file() and
                            p.name not in ('project.zip','.DS_Store') and '__pycache__' not in p.parts))
    with zipfile.ZipFile(out,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
        for path in files:
            data=path.read_bytes()
            if path==DIST/'index.html':
                data=data.replace(b'data-package="yes"',b'data-package="no"')
            info=zipfile.ZipInfo('demo/'+path.relative_to(ROOT).as_posix(),(2026,11,25,0,0,0))
            info.compress_type=zipfile.ZIP_DEFLATED
            z.writestr(info,data)
    return out.getvalue()

def build():
    archive=project_zip()
    (DIST/'project.zip').write_bytes(archive)
    paths=sorted((DIST/'media').iterdir())+[DIST/'project.zip']
    assets={}
    for p in paths:
        mime=mimetypes.guess_type(p.name)[0] or 'application/octet-stream'
        assets[p.relative_to(DIST).as_posix()]=[mime,base64.b64encode(p.read_bytes()).decode('ascii')]
    html=(DIST/'index.html').read_text()
    css=(DIST/'style.css').read_text()
    html=html.replace('<link rel="stylesheet" href="style.css">','<style>'+css+'</style>')
    inject='<script>globalThis.YT_ASSETS='+json.dumps(assets,separators=(',',':'))+';</script>'
    html=html.replace('<script src="corpus.js">',inject+'<script src="corpus.js">',1)
    def inline(m):
        js=(DIST/m[1]).read_text().replace('</script','<\\/script')
        return '<script>'+js+'</script>'
    html=re.sub(r'<script src="([\w.-]+)"></script>',inline,html)
    dst=ROOT.parent/'映题Demo.html'
    dst.write_text(html)
    print(dst, dst.stat().st_size)
if __name__=='__main__':build()
