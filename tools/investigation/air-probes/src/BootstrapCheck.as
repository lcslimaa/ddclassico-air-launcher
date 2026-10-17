package {
    import flash.display.Sprite;
    import flash.events.Event;
    import flash.events.HTTPStatusEvent;
    import flash.events.IOErrorEvent;
    import flash.events.SecurityErrorEvent;
    import flash.events.TimerEvent;
    import flash.net.URLLoader;
    import flash.net.URLRequest;
    import flash.text.TextField;
    import flash.text.TextFormat;
    import flash.utils.Timer;

    [SWF(width="1000", height="600", frameRate="30", backgroundColor="#20242a")]
    public class BootstrapCheck extends Sprite {
        private var screen:TextField = new TextField();
        private var messages:Array = [];
        private var loader:URLLoader = new URLLoader();
        private var observation:Timer = new Timer(15000, 1);
        private var finished:Boolean = false;

        public function BootstrapCheck() {
            screen.defaultTextFormat = new TextFormat("_sans", 20, 0xffffff);
            screen.width = 950;
            screen.height = 550;
            screen.x = 25;
            screen.y = 25;
            screen.multiline = true;
            screen.wordWrap = true;
            addChild(screen);
            note("Native AIR bootstrap: configuration-only check.");
            note("No game SWF, captured credentials, account requests or browser cookies are used.");
            loader.addEventListener(Event.COMPLETE, complete);
            loader.addEventListener(HTTPStatusEvent.HTTP_STATUS, httpStatus);
            loader.addEventListener(IOErrorEvent.IO_ERROR, ioError);
            loader.addEventListener(SecurityErrorEvent.SECURITY_ERROR, securityError);
            observation.addEventListener(TimerEvent.TIMER_COMPLETE, observed);
            observation.start();
            var request:URLRequest = new URLRequest("https://s1.ddclassico.com/portugal/config.xml");
            request.manageCookies = false;
            try { loader.load(request); }
            catch (error:Error) { finished = true; note("Configuration request rejected. Error ID: " + error.errorID); }
        }

        private function note(message:String):void {
            messages.push(message);
            screen.text = messages.join("\n\n");
            trace("[Bootstrap check] " + message);
        }
        private function httpStatus(event:HTTPStatusEvent):void { note("Configuration HTTP status: " + event.status); }
        private function complete(event:Event):void {
            finished = true;
            try {
                var document:XML = new XML(String(loader.data));
                var configs:XMLList = document.descendants("config");
                if (configs.length() != 1) { note("Configuration structure invalid: expected one config element."); return; }
                var config:XML = configs[0];
                var flashSite:String = String(config.FLASHSITE.@value);
                var requestPath:String = String(config.REQUEST_PATH.@value);
                var language:String = String(config.LANGUAGE.@value);
                if (!/^https:\/\/[^\s]+\/$/i.test(flashSite) || !/^https:\/\/[^\s]+\/$/i.test(requestPath) || !language.length) {
                    note("Configuration received, but required HTTPS asset/service paths or language field are invalid.");
                    return;
                }
                note("Configuration downloaded and parsed successfully.");
                note("FLASHSITE, REQUEST_PATH and LANGUAGE are present; asset/service paths use HTTPS.");
                note("Stopped before character selection or login. Game compatibility remains unverified.");
            } catch (error:Error) { note("Configuration parsing failed. Error ID: " + error.errorID); }
        }
        private function ioError(event:IOErrorEvent):void { finished = true; note("Configuration I/O error ID: " + event.errorID); }
        private function securityError(event:SecurityErrorEvent):void { finished = true; note("Configuration security error ID: " + event.errorID); }
        private function observed(event:TimerEvent):void {
            if (!finished) note("15-second observation: configuration request is still pending.");
        }
    }
}
