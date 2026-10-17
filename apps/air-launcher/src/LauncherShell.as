package {
    import flash.display.NativeWindow;
    import flash.display.NativeWindowInitOptions;
    import flash.display.NativeWindowSystemChrome;
    import flash.display.Sprite;
    import flash.display.Stage;
    import flash.display.StageAlign;
    import flash.display.StageScaleMode;
    import flash.events.Event;
    import flash.events.MouseEvent;
    import flash.geom.Point;
    import flash.text.TextField;
    import flash.text.TextFormat;
    import flash.text.TextFieldType;
    import flash.utils.getTimer;

    // The shell never changes the game's stage geometry or adds UI to its stage.
    public class LauncherShell extends Sprite {
        public var gameWindow:NativeWindow;
        private var host:NativeWindow;
        private var ui:Sprite = new Sprite();
        private var performance:TextField;
        private var diagnostics:TextField;
        private var settings:Sprite;
        private var expandedDiagnostics:Boolean = false;
        private var logLines:Array = [];
        private var fpsValue:Number = 0;
        private var targetValue:Number = 60;
        private var intervalValue:Number = 0;
        private var memoryValue:Number = 0;
        private var history:Array = [];
        private var graph:Sprite;
        private var onImport:Function;
        private var onStart:Function;
        private var onCompanion:Function;
        public var onShoot:Function;
        private var matchTitle:TextField;
        private var matchDetail:TextField;
        private var matchTurn:TextField;
        private var participantText:TextField;
        private var shotStatus:TextField;
        private var recentPowers:TextField;
        private var sessionText:TextField;
        private var connectionText:TextField;
        private var powerInput:TextField = new TextField();
        private var shootButton:Sprite;
        private var currentMatch:Object = {active:false,title:"Waiting for game",participants:[],powers:[],shootReady:false,status:""};

        public function LauncherShell(window:NativeWindow, importSession:Function, start:Function, companion:Function) {
            host = window; onImport = importSession; onStart = start; onCompanion = companion;
            var chromeWidth:Number = host.width - host.stage.stageWidth;
            var chromeHeight:Number = host.height - host.stage.stageHeight;
            host.width = 1366 + chromeWidth; host.height = 780 + chromeHeight;
            host.minSize = new Point(1366 + chromeWidth, 780 + chromeHeight);
            var options:NativeWindowInitOptions = new NativeWindowInitOptions();
            options.owner = host; options.systemChrome = NativeWindowSystemChrome.NONE;
            options.resizable = false; options.maximizable = false; options.minimizable = false;
            options.renderMode = "cpu";
            gameWindow = new NativeWindow(options);
            gameWindow.title = "DDClassico game";
            gameWindow.width = 1000; gameWindow.height = 600;
            gameWindow.stage.align = StageAlign.TOP_LEFT;
            gameWindow.stage.scaleMode = StageScaleMode.NO_SCALE;
            gameWindow.stage.frameRate = 60; gameWindow.stage.color = 0x080c10;
            addChild(ui);
            powerInput.defaultTextFormat = new TextFormat("_sans",18,0xe6ebf2);
            powerInput.type=TextFieldType.INPUT; powerInput.restrict="0-9"; powerInput.maxChars=3; powerInput.text="30";
            powerInput.background=true; powerInput.backgroundColor=0x10161e;
            powerInput.addEventListener(Event.CHANGE,function(event:Event):void { redrawMatch(); });
            host.addEventListener("move", layout);
            host.addEventListener("resize", layout);
            host.stage.addEventListener(Event.RESIZE, layout);
            host.addEventListener(Event.CLOSE, dispose);
            layout();
        }
        public function get gameStage():Stage { return gameWindow.stage; }
        public function showGame():void { gameWindow.visible = true; layout(); }
        public function toggleDiagnostics():void { expandedDiagnostics = !expandedDiagnostics; layout(); }
        private function field(label:String, x:Number, y:Number, width:Number, size:int = 14, color:uint = 0xe6ebf2, height:Number = 30):TextField {
            var text:TextField = new TextField();
            text.defaultTextFormat = new TextFormat("_sans", size, color);
            text.text = label; text.x = x; text.y = y; text.width = width; text.height = height;
            text.multiline = true; text.wordWrap = true; text.mouseEnabled = false;
            ui.addChild(text); return text;
        }
        private function box(x:Number, y:Number, w:Number, h:Number, color:uint = 0x181e26):void {
            ui.graphics.beginFill(color); ui.graphics.drawRoundRect(x,y,w,h,8); ui.graphics.endFill();
        }
        private function button(label:String, x:Number, y:Number, w:Number, action:Function):void {
            var hit:Sprite = new Sprite(); hit.x=x; hit.y=y; hit.buttonMode=true;
            hit.graphics.beginFill(0x24303e); hit.graphics.drawRoundRect(0,0,w,26,5); hit.graphics.endFill();
            var caption:TextField = new TextField(); caption.defaultTextFormat = new TextFormat("_sans",12,0xe6ebf2);
            caption.text=label; caption.width=w; caption.height=26; caption.mouseEnabled=false;
            hit.addChild(caption); hit.addEventListener(MouseEvent.CLICK, function(event:MouseEvent):void { action(); }); ui.addChild(hit);
        }
        public function layout(event:Event = null):void {
            if (host.closed || gameWindow.closed) return;
            var w:Number = host.stage.stageWidth, h:Number = host.stage.stageHeight;
            if (!w || !h) return;
            var wide:Boolean = w >= 1600 && h >= 1000;
            var gx:Number=wide?64:0, gy:Number=wide?130:46;
            var origin:Point = host.globalToScreen(new Point(gx,gy));
            gameWindow.x=origin.x; gameWindow.y=origin.y;
            gameWindow.width=1000; gameWindow.height=600;
            ui.graphics.clear(); while(ui.numChildren) ui.removeChildAt(0);
            ui.graphics.beginFill(0x101419); ui.graphics.drawRect(0,0,w,h); ui.graphics.endFill();
            var drag:Sprite=new Sprite(); drag.graphics.beginFill(0x1a2028); drag.graphics.drawRect(0,0,w,46); drag.graphics.endFill();
            ui.addChild(drag);
            field("DDCLASSICO",18,11,140,16); field("Launcher",160,13,250,12,0x91a0b1);
            connectionText=field("",w-620,13,300,12,0x91a0b1);
            button("Settings",w-280,10,85,function():void { settings.visible=!settings.visible; });
            if(wide) field("PLAY SESSION",64,78,1000,14,0x91a0b1);
            box(gx,gy,1000,600,0x080c10);
            var sx:Number=wide?1128:1016, sw:Number=w-sx-(wide?64:16);
            box(sx,gy,sw,146); field("MATCH",sx+18,gy+14,sw-36,13,0x91a0b1);
            matchTitle=field("",sx+18,gy+44,sw-36,21);
            matchDetail=field("",sx+18,gy+78,sw-36,13,0x91a0b1);
            matchTurn=field("",sx+18,gy+109,sw-36);
            box(sx,gy+158,sw,232); field("PARTICIPANTS",sx+18,gy+172,sw-36,13,0x91a0b1);
            field("PLAYER / TEAM                      HP      STATE",sx+18,gy+203,sw-36,11,0x91a0b1);
            participantText=field("",sx+18,gy+230,sw-36,13,0xe6ebf2,145);
            participantText.mouseEnabled=true; participantText.selectable=true; participantText.wordWrap=false;
            var rowFormat:TextFormat=new TextFormat("_sans",13,0xe6ebf2);
            rowFormat.tabStops=[(sw-36)*0.52,(sw-36)*0.80]; rowFormat.leading=10;
            participantText.defaultTextFormat=rowFormat;
            box(sx,gy+402,sw,198); field("SHOT CONTROL",sx+18,gy+416,sw-36,13,0x91a0b1);
            field("Power  1–100",sx+18,gy+447,sw-36);
            powerInput.x=sx+18; powerInput.y=gy+478; powerInput.width=sw-150; powerInput.height=38; ui.addChild(powerInput);
            var before:int=ui.numChildren;
            button("Shoot",sx+sw-120,gy+478,102,function():void {
                if (onShoot != null && shootButton.mouseEnabled) {
                    onShoot(powerInput.text); currentMatch.shootReady=false; redrawMatch();
                }
            });
            shootButton=ui.getChildAt(before) as Sprite;
            shotStatus=field("",sx+18,gy+521,sw-36,12,0x91a0b1,43);
            recentPowers=field("",sx+18,gy+568,sw-36,12,0x91a0b1,28);
            var py:Number=gy+612, ph:Number=wide?110:Math.max(60,h-py-12);
            box(gx,py,1000,ph); field("PERFORMANCE",gx+18,py+14,950,13,0x91a0b1);
            field("FPS · last 60 samples",gx+350,py+14,260,11,0x91a0b1);
            field("Memory · relative history",gx+650,py+14,300,11,0x91a0b1);
            performance=field("",gx+18,py+44,310,16,0xe6ebf2,55);
            graph=new Sprite(); graph.x=gx+350; graph.y=py+38; ui.addChild(graph);
            var dy:Number=wide?868:py, dh:Number=wide?Math.min(116,h-dy-64):ph;
            var dx:Number=wide?64:sx, dw:Number=wide?w-128:sw;
            if(wide) {
                box(sx,py,sw,110); field("SESSION",sx+18,py+14,sw-36,13,0x91a0b1);
                sessionText=field("",sx+18,py+47,sw-36,14,0x91a0b1,45);
                field("Game stays at original size in fullscreen.",64,h-43,900,12,0x91a0b1);
                field("AIR launcher",w-240,h-43,180,12,0x91a0b1);
            }
            box(dx,dy,dw,dh); button((expandedDiagnostics?"▾":"▸")+" Diagnostics",dx+12,dy+8,125,toggleDiagnostics);
            diagnostics=field("",dx+18,dy+40,dw-36,12,0x91a0b1,Math.max(24,dh-44));
            settings=new Sprite(); settings.visible=false; settings.x=w-330; settings.y=46;
            settings.graphics.beginFill(0x24303e); settings.graphics.drawRect(0,0,320,36); settings.graphics.endFill(); ui.addChild(settings);
            // Popup actions are separate from game input, and never extend over its canvas.
            var saved:Sprite=ui; ui=settings;
            button("Companion",4,4,100,function():void { onCompanion(); });
            button("Import",112,4,85,function():void { onImport(); });
            button("Start",205,4,100,function():void { onStart(); }); ui=saved;
            if (!wide) sessionText=null;
            redrawPerformance(); redrawDiagnostics(); redrawMatch();
        }
        public function updateMatch(snapshot:Object):void { currentMatch=snapshot; redrawMatch(); }
        private function redrawMatch():void {
            if (!matchTitle) return;
            matchTitle.text=currentMatch.title || "No active match";
            matchDetail.text=currentMatch.active ? (currentMatch.stage || "Match active") : "Waiting for a match";
            matchTurn.text="Wind " + (currentMatch.wind || "—") + " · Turn: " + (currentMatch.turn || "—");
            connectionText.text=currentMatch.active ? "Match active" : "Launcher running · no active match";
            var rows:Array=[];
            for each (var player:Object in currentMatch.participants) {
                rows.push(String(player.name).substr(0,14)+" / "+player.team+"\t"+String(player.hp).split("/")[0]+"\t"+player.state);
            }
            var scroll:int=participantText.scrollV;
            var rowText:String=rows.length ? rows.join("\n") : "No visible participants";
            if (participantText.text != rowText) { participantText.text=rowText; participantText.scrollV=Math.min(scroll,participantText.maxScrollV); }
            var valid:Boolean=/^\d{1,3}$/.test(powerInput.text) && int(powerInput.text)>=1 && int(powerInput.text)<=100;
            if (currentMatch.limit != null && isFinite(Number(currentMatch.limit))) valid=valid && int(powerInput.text)*20<=Number(currentMatch.limit);
            shootButton.mouseEnabled=valid && currentMatch.shootReady === true && onShoot != null;
            shootButton.alpha=shootButton.mouseEnabled?1:0.4;
            shotStatus.text=!valid ? "Enter power from 1 to 100, within your current limit." :
                shootButton.mouseEnabled ? "Ready · your turn · PvE" : "Available during your normal PvE turn.";
            var status:String=currentMatch.status || "";
            var applied:Array=/^Applied (\d+) power/.exec(status);
            if(applied) shotStatus.text+="\nLast request: "+applied[1]+" power";
            else if(status.indexOf("Preparing one button shot") == 0) shotStatus.text="Preparing your shot…";
            else if(status.indexOf("Button shot unavailable") == 0 || status.indexOf("No power override") == 0 || status.indexOf("Button preparation timed out") == 0)
                shotStatus.text="Shot not confirmed. Check the game before retrying.";
            recentPowers.text="Recent powers: "+(currentMatch.powers && currentMatch.powers.length ? currentMatch.powers.join(" · ") : "—");
            if(sessionText) sessionText.text="Room: "+(currentMatch.room || "—")+" · Launcher time: "+Math.floor(getTimer()/60000)+"m "+Math.floor(getTimer()/1000)%60+"s\nLatency unavailable";
        }
        public function updatePerformance(fps:Number,target:Number,interval:Number,memory:Number):void {
            fpsValue=fps; targetValue=target; intervalValue=interval; memoryValue=memory;
            history.push({fps:fps,memory:memory}); if(history.length>60) history.shift(); redrawPerformance();
        }
        private function redrawPerformance():void {
            if(!performance) return;
            performance.text=fpsValue.toFixed(1)+" / "+targetValue.toFixed(0)+" FPS · "+intervalValue.toFixed(1)+" ms\nAIR allocated memory: "+memoryValue.toFixed(1)+" MiB";
            graph.graphics.clear();
            for(var i:int=0;i<history.length;i++) {
                var bar:Number=Math.min(45,Math.max(0,history[i].fps/Math.max(1,targetValue)*40));
                graph.graphics.beginFill(0x76a9fa); graph.graphics.drawRect(i*4,45-bar,3,bar); graph.graphics.endFill();
            }
            var peak:Number=1;
            for each(var sample:Object in history) peak=Math.max(peak,sample.memory);
            for(var j:int=0;j<history.length;j++) {
                var memoryBar:Number=Math.max(0,history[j].memory/peak*40);
                graph.graphics.beginFill(0x6bc6a0); graph.graphics.drawRect(300+j*4,45-memoryBar,3,memoryBar); graph.graphics.endFill();
            }
        }
        public function note(message:String):void {
            logLines.push(message); if(logLines.length>40) logLines.shift(); redrawDiagnostics();
        }
        private function redrawDiagnostics():void {
            if(diagnostics) diagnostics.text=expandedDiagnostics?logLines.slice(-5).join("\n"):"Startup diagnostics · expand for details";
        }
        private function dispose(event:Event):void { history=[]; logLines=[]; }
    }
}
