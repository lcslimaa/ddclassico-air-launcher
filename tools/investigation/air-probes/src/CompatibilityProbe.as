package {
    import flash.display.Loader;
    import flash.display.Sprite;
    import flash.display.StageAlign;
    import flash.display.StageScaleMode;
    import flash.desktop.NativeApplication;
    import flash.events.Event;
    import flash.events.ErrorEvent;
    import flash.events.IOErrorEvent;
    import flash.events.SecurityErrorEvent;
    import flash.events.ProgressEvent;
    import flash.events.HTTPStatusEvent;
    import flash.events.TimerEvent;
    import flash.events.UncaughtErrorEvent;
    import flash.filesystem.File;
    import flash.filesystem.FileMode;
    import flash.filesystem.FileStream;
    import flash.net.URLRequest;
    import flash.system.LoaderContext;
    import flash.text.TextField;
    import flash.text.TextFormat;
    import flash.utils.Timer;

    [SWF(width="1000", height="600", frameRate="60", backgroundColor="#20242a")]
    public class CompatibilityProbe extends Sprite {
        private var game:Loader = new Loader();
        private var status:TextField = new TextField();
        private var messages:Array = [];
        private var watchdog:Timer = new Timer(15000, 1);
        private var entryLoaded:Boolean = false;

        public function CompatibilityProbe() {
            note("ActionScript constructor executed.");
            if (stage) start();
            else addEventListener(Event.ADDED_TO_STAGE, start);
        }

        private function start(event:Event = null):void {
            removeEventListener(Event.ADDED_TO_STAGE, start);
            stage.align = StageAlign.TOP_LEFT;
            stage.scaleMode = StageScaleMode.NO_SCALE;
            status.defaultTextFormat = new TextFormat("_sans", 16, 0xffffff);
            status.width = 960;
            status.height = 220;
            status.x = 20;
            status.y = 20;
            status.multiline = true;
            status.wordWrap = true;
            status.background = true;
            status.backgroundColor = 0x20242a;
            status.border = true;
            status.borderColor = 0x8193a6;
            status.mouseEnabled = false;
            addChild(game);
            addChild(status);
            addEventListener(Event.ENTER_FRAME, keepDiagnosticsVisible);
            loaderInfo.uncaughtErrorEvents.addEventListener(UncaughtErrorEvent.UNCAUGHT_ERROR, uncaught);
            // Child uncaught errors bubble to this SWF's LoaderInfo listener.
            // Registering on both objects would report the same error twice.
            note("Probe started. Diagnostic log is in AIR application storage; Terminal output is also captured.");
            var stream:FileStream = new FileStream();
            var config:Object;
            var packagedEntry:Boolean = NativeApplication.nativeApplication.applicationID.indexOf(".localentry") >= 0;
            try {
                stream.open(File.applicationDirectory.resolvePath(packagedEntry ? "config.local-entry.json" : "config.local.json"), FileMode.READ);
                config = JSON.parse(stream.readUTFBytes(stream.bytesAvailable));
                stream.close();
                if (packagedEntry && File.applicationDirectory.resolvePath("config.xml").exists) {
                    note("Local stage-access check refused: config.xml exists. This isolation test must not have server configuration.");
                    return;
                }
                if (!config || (!packagedEntry && (!(config.swfUrl is String) || !/^https:\/\/[^\s]+$/i.test(config.swfUrl)))) {
                    note("Configuration requires an observed HTTPS SWF URL.");
                    return;
                }
                if (config.parameters != null && (!(config.parameters is Object) || config.parameters is Array)) {
                    note("Configuration parameters must be an object.");
                    return;
                }
                var parameters:Object = config.parameters || {};
                for (var parameter:String in parameters) {
                    if (!(parameters[parameter] is String)) {
                        note("Every startup parameter must be a string.");
                        return;
                    }
                }
                note("Configured child parameter count: " + countKeys(parameters) + ". No browser session has been transferred.");
                try {
                    note("Host stage parameter count: " + countKeys(stage.loaderInfo.parameters));
                } catch (stageInfoError:Error) {
                    note("Host stage LoaderInfo unavailable. Error ID: " + stageInfoError.errorID);
                }
            } catch (error:Error) {
                try { stream.close(); } catch (ignored:Error) {}
                note("Configuration unavailable or invalid. Error ID: " + error.errorID);
                return;
            }
            game.contentLoaderInfo.addEventListener(ProgressEvent.PROGRESS, progress);
            game.contentLoaderInfo.addEventListener(Event.COMPLETE, loaded);
            game.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR, ioError);
            game.contentLoaderInfo.addEventListener(SecurityErrorEvent.SECURITY_ERROR, securityError);
            game.contentLoaderInfo.addEventListener(HTTPStatusEvent.HTTP_STATUS, httpStatus);
            var context:LoaderContext = new LoaderContext();
            context.parameters = config.parameters || {};
            // These are child LoaderInfo parameters, not stage.loaderInfo parameters.
            // The recovered DDClassico loaders read stage.loaderInfo; this probe
            // intentionally exposes that unresolved compatibility boundary.
            // Normal remote load preserves the original SWF URL and remote sandbox.
            // No importing into the AIR application sandbox and no cookie copying.
            note(packagedEntry ? "Loading packaged startup SWF. No login values or server configuration supplied."
                               : "Loading remote SWF. Browser login cookies are not transferred.");
            if (packagedEntry) note("config.xml is intentionally absent; a configuration load failure is expected after stage access.");
            watchdog.addEventListener(TimerEvent.TIMER_COMPLETE, loadingTimeout);
            watchdog.start();
            var entryURL:String = packagedEntry ? File.applicationDirectory.resolvePath("Loading.local.swf").url : config.swfUrl;
            try { game.load(new URLRequest(entryURL), context); }
            catch (loadError:Error) { note("Load rejected. Error ID: " + loadError.errorID); }
        }

        private function note(message:String):void {
            status.visible = true;
            messages.push(message);
            if (messages.length > 9) messages.shift();
            status.text = messages.join("\n");
            trace("[AIR probe] " + message);
            var log:FileStream = new FileStream();
            try {
                File.applicationStorageDirectory.createDirectory();
                log.open(File.applicationStorageDirectory.resolvePath("probe-diagnostics.log"), FileMode.APPEND);
                log.writeUTFBytes(JSON.stringify({time: new Date().time, message: message}) + "\n");
                log.close();
            } catch (logError:Error) {
                try { log.close(); } catch (ignored:Error) {}
                trace("[AIR probe] Diagnostic log could not be written. Error ID: " + logError.errorID);
            }
        }
        private function progress(event:ProgressEvent):void {
            status.text = messages.join("\n") + "\nDownloaded " + event.bytesLoaded + " / " + event.bytesTotal + " bytes";
        }
        private function loaded(event:Event):void {
            entryLoaded = true;
            note("Entry SWF load complete. This does not establish game startup or authentication.");
            note("Root-stage parameters/URLs remain unresolved. Keep this log for investigation.");
        }
        private function httpStatus(event:HTTPStatusEvent):void { note("Entry SWF HTTP status: " + event.status); }
        private function loadingTimeout(event:TimerEvent):void {
            note(entryLoaded ? "15-second observation: entry loaded; gameplay remains unverified."
                             : "15-second observation: entry SWF has not finished loading.");
        }
        private function keepDiagnosticsVisible(event:Event):void {
            if (!contains(status)) addChild(status);
            if (getChildIndex(status) != numChildren - 1) setChildIndex(status, numChildren - 1);
        }
        private function countKeys(value:Object):int {
            var count:int = 0;
            for (var key:String in value) count++;
            return count;
        }
        private function ioError(event:IOErrorEvent):void { note("Network/load error ID: " + event.errorID); }
        private function securityError(event:SecurityErrorEvent):void { note("Sandbox error ID: " + event.errorID); }
        private function uncaught(event:UncaughtErrorEvent):void {
            event.preventDefault();
            var error:Error = event.error as Error;
            var errorEvent:ErrorEvent = event.error as ErrorEvent;
            var id:String = error ? String(error.errorID) : errorEvent ? String(errorEvent.errorID) : "unknown";
            var kind:String = error ? "Error" : errorEvent ? "ErrorEvent" : "other";
            if (event.error is IOErrorEvent) kind = "IOErrorEvent";
            else if (event.error is SecurityErrorEvent) kind = "SecurityErrorEvent";
            var failedConfig:Boolean = false;
            if (errorEvent) {
                // Extract only the numeric ID; never log raw text containing URLs or credentials.
                var match:Array = /Error\s+#(\d+)/.exec(errorEvent.text);
                if (match) id = match[1];
                failedConfig = /config\.xml(?:\?|\s|$)/.test(errorEvent.text);
            }
            note("Uncaught " + kind + " ID: " + id + ". Raw error text omitted.");
            if (failedConfig) note("Failed resource category: startup config.xml (URL parameters omitted).");
            if (id == "2070") note("2070: loaded code cannot access the Stage owned by another sandbox.");
        }
    }
}
