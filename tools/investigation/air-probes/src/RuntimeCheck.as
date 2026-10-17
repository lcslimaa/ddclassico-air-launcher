package {
    import flash.display.Sprite;
    import flash.text.TextField;
    import flash.text.TextFormat;
    import flash.filesystem.File;
    import flash.filesystem.FileMode;
    import flash.filesystem.FileStream;

    [SWF(width="800", height="400", frameRate="30", backgroundColor="#224433")]
    public class RuntimeCheck extends Sprite {
        public function RuntimeCheck() {
            trace("[Runtime check] ActionScript constructor executed.");
            graphics.beginFill(0x224433);
            graphics.drawRect(0, 0, 800, 400);
            graphics.endFill();
            var text:TextField = new TextField();
            text.defaultTextFormat = new TextFormat("_sans", 24, 0xffffff);
            text.width = 750;
            text.height = 250;
            text.x = 25;
            text.y = 25;
            text.multiline = true;
            text.wordWrap = true;
            text.text = "AIR runtime check passed: ActionScript is running.\n\nThis check does not load DDClassico or connect to any server.";
            addChild(text);
            var stream:FileStream = new FileStream();
            try {
                File.applicationStorageDirectory.createDirectory();
                stream.open(File.applicationStorageDirectory.resolvePath("runtime-check.log"), FileMode.APPEND);
                stream.writeUTFBytes("ActionScript constructor executed at " + new Date().time + "\n");
                stream.close();
                text.appendText("\n\nLocal log written successfully.");
                trace("[Runtime check] Local log written successfully.");
            } catch (error:Error) {
                try { stream.close(); } catch (ignored:Error) {}
                text.appendText("\n\nLocal log error ID: " + error.errorID);
                trace("[Runtime check] Local log error ID: " + error.errorID);
            }
        }
    }
}
