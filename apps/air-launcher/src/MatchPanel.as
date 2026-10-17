package {
    import flash.display.Loader;
    import flash.display.NativeWindow;
    import flash.display.NativeWindowInitOptions;
    import flash.display.NativeWindowType;
    import flash.display.StageAlign;
    import flash.display.StageScaleMode;
    import flash.display.Sprite;
    import flash.display.Stage;
    import flash.events.Event;
    import flash.events.EventDispatcher;
    import flash.events.TimerEvent;
    import flash.events.MouseEvent;
    import flash.events.KeyboardEvent;
    import flash.system.ApplicationDomain;
    import flash.text.TextField;
    import flash.text.TextFormat;
    import flash.text.TextFieldType;
    import flash.utils.Timer;
    import flash.utils.getTimer;

    // Match telemetry plus an explicitly armed, one-shot PvE power-input experiment.
    public class MatchPanel {
        private var game:Loader;
        private var window:NativeWindow;
        private var text:TextField = new TextField();
        private var timer:Timer = new Timer(500);
        private var managerClass:Object;
        private var observedPlayer:EventDispatcher;
        private var observedMatch:Object;
        private var shots:Array = [];
        private var powerInput:TextField = new TextField();
        private var powerStatus:TextField = new TextField();
        private var armedPower:int = 0;
        private var armedAt:int = 0;
        private var gameStage:Stage;
        private var buttonShot:Boolean = false;
        private var shotFrames:int = 0;
        private var spaceSent:Boolean = false;
        private var shotTimeout:Timer = new Timer(1500, 1);
        private var integrated:Boolean;
        public var onSnapshot:Function;
        private var disposing:Boolean = false;

        public function MatchPanel(loader:Loader, owner:NativeWindow, integratedControls:Boolean = false) {
            integrated = integratedControls;
            game = loader;
            gameStage = owner.stage;
            var options:NativeWindowInitOptions = new NativeWindowInitOptions();
            options.type = NativeWindowType.NORMAL;
            options.owner = owner;
            window = new NativeWindow(options);
            window.title = "DDClassico — Match information";
            window.width = 650; window.height = 650;
            window.x = owner.x + 45; window.y = owner.y + 45;
            window.stage.align = StageAlign.TOP_LEFT;
            window.stage.scaleMode = StageScaleMode.NO_SCALE;
            window.stage.color = 0x20242a;
            text.defaultTextFormat = new TextFormat("_sans", 15, 0xffffff);
            text.multiline = true; text.wordWrap = true; text.selectable = true;
            text.x = 14; text.y = 108;
            window.stage.addChild(text);
            var label:TextField = new TextField();
            label.defaultTextFormat = new TextFormat("_sans", 13, 0xffffff);
            label.text = "Power 1–100 · normal PvE dungeon shots · keeps your in-game aim";
            label.x = 14; label.y = 4; label.width = 610; label.height = 22;
            window.stage.addChild(label);
            powerInput.defaultTextFormat = new TextFormat("_sans", 16, 0xffffff);
            powerInput.type = TextFieldType.INPUT; powerInput.restrict = "0-9";
            powerInput.maxChars = 3; powerInput.text = "30";
            powerInput.x = 14; powerInput.y = 30; powerInput.width = 65; powerInput.height = 28;
            powerInput.border = true; powerInput.background = true; powerInput.backgroundColor = 0x303844;
            window.stage.addChild(powerInput);
            controlButton("Shoot", 95, shootPower);
            controlButton("Arm Space override", 270, armPower);
            controlButton("Cancel override", 445, cancelOverride);
            shotTimeout.addEventListener(TimerEvent.TIMER_COMPLETE, shotTimedOut);
            powerStatus.defaultTextFormat = new TextFormat("_sans", 13, 0xffffff);
            powerStatus.x = 14; powerStatus.y = 65; powerStatus.width = 610; powerStatus.height = 40;
            powerStatus.multiline = true; powerStatus.wordWrap = true;
            powerStatus.text = "Enter power and click Shoot during your turn. Arm Space override keeps the previous test available.";
            window.stage.addChild(powerStatus);
            window.addEventListener(Event.RESIZE, resize);
            // Close hides the companion only; F4 reopens it without affecting AIR.
            window.addEventListener(Event.CLOSING, function(event:Event):void {
                if (disposing) return;
                event.preventDefault(); window.visible = false;
                if (!integrated) { finishButtonShot(); timer.stop(); observe(null, null); }
            });
            owner.addEventListener(Event.CLOSE, function(event:Event):void {
                disposing = true; onSnapshot = null;
                finishButtonShot(); timer.stop(); observe(null, null); managerClass = null; game = null;
                if (!window.closed) window.close();
            });
            timer.addEventListener(TimerEvent.TIMER, refresh);
            resize();
            text.text = "Waiting for the game core…\nRead-only · refreshed twice per second · F4 reopens this window";
            if (integrated) timer.start();
        }
        public function shootFromLauncher(power:String):void { powerInput.text = power; shootPower(null); }
        public function snapshot():Object {
            var match:Object = property(property(managerClass, "Instance"), "Current");
            var self:Object = property(match, "selfGamePlayer");
            var active:Object = property(match, "currentLiving");
            var mission:Object = property(match, "missionInfo");
            var title:String = match ? "Map " + value(match, "mapIndex") : "No active match";
            try {
                if (match) {
                    var maps:Object = resolveClass("ddt.manager.MapManager");
                    var map:Object = maps ? maps["getMapInfo"](Number(property(match,"mapIndex"))) : null;
                    if (property(map,"Name") is String) title=value(map,"Name");
                }
            } catch (ignoredMap:Error) {}
            if (property(mission, "name") is String && String(property(mission, "name")).length) title = value(mission, "name");
            var roomClass:Object = resolveClass("room.RoomManager");
            var room:Object = property(property(roomClass,"Instance"),"current");
            var rows:Array = [];
            var candidates:Array = [];
            if (self) candidates.push(self);
            var livings:* = property(property(match, "livings"), "list");
            if (livings is Array) candidates = candidates.concat(livings);
            var seen:Array = [];
            for each (var living:Object in candidates) {
                if (!living || seen.indexOf(living) >= 0 || (living != self && property(living,"isHidden") === true)) continue;
                seen.push(living); if (rows.length >= 32) break;
                rows.push({name:value(living,"name"),team:value(living,"team"),hp:value(living,"blood")+"/"+value(living,"maxBlood"),
                    state:property(living,"isLiving") === false ? "Out" : property(living,"isFrozen") === true ? "Frozen" : living == active ? "Active" : property(living,"isLiving") === true ? "Alive" : "—"});
            }
            var powers:Array = [];
            for each (var shot:Object in shots) if (shot.power != null) powers.push(shot.power);
            return {active:match != null,title:title,stage:mission ? "Mission " + value(mission,"missionIndex") : "",
                wind:value(match,"wind"),turn:active && (active == self || property(active,"isHidden") !== true) ? value(active,"name") : "—",
                participants:rows,powers:powers,shootReady:allowedPower() && !buttonShot,
                status:powerStatus.text,limit:value(self,"maxForce"),room:value(room,"ID")};
        }
        public function show():void {
            if (window.closed) return;
            window.visible = true; timer.start(); refresh();
        }
        private function resize(event:Event = null):void {
            text.width = Math.max(150, window.stage.stageWidth - 28);
            text.height = Math.max(150, window.stage.stageHeight - 122);
            powerStatus.width = Math.max(150, window.stage.stageWidth - 28);
        }
        private function controlButton(label:String, x:Number, click:Function):void {
            var button:Sprite = new Sprite();
            button.x = x; button.y = 30; button.buttonMode = true;
            button.graphics.beginFill(0x3a5269); button.graphics.drawRoundRect(0, 0, 160, 28, 6); button.graphics.endFill();
            var caption:TextField = new TextField();
            caption.defaultTextFormat = new TextFormat("_sans", 14, 0xffffff);
            caption.text = label; caption.width = 160; caption.height = 28;
            caption.mouseEnabled = false; caption.selectable = false;
            button.addChild(caption); button.addEventListener(MouseEvent.CLICK, click);
            window.stage.addChild(button);
        }
        private function cancelPower(event:MouseEvent = null):void {
            armedPower = 0; powerStatus.text = "Not armed. Normal Space-shot power is unchanged.";
        }
        private function cancelOverride(event:MouseEvent):void {
            if (buttonShot) { powerStatus.text = "The button shot is already being processed; wait for the result."; return; }
            cancelPower();
        }
        private function allowedPower():Boolean {
            // Fail closed on missing/changed fields. Ordinary dungeon room only for this first test.
            if (!observedPlayer || !observedMatch || (!window.visible && !integrated)) return false;
            var manager:Object = property(managerClass, "Instance");
            if (property(manager, "Current") !== observedMatch || property(observedMatch, "selfGamePlayer") !== observedPlayer) return false;
            if (property(observedMatch, "roomType") !== 4 || property(observedMatch, "currentLiving") !== observedPlayer) return false;
            return property(observedPlayer, "isLiving") === true && property(observedPlayer, "isAttacking") === true &&
                property(observedPlayer, "shootEnabled") === true && property(observedPlayer, "isMoving") === false &&
                property(observedPlayer, "isFrozen") === false && property(observedPlayer, "shootType") === 0;
        }
        private function armPower(event:MouseEvent):void {
            if (buttonShot) { powerStatus.text = "A button shot is already being processed."; return; }
            cancelPower(); refresh();
            if (!/^\d{1,3}$/.test(powerInput.text) || int(powerInput.text) < 1 || int(powerInput.text) > 100) {
                powerStatus.text = "Enter a whole-number power from 1 to 100."; return;
            }
            if (!allowedPower()) {
                powerStatus.text = "Arm during your active turn in a normal PvE dungeon, while alive, unfrozen and stationary, in normal shot mode."; return;
            }
            var limit:* = property(observedPlayer, "maxForce");
            if (!(limit is Number) || !isFinite(Number(limit)) || Number(limit) <= 0 || int(powerInput.text)*20 > Number(limit)) {
                powerStatus.text = "Entered power exceeds the current shot-power limit, or that limit is unavailable."; return;
            }
            armedPower = int(powerInput.text)*20; armedAt = getTimer();
            powerStatus.text = "Armed: " + powerInput.text + " (" + armedPower + " units), once. Click the game; hold/release Space. Expires in 30 seconds.";
        }
        private function shootPower(event:MouseEvent):void {
            if (buttonShot) return;
            armPower(event);
            if (!armedPower) return;
            var keyboard:Object = resolveClass("org.aswing.KeyboardManager");
            try {
                if (!keyboard || keyboard["isDown"](32) === true ||
                    (gameStage.focus is TextField && TextField(gameStage.focus).type == TextFieldType.INPUT)) {
                    cancelPower(); powerStatus.text = "Release Space and leave game text input before clicking Shoot."; return;
                }
                // Match the original mobile Shoot button's stage-key dispatch. EnergyView
                // prepares the shot on game frames and releases through the tested override.
                gameStage.nativeWindow.activate();
                buttonShot = true; shotFrames = 0; spaceSent = true;
                gameStage.addEventListener(Event.ENTER_FRAME, buttonShotFrame);
                shotTimeout.reset(); shotTimeout.start();
                gameStage.dispatchEvent(new KeyboardEvent(KeyboardEvent.KEY_DOWN, true, false, 0, 32));
                powerStatus.text = "Preparing one button shot at " + armedPower/20 + " power…";
            } catch (ignored:Error) {
                finishButtonShot(); cancelPower(); powerStatus.text = "Button shot unavailable. No automatic retry.";
            }
        }
        private function buttonShotFrame(event:Event):void {
            shotFrames++;
            // Allow one complete frame for EnergyView's normal beginShoot sequence.
            if (shotFrames == 2) releaseButtonSpace();
            if (shotFrames >= 4) finishButtonShot();
        }
        private function releaseButtonSpace():void {
            if (!spaceSent) return;
            spaceSent = false;
            gameStage.dispatchEvent(new KeyboardEvent(KeyboardEvent.KEY_UP, true, false, 0, 32));
        }
        private function finishButtonShot():void {
            var wasButton:Boolean = buttonShot;
            releaseButtonSpace();
            gameStage.removeEventListener(Event.ENTER_FRAME, buttonShotFrame);
            shotTimeout.stop(); buttonShot = false;
            if (wasButton && armedPower) {
                cancelPower(); powerStatus.text = "No power override was applied during button preparation. Check the game before trying again.";
            }
        }
        private function shotTimedOut(event:TimerEvent):void {
            finishButtonShot();
            if (armedPower) { cancelPower(); powerStatus.text = "Button preparation timed out. Space released; no retry. Check the game before trying again."; }
        }
        private function applyPower(event:Event):void {
            if (!armedPower) return;
            var desired:int = armedPower; armedPower = 0;
            try {
                var args:* = property(event, "paras");
                var limit:* = property(observedPlayer, "maxForce");
                if (getTimer()-armedAt > 30000 || !allowedPower() || !(args is Array) || !args.length ||
                    !(args[0] is Number) || !isFinite(Number(args[0])) || !(limit is Number) || !isFinite(Number(limit)) ||
                    Number(limit) <= 0 || desired > Number(limit)) {
                    powerStatus.text = "Power input skipped: conditions changed. Original shot request was left unchanged."; return;
                }
                // Only replace the normal charge's existing request parameter before game handlers.
                // Do not emit keys, dispatch an extra request, call shooting methods or modify aim.
                args[0] = desired;
                powerStatus.text = "Applied " + desired/20 + " power (" + desired + " units) to one client request. Confirm the resulting shot in game.";
            } catch (ignored:Error) { powerStatus.text = "Power input unavailable. No additional shot requested."; }
        }
        private function property(object:Object, key:String):* {
            try { return object == null ? null : object[key]; }
            catch (ignored:Error) { return null; }
        }
        private function value(object:Object, key:String):String {
            var result:* = property(object, key);
            if (result is Number || result is int || result is uint) {
                return isFinite(Number(result)) ? String(Math.round(Number(result)*100)/100) : "—";
            }
            if (result is Boolean) return result ? "yes" : "no";
            // Text is bounded, never interpreted as HTML, and never written to logs.
            if (result is String) return String(result).replace(/[\r\n\t]/g, " ").substr(0, 80);
            return "—";
        }
        private function resolveClass(className:String):Object {
            var root:ApplicationDomain;
            try { root = game.contentLoaderInfo.applicationDomain; }
            catch (ignored:Error) { return null; }
            if (!root) return null;
            var domains:Array = [root];
            // The startup's ModuleLoader records domains for dynamically loaded code.
            for (var i:int = 0; i < domains.length && i < 64; i++) {
                var domain:ApplicationDomain = domains[i] as ApplicationDomain;
                if (!domain) continue;
                if (domain.hasDefinition(className)) return domain.getDefinition(className);
                if (domain.hasDefinition("com.pickgliss.loader.ModuleLoader")) {
                    var module:Object = domain.getDefinition("com.pickgliss.loader.ModuleLoader");
                    var loaded:* = property(module, "domains");
                    if (loaded is Array) {
                        for each (var candidate:ApplicationDomain in loaded) {
                            if (candidate && domains.indexOf(candidate) < 0 && domains.length < 64) domains.push(candidate);
                        }
                    }
                }
            }
            return null;
        }
        private function display(lines:Array):void {
            var scroll:int = text.scrollV;
            var next:String = lines.join("\n");
            if (text.text != next) { text.text = next; text.scrollV = Math.min(scroll, text.maxScrollV); }
        }
        private function observe(player:Object, match:Object):void {
            var dispatcher:EventDispatcher = player as EventDispatcher;
            if (dispatcher == observedPlayer && match == observedMatch) return;
            if (observedPlayer) {
                observedPlayer.removeEventListener("sendShootAction", shotRequested);
                observedPlayer.removeEventListener("sendShootAction", applyPower);
            }
            cancelPower();
            observedPlayer = dispatcher; observedMatch = match; shots = [];
            if (observedPlayer) {
                observedPlayer.addEventListener("sendShootAction", applyPower, false, 10000);
                observedPlayer.addEventListener("sendShootAction", shotRequested, false, -10000);
            }
        }
        private function shotRequested(event:Event):void {
            // Observe the existing request, after the normal handlers. Never cancel or dispatch it.
            try {
                var parameters:* = property(event, "paras");
                var raw:* = property(parameters, "0");
                if (!(raw is Number) || !isFinite(Number(raw))) return;
                var shotType:* = property(observedPlayer, "shootType");
                var force:Number = Number(raw);
                var label:String = "Request " + (shots.length ? int(shots[shots.length-1].number)+1 : 1) +
                    ": " + (Math.round(force*100)/100) + " internal units";
                if (shotType != null && int(shotType) == 0) {
                    label += " · " + (force/2000*100).toFixed(1) + "% of 2000";
                    var model:* = property(observedPlayer, "force");
                    label += " · model integer " + (model is Number && isFinite(Number(model)) ? String(int(model)) : "—");
                } else label += " · special shot mode (different scale)";
                label += " · aim " + value(observedPlayer, "gunAngle") + "°";
                var number:int = shots.length ? int(shots[shots.length-1].number)+1 : 1;
                shots.push({number:number, label:label, power:shotType != null && int(shotType) == 0 ? Number((force/20).toFixed(1)) : null});
                if (shots.length > 5) shots.shift();
            } catch (ignored:Error) {}
        }
        private function effects(living:Object):String {
            var output:Array = [];
            for each (var key:String in ["localBuffs", "turnBuffs", "petBuffs", "outTurnBuffs"]) {
                var buffs:* = property(living, key);
                var count:* = property(buffs, "length");
                if (count is Number || count is int || count is uint) {
                    var labels:Array = [];
                    for (var i:int = 0; i < Math.min(Number(count), 8); i++) {
                        var buff:Object = property(buffs, String(i));
                        var label:String = value(buff, "name").replace(/<[^>]*>/g, "");
                        if (label == "—" || label == "FightBuffInfo") label = "ID " + value(buff, "id");
                        labels.push(label);
                    }
                    output.push(key + ": " + count + (labels.length ? " [" + labels.join(", ") + "]" : ""));
                }
            }
            return output.length ? output.join(" · ") : "—";
        }
        private function refresh(event:TimerEvent = null):void {
            if (!game || window.closed || (!window.visible && !integrated)) return;
            try {
                if (!managerClass) managerClass = resolveClass("game.GameManager");
                if (!managerClass) {
                    if (onSnapshot != null) onSnapshot(snapshot());
                    text.text = "Waiting for the game core…\nRead-only · F4 reopens this window"; return;
                }
                var manager:Object = property(managerClass, "Instance");
                var match:Object = property(manager, "Current");
                if (!match) {
                    observe(null, null);
                    if (onSnapshot != null) onSnapshot(snapshot());
                    display(["No active match. Read-only · F4 reopens this window"]); return;
                }
                var self:Object = property(match, "selfGamePlayer");
                observe(self, match);
                if (armedPower && (getTimer()-armedAt > 30000 || !allowedPower())) {
                    cancelPower(); powerStatus.text = "Disarmed: turn/state changed or 30-second timeout reached.";
                }
                var active:Object = property(match, "currentLiving");
                var lines:Array = ["MATCH · read-only · updates every 0.5 seconds",
                    "Map: " + value(match, "mapIndex") + "   Wind: " + value(match, "wind"),
                    "Active turn: " + (property(active, "isHidden") === true && active != self ? "unavailable" : value(active, "name")) +
                    "   Team: " + value(active, "team"),
                    "", "YOU · " + value(self, "name") + " · Team " + value(self, "team"),
                    "HP: " + value(self, "blood") + " / " + value(self, "maxBlood") +
                    "   Energy: " + value(self, "energy") + " / " + value(self, "maxEnergy"),
                    "Rage: " + value(self, "dander") + "   Turn-time value: " + value(self, "turnTime"),
                    "Aim: " + value(self, "gunAngle") + "°   Power: " + value(self, "force"),
                    "Alive: " + value(self, "isLiving") + "   Frozen: " + value(self, "isFrozen"),
                    "Effects: " + effects(self), "", "VISIBLE PARTICIPANTS"];
                var participants:* = property(property(match, "livings"), "list");
                if (participants is Array) {
                    var shown:int = 0;
                    for each (var living:Object in participants) {
                        if (!living || living == self || property(living, "isHidden") === true) continue;
                        if (++shown > 32) { lines.push("Additional participants omitted."); break; }
                        lines.push(value(living, "name") + " · Team " + value(living, "team") +
                            " · HP " + value(living, "blood") + "/" + value(living, "maxBlood"));
                        lines.push("Energy " + value(living, "energy") + "/" + value(living, "maxEnergy") +
                            " · Rage " + value(living, "dander") + " · Alive " + value(living, "isLiving") +
                            " · Frozen " + value(living, "isFrozen"));
                        lines.push("Turn-time value " + value(living, "turnTime") + " · Effects: " + effects(living));
                    }
                    if (!shown) lines.push("No other visible participants.");
                } else lines.push("Participant collection unavailable in this game version.");
                lines.push("", "SHOT INPUT CHECK · read-only", "Final client requests, not server acceptance. No live charge reading.");
                if (!shots.length) lines.push("Waiting for a normal shot. Keep this window open while shooting.");
                for each (var shot:Object in shots) lines.push(shot.label);
                lines.push("", "— = unavailable. Values reflect the client model, not a server query.",
                    "Scroll with the mouse wheel. Close hides this window; F4 reopens it.");
                display(lines);
                if (onSnapshot != null) onSnapshot(snapshot());
            } catch (ignoredError:Error) {
                observe(null, null);
                // Clear stale values and omit raw errors (which can contain game/session data).
                text.text = "Match data unavailable for this game version.\nThe game continues independently.";
                if (onSnapshot != null) onSnapshot({active:false,title:"Match data unavailable",participants:[],powers:[],shootReady:false,status:"Waiting for match data"});
            }
        }
    }
}
