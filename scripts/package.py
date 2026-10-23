"""Build a store upload ZIP using only an explicit runtime allowlist."""
import hashlib
import json
from pathlib import Path
import zipfile

root = Path(__file__).resolve().parent.parent
manifest = json.loads((root / "manifest.json").read_text())
files = {
    "manifest.json", "LICENSE", "content.css", "content.js", "settings.js",
    "popup.html", "popup.css", "popup.js",
    *manifest["icons"].values(),
}
referenced = {
    manifest["action"]["default_popup"],
    *manifest["action"]["default_icon"].values(),
    *(name for script in manifest["content_scripts"] for key in ("js", "css") for name in script[key]),
}
assert referenced <= files, "Runtime file missing from packaging allowlist"
out = root / "dist"
out.mkdir(exist_ok=True)
archive = out / f'enhance-x-{manifest["version"]}.zip'
with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as bundle:
    for name in sorted(files):
        info = zipfile.ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        bundle.writestr(info, (root / name).read_bytes())
with zipfile.ZipFile(archive) as bundle:
    assert bundle.testzip() is None
    assert set(bundle.namelist()) == files
digest = hashlib.sha256(archive.read_bytes()).hexdigest()
(out / (archive.name + ".sha256")).write_text(f"{digest}  {archive.name}\n")
print(f"{archive.relative_to(root)} ({archive.stat().st_size:,} bytes)")
print(f"SHA256 {digest}")
