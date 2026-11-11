package {
    import flash.desktop.NativeApplication;
    import flash.display.Loader;
    import flash.display.NativeWindow;
    import flash.display.Sprite;
    import flash.display.StageAlign;
    import flash.display.StageScaleMode;
    import flash.display.Stage;
    import flash.events.Event;
    import flash.events.ErrorEvent;
    import flash.events.IOErrorEvent;
    import flash.events.InvokeEvent;
    import flash.events.TimerEvent;
    import flash.events.SecurityErrorEvent;
    import flash.events.MouseEvent;
    import flash.events.UncaughtErrorEvent;
    import flash.filesystem.File;
    import flash.filesystem.FileMode;
    import flash.filesystem.FileStream;
    import flash.net.FileFilter;
    import flash.net.URLRequest;
    import flash.system.LoaderContext;
    import flash.system.System;
    import flash.utils.Timer;
    import flash.utils.getTimer;
    import flash.text.TextField;
    import flash.text.TextFormat;

    [SWF(width="1000", height="600", frameRate="60", backgroundColor="#20242a")]
    public class SessionLauncher extends Sprite {
        private var selected:File = new File();
        private var imported:Object;
        private var game:Loader = new Loader();
        private var panel:Sprite = new Sprite();
        private var status:TextField = new TextField();
        private var messages:Array = [];
        private var started:Boolean = false;
        private var ready:Boolean = false;
        private var bridgePath:String;
        private var bridgeSeen:Boolean = false;
        private var memoryTimer:Timer = new Timer(5000);
        private var fpsHud:TextField = new TextField();
        private var frameTimes:Array = [];
        private var lastFrame:int = 0;
        private var fpsWindowStart:int = 0;
        private var fpsFrames:uint = 0;
        private var frameIntervals:uint = 0;
        private var frameSum:Number = 0;
        private var frameMaximum:Number = 0;
        private var hudStart:int = 0;
        private var hudFrames:uint = 0;
        private var hudWorst:Number = 0;
        private var focused:Boolean = true;
        private var windowForeground:Boolean = true;
        private var matchPanel:MatchPanel;
        private var pilot:Boolean;
        private var shell:LauncherShell;
        private var gameStage:Stage;
        private var mainWindow:NativeWindow;
        private var gameWindow:NativeWindow;
        private var lastMarker:int = -1000;

        public function SessionLauncher(layoutPilot:Boolean = false) {
            pilot = layoutPilot;
            NativeApplication.nativeApplication.addEventListener(InvokeEvent.INVOKE, invoked);
            if (stage) initialize();
            else addEventListener(Event.ADDED_TO_STAGE, initialize);
        }
        private function initialize(event:Event = null):void {
            removeEventListener(Event.ADDED_TO_STAGE, initialize);
            stage.align = StageAlign.TOP_LEFT;
            stage.scaleMode = StageScaleMode.NO_SCALE;
            gameStage = stage;
            if (pilot) {
                shell = new LauncherShell(stage.nativeWindow,
                    function():void { choose(null); }, function():void { startGame(null); },
                    function():void { showMatchPanel(); });
                addChild(shell); gameStage = shell.gameStage;
                gameStage.addChild(game); shell.showGame();
            } else addChild(game);
            mainWindow = stage.nativeWindow;
            gameWindow = gameStage.nativeWindow;
            watchWindow(mainWindow);
            if (gameWindow != mainWindow) watchWindow(gameWindow);
            if (!pilot) {
            stage.addChild(panel);
            panel.graphics.beginFill(0x20242a, 0.95);
            panel.graphics.drawRect(0, 0, 1000, 235);
            panel.graphics.endFill();
            button("Import fresh session", 15, choose);
            button("Start game", 250, startGame);
            button("Toggle diagnostics (F2)", 470, togglePanel);
            button("Match window (F4)", 720, showMatchPanel);
            status.defaultTextFormat = new TextFormat("_sans", 16, 0xffffff);
            status.x = 15; status.y = 60; status.width = 970; status.height = 170;
            status.multiline = true; status.wordWrap = true;
            panel.addChild(status);
            }
            selected.addEventListener(Event.SELECT, importFile);
            loaderInfo.uncaughtErrorEvents.addEventListener(UncaughtErrorEvent.UNCAUGHT_ERROR, uncaught);
            if (pilot) game.contentLoaderInfo.uncaughtErrorEvents.addEventListener(UncaughtErrorEvent.UNCAUGHT_ERROR, uncaught);
            if (pilot) game.contentLoaderInfo.addEventListener(Event.INIT, resetGameScaling);
            var shortcuts:Function = function(event:Object):void {
                if (event.keyCode >= 117 && event.keyCode <= 121) {
                    markTest(int(event.keyCode)-117);
                }
                if (event.keyCode == 113) { if (pilot) shell.toggleDiagnostics(); else panel.visible = !panel.visible; }
                if (event.keyCode == 114) fpsHud.visible = !fpsHud.visible;
                if (event.keyCode == 115) showMatchPanel();
            };
            stage.addEventListener("keyDown", shortcuts);
            if (pilot) gameStage.addEventListener("keyDown", shortcuts);
            fpsHud.defaultTextFormat = new TextFormat("_sans", 14, 0xffffff);
            fpsHud.width = 365; fpsHud.height = 45; fpsHud.multiline = true;
            fpsHud.background = true; fpsHud.backgroundColor = 0x20242a;
            fpsHud.mouseEnabled = false; fpsHud.selectable = false;
            fpsHud.text = "FPS: measuring… (F3 to hide)";
            if (!pilot) stage.addChild(fpsHud);
            fpsWindowStart = hudStart = getTimer();
            focused = stage.nativeWindow.active;
            windowForeground = focused;
            stage.nativeWindow.addEventListener(Event.ACTIVATE, function(event:Event):void { focused = true; });
            stage.nativeWindow.addEventListener(Event.DEACTIVATE, function(event:Event):void {
                if (!pilot) { focused = false; windowForeground = false; }
            });
            gameStage.addEventListener(Event.ENTER_FRAME, frameTick);
            note("Import a session exported from your normal DDClassico login. Close the original game before Start.");
            ready = true;
            matchPanel = new MatchPanel(game, gameStage.nativeWindow, pilot);
            if (pilot) {
                matchPanel.onSnapshot = shell.updateMatch;
                shell.onShoot = matchPanel.shootFromLauncher;
            }
            if (!pilot) matchPanel.show();
            memoryTimer.addEventListener(TimerEvent.TIMER, sampleMemory);
            memoryTimer.start();
            sampleMemory();
            if (bridgePath) importBridge();
        }
        private function sampleMemory(event:TimerEvent = null):void {
            // Numeric telemetry only. No object dumps, credentials or forced collection.
            trace("[AIR memory] elapsedMs=" + getTimer() + " allocatedBytes=" +
                Math.round(System.totalMemoryNumber) + " freeBytes=" + Math.round(System.freeMemory) +
                " privateBytes=" + Math.round(System.privateMemory));
            sampleFPS();
            sampleWindows();
        }
        private function windowsOpen():Boolean {
            return mainWindow && gameWindow && !mainWindow.closed && !gameWindow.closed;
        }
        private function watchWindow(window:NativeWindow):void {
            window.addEventListener(Event.ACTIVATE, sampleWindows);
            window.addEventListener(Event.DEACTIVATE, sampleWindows);
            window.addEventListener("displayStateChange", sampleWindows);
            window.addEventListener(Event.CLOSE, sampleWindows);
        }
        private function windowFlags(window:NativeWindow, prefix:String):String {
            var closed:Boolean = !window || window.closed;
            return " " + prefix + "Active=" + (!closed && window.active ? 1 : 0) +
                " " + prefix + "Minimized=" + (!closed && window.displayState == "minimized" ? 1 : 0) +
                " " + prefix + "Closed=" + (closed ? 1 : 0);
        }
        private function sampleWindows(event:Event = null):void {
            trace("[AIR window] elapsedMs=" + getTimer() + windowFlags(mainWindow, "main") + windowFlags(gameWindow, "game"));
            if (!windowsOpen()) memoryTimer.stop();
        }
        private function markTest(index:int):void {
            var now:int = getTimer();
            if (now-lastMarker < 350) return;
            lastMarker = now;
            var labels:Array = ["baseline", "invite-sent", "player-joined", "player-left", "lobby-left"];
            var label:String = labels[index];
            trace("[Test marker] " + label + " at " + now + "ms");
            note("Test marker: " + label);
        }
        private function frameTick(event:Event):void {
            if (!windowsOpen()) return;
            if (pilot) resetGameScaling();
            var now:int = getTimer();
            if (pilot) focused = stage.nativeWindow.active || gameStage.nativeWindow.active;
            fpsFrames++; hudFrames++;
            if (lastFrame) {
                var interval:Number = Math.max(0, now-lastFrame);
                frameSum += interval; frameMaximum = Math.max(frameMaximum, interval);
                frameIntervals++;
                hudWorst = Math.max(hudWorst, interval);
                if (frameTimes.length < 8192) frameTimes.push(interval);
            }
            lastFrame = now;
            if (!focused || stage.nativeWindow.displayState == "minimized") windowForeground = false;
            if (now-hudStart >= 1000) {
                fpsHud.text = "FPS " + (hudFrames*1000/(now-hudStart)).toFixed(1) +
                    " / target " + gameStage.frameRate.toFixed(1) + (focused ? "" : " [background]") +
                    "\nWorst frame " + hudWorst.toFixed(1) + " ms · F3 to hide";
                hudFrames = 0; hudWorst = 0; hudStart = now;
                if (pilot) shell.updatePerformance(fpsFrames*1000/Math.max(1,now-fpsWindowStart),gameStage.frameRate,
                    frameIntervals?frameSum/frameIntervals:0,System.totalMemoryNumber/1048576);
            }
            if (pilot) return;
            if (panel.parent != stage) stage.addChild(panel);
            if (fpsHud.parent != stage) stage.addChild(fpsHud);
            if (stage.getChildIndex(panel) != stage.numChildren-2) stage.setChildIndex(panel, stage.numChildren-1);
            if (stage.getChildIndex(fpsHud) != stage.numChildren-1) stage.setChildIndex(fpsHud, stage.numChildren-1);
            fpsHud.x = Math.max(0, stage.stageWidth-fpsHud.width-8);
            fpsHud.y = panel.visible ? 243 : 8;
        }
        private function sampleFPS():void {
            if (!windowsOpen()) return;
            var now:int = getTimer();
            var duration:int = now-fpsWindowStart;
            if (duration < 1000) return;
            frameTimes.sort(Array.NUMERIC);
            var p95:Number = frameTimes.length ? Number(frameTimes[Math.ceil(frameTimes.length*0.95)-1]) : 0;
            var count:uint = fpsFrames;
            var average:Number = frameIntervals ? frameSum/frameIntervals : 0;
            trace("[AIR fps] elapsedMs=" + now + " windowMs=" + duration + " frames=" + count +
                " fps=" + (count*1000/duration).toFixed(1) + " targetFps=" + gameStage.frameRate.toFixed(1) +
                " avgFrameMs=" + average.toFixed(1) + " p95FrameMs=" + p95.toFixed(1) +
                " maxFrameMs=" + frameMaximum.toFixed(1) + " foreground=" + (windowForeground ? 1 : 0));
            frameTimes.length = 0; fpsFrames = 0; frameIntervals = 0; frameSum = 0; frameMaximum = 0;
            fpsWindowStart = now; windowForeground = focused && stage.nativeWindow.displayState != "minimized";
        }
        private function invoked(event:InvokeEvent):void {
            if (!event.arguments.length) return;
            if (bridgeSeen || started || event.arguments.length != 2 || event.arguments[0] != "--bridge-session") {
                note("Bridge invocation rejected."); return;
            }
            bridgeSeen = true;
            bridgePath = String(event.arguments[1]);
            if (ready) importBridge();
            else trace("[Session launcher] Bridge start deferred until the launcher is ready.");
        }
        private function importBridge():void {
            var stream:FileStream = new FileStream();
            imported = null;
            try {
                // The helper passes an absolute native path, never a token-bearing URL.
                if (!bridgePath || bridgePath.charAt(0) != "/") throw new Error("Invalid bridge file path.");
                var file:File = new File(bridgePath);
                bridgePath = null;
                if (!file.exists || file.isDirectory || file.size > 65536) throw new Error("Invalid bridge file.");
                stream.open(file, FileMode.READ);
                var value:Object = JSON.parse(stream.readUTFBytes(stream.bytesAvailable));
                stream.close();
                SessionFile.validate(value, new Date().time);
                imported = value;
                note("Bridge session accepted.");
            } catch (error:Error) {
                bridgePath = null;
                try { stream.close(); } catch (ignored:Error) {}
                note("Bridge session rejected."); return;
            }
            startGame(null);
        }
        private function button(label:String, x:Number, callback:Function):void {
            var item:Sprite = new Sprite();
            item.graphics.beginFill(0x3b5876); item.graphics.drawRoundRect(0, 0, 215, 38, 6); item.graphics.endFill();
            item.x = x; item.y = 12; item.buttonMode = true;
            var text:TextField = new TextField(); text.defaultTextFormat = new TextFormat("_sans", 15, 0xffffff);
            text.text = label; text.width = 210; text.height = 30; text.x = 7; text.y = 6; text.mouseEnabled = false;
            item.addChild(text); item.addEventListener(MouseEvent.CLICK, callback); panel.addChild(item);
        }
        private function choose(event:MouseEvent):void {
            if (started) { note("Close and reopen the prototype before importing another session."); return; }
            try { selected.browseForOpen("Select your private session export", [new FileFilter("DDClassico session JSON", "*.json")]); }
            catch (error:Error) { note("File picker failed. Error ID: " + error.errorID); }
        }
        private function importFile(event:Event):void {
            imported = null;
            var stream:FileStream = new FileStream();
            try {
                if (selected.size > 65536) { note("Import refused: session file exceeds 64 KB."); return; }
                stream.open(selected, FileMode.READ);
                var value:Object = JSON.parse(stream.readUTFBytes(stream.bytesAvailable)); stream.close();
                SessionFile.validate(value, new Date().time);
                imported = value;
                note("Session imported and validated. Values remain in memory and are not logged. Ready to Start.");
            } catch (error:Error) {
                try { stream.close(); } catch (ignored:Error) {}
                // Validation messages are fixed strings; other errors may include file content, so omit them.
                note("Import rejected. Use a fresh, supported session export. Error ID: " + error.errorID);
            }
        }
        private function startGame(event:MouseEvent):void {
            if (started) { note("A startup attempt is already active. Restart the prototype for another attempt."); return; }
            if (!imported) { note("Import a valid session first."); return; }
            var parameters:Object;
            try { parameters = SessionFile.validate(imported, new Date().time); }
            catch (error:Error) { imported = null; note("Session no longer passes the local freshness check. Export another one."); return; }
            var entry:File = File.applicationDirectory.resolvePath("DDT_Loading.session.swf");
            if (!entry.exists) { note("Private startup adapter is missing; rebuild the prototype."); return; }
            var context:LoaderContext = new LoaderContext(); context.parameters = parameters;
            game.contentLoaderInfo.addEventListener(Event.COMPLETE, loaded);
            game.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR, loadError);
            game.contentLoaderInfo.addEventListener(SecurityErrorEvent.SECURITY_ERROR, loadError);
            started = true;
            imported = null;
            note("Starting locally packaged adapter with fresh parameters. Server acceptance remains to be tested.");
            try { game.load(new URLRequest(entry.url), context); }
            catch (error:Error) { note("Startup rejected. Error ID: " + error.errorID); }
        }
        private function resetGameScaling(event:Event = null):void {
            // The original startup sets exactFit. A secondary NativeWindow has no
            // 1000x600 document baseline, so exactFit stretches it unpredictably.
            if (gameStage.scaleMode != StageScaleMode.NO_SCALE) gameStage.scaleMode = StageScaleMode.NO_SCALE;
            if (gameStage.align != StageAlign.TOP_LEFT) gameStage.align = StageAlign.TOP_LEFT;
        }
        private function loaded(event:Event):void {
            if (pilot) resetGameScaling();
            note("Startup adapter loaded. This alone does not establish login or gameplay success.");
        }
        private function loadError(event:ErrorEvent):void { note("Entry load error ID: " + event.errorID); }
        private function togglePanel(event:MouseEvent):void { panel.visible = !panel.visible; }
        private function showMatchPanel(event:MouseEvent = null):void {
            if (matchPanel) matchPanel.show();
        }
        private function note(message:String):void {
            if (shell) shell.note(message);
            messages.push(message); if (messages.length > 7) messages.shift();
            if (ready || status.parent) { status.text = messages.join("\n"); panel.visible = true; }
            trace("[Session launcher] " + message);
        }
        private function uncaught(event:UncaughtErrorEvent):void {
            event.preventDefault();
            var error:Error = event.error as Error;
            var errorEvent:ErrorEvent = event.error as ErrorEvent;
            var id:String = error ? String(error.errorID) : errorEvent ? String(errorEvent.errorID) : "unknown";
            var category:String = event.error is IOErrorEvent ? "I/O" : event.error is SecurityErrorEvent ? "sandbox" : "runtime";
            if (errorEvent) {
                var match:Array = /Error\s+#(\d+)/.exec(errorEvent.text);
                if (match) id = match[1];
            }
            note("Uncaught " + category + " error ID: " + id + ". Raw details omitted.");
            // Keep only lexical function names. Drop the message, arguments and source paths.
            // getStackTrace can be null for code built without debug information.
            if (error) {
                var stack:String = error.getStackTrace();
                var count:int = 0;
                if (stack) {
                    for each (var line:String in stack.split(/\r?\n/)) {
                        var frame:Array = /^\s*at\s+([A-Za-z_$][A-Za-z0-9_$.:\/<>-]{0,159})\(\)/.exec(line);
                        if (frame && String(frame[1]).indexOf("://") < 0) {
                            trace("[Session frame] " + frame[1] + "()");
                            if (++count >= 12) break;
                        }
                    }
                }
                if (!count) trace("[Session launcher] Stack function names unavailable.");
            }
        }
    }
}
