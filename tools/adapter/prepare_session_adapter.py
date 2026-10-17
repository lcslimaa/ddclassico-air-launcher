"""Build a private startup adapter; preserve the original cached SWF."""
import re
import argparse
import hashlib
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PATHS = json.loads((ROOT / 'config/paths.json').read_text())
ASSETS = ROOT / PATHS['assets']
EVIDENCE = ROOT / PATHS['evidence']
RUNTIME = ROOT / PATHS['runtime']
EXPECTED = '756678cfdd94abc4b7ebe7bdabae9aecd70af5f6befe2c08ac420695ce2966c5'


def adapt(text):
    if text.count('stage.loaderInfo') != 13:
        raise ValueError('Unexpected startup source; review it before adapting.')
    text = text.replace('stage.loaderInfo', 'loaderInfo')
    text = re.sub(r'public var _user:String = "[^"\r\n]*";', 'public var _user:String = "";', text)
    text = re.sub(r'public var _pass:String = "[^"\r\n]*";', 'public var _pass:String = "";', text)
    old = 'this._requestByHttp = loaderInfo.url.indexOf("https:") != -1;'
    new = '''if (!loaderInfo.parameters["user"] || !loaderInfo.parameters["key"] || !loaderInfo.parameters["config"])
         {
            throw new Error("Fresh launch parameters are required; no fallback login is used.");
         }
         this._requestByHttp = String(loaderInfo.parameters["config"]).indexOf("https:") == 0;'''
    if old not in text:
        raise ValueError('Expected HTTPS detection was not found.')
    text = text.replace(old, new)
    text = text.replace('import flash.net.URLRequest;',
                        'import flash.net.URLRequest;\n   import flash.events.HTTPStatusEvent;\n   import flash.utils.getTimer;')
    changes = {
        'LoaderManager.Instance.startLoad(this._configLoader);':
            'trace("[Startup stage] config-request at " + getTimer() + "ms");\n         LoaderManager.Instance.startLoad(this._configLoader);',
        'this._config = _loc4_[0];':
            'this._config = _loc4_[0];\n            trace("[Startup stage] config-parsed at " + getTimer() + "ms");',
        '_loc3_.load(_loc2_);':
            '_loc3_.addEventListener(HTTPStatusEvent.HTTP_STATUS, this.__onCharacterListStatus);\n         trace("[Startup stage] character-list-request at " + getTimer() + "ms");\n         _loc3_.load(_loc2_);',
        'throw new ErrorEvent("SELECTLIST_LOAD_ERROR",true,false,"Load selectList fail! please try again later!");':
            'trace("[Startup stage] character-list-failed at " + getTimer() + "ms");\n         throw new ErrorEvent("SELECTLIST_LOAD_ERROR",true,false,"Load selectList fail! please try again later!");',
        'var _loc8_:XMLList = XML(param1.target.data)..Item;':
            'var _loc8_:XMLList = XML(param1.target.data)..Item;\n         trace("[Startup stage] character-list-complete at " + getTimer() + "ms");',
        '_loc2_ = new RegisterLuncher();':
            'trace("[Startup stage] registration-route at " + getTimer() + "ms");\n            _loc2_ = new RegisterLuncher();',
        '_loc3_ = new RegisterLuncher();':
            'trace("[Startup stage] registration-route at " + getTimer() + "ms");\n            _loc3_ = new RegisterLuncher();',
        'this._luncher = new NormalLuncher();':
            'trace("[Startup stage] existing-character-route at " + getTimer() + "ms");\n         this._luncher = new NormalLuncher();'
    }
    for before, after in changes.items():
        if text.count(before) != 1:
            raise ValueError('Unexpected startup diagnostic insertion point.')
        text = text.replace(before, after)
    marker = 'private function __onloadSelectListError(param1:IOErrorEvent) : void'
    status = '''private function __onCharacterListStatus(event:HTTPStatusEvent) : void
      {
         trace("[Startup status] character-list HTTP " + event.status);
      }

      '''
    return text.replace(marker, status + marker)


def adapt_normal(text):
    text = text.replace('import flash.events.Event;', 'import flash.events.Event;\n   import flash.utils.getTimer;')
    changes = {
        'LoaderManager.Instance.startLoad(this._coreLoader);':
            'trace("[Startup stage] game-module-request at " + getTimer() + "ms");\n         LoaderManager.Instance.startLoad(this._coreLoader);',
        'param1.loader.removeEventListener(LoaderEvent.COMPLETE,this.__onloadCoreComplete);':
            'param1.loader.removeEventListener(LoaderEvent.COMPLETE,this.__onloadCoreComplete);\n         trace("[Startup stage] game-module-loaded at " + getTimer() + "ms");',
        '_loc3_.lunch(this._config,this._user,this._pass,2,this._rid,this._baiduEnterCode,this._clientID);':
            'trace("[Startup stage] game-bootstrap-started at " + getTimer() + "ms");\n         _loc3_.lunch(this._config,this._user,this._pass,2,this._rid,this._baiduEnterCode,this._clientID);',
        'this._startupLoader.Instance.removeEventListener("complete",this.__onStartupComplete);':
            'this._startupLoader.Instance.removeEventListener("complete",this.__onStartupComplete);\n         trace("[Startup stage] startup-resources-complete at " + getTimer() + "ms");'
    }
    for before, after in changes.items():
        if text.count(before) != 1:
            raise ValueError('Unexpected normal-launch diagnostic insertion point.')
        text = text.replace(before, after)
    return text


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--ffdec', type=Path, required=True)
    a = p.parse_args()
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    original = ASSETS / 'swfs/756678cfdd94.swf'
    if hashlib.sha256(original.read_bytes()).hexdigest() != EXPECTED:
        raise ValueError('Original startup SWF hash mismatch')
    source = ASSETS / 'decompiled/756678cfdd94/scripts/DDT_Loading.as'
    out = ASSETS / 'session-adapter'
    out.mkdir(parents=True, exist_ok=True)
    modified = out / 'DDT_Loading.as'
    modified.write_text(adapt(source.read_text()))
    normal = out / 'NormalLuncher.as'
    normal.write_text(adapt_normal((source.parent / 'NormalLuncher.as').read_text()))
    target = out / 'DDT_Loading.air.swf'
    command = ['java', '-Djava.awt.headless=true', '-Duser.home='+str(out/'tool-home'),
               '-jar', str(a.ffdec), '-air', '-replace', str(original), str(target),
               'DDT_Loading', str(modified), 'NormalLuncher', str(normal)]
    with (out/'build.log').open('w') as log:
        result = subprocess.run(command, stdout=log, stderr=subprocess.STDOUT)
    if result.returncode or not target.exists():
        raise SystemExit('Adapter build failed; inspect private/session-adapter/build.log')
    record = {'originalSHA256': EXPECTED, 'adaptedSHA256': hashlib.sha256(target.read_bytes()).hexdigest(),
              'changes': ['Startup reads its own LoaderInfo parameters instead of the host Stage parameters',
                          'HTTPS configuration handling follows the supplied config URL',
                          'Embedded fallback login values removed; missing user/key/config rejected',
                          'Fixed stage/timing diagnostics in DDT_Loading and NormalLuncher; numeric character-list HTTP status only'],
              'limits': 'DDT_Loading parameter adaptation and startup-only diagnostics. Game assets, server login validation, integrity checks and gameplay code unchanged. Full compatibility unverified.'}
    (EVIDENCE/'session-adapter.json').write_text(json.dumps(record, indent=2)+'\n')
    print('Private startup adapter built; original SWF preserved.')


if __name__ == '__main__':
    main()
