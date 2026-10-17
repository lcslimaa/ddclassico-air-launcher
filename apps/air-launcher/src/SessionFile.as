package {
    public class SessionFile {
        // A local freshness guard, not a claim about the server's token lifetime.
        public static function validate(value:Object, now:Number):Object {
            if (!value || value.format !== "ddclassico-air-session-v1") throw new Error("Unsupported session file format.");
            if (!(value.exportedAt is Number) || !isFinite(value.exportedAt)) throw new Error("Session export time is missing.");
            var age:Number = now - Number(value.exportedAt);
            if (age > 600000 || age < -60000) throw new Error("Export a fresh session; this file is outside the local ten-minute freshness window.");
            if (!(value.entryUrl is String) || !/^https:\/\/resource\.ddclassico\.com\/flash\/(Loading|ddt_loading)\.swf$/i.test(value.entryUrl)) {
                throw new Error("Unsupported startup resource.");
            }
            if (!value.parameters || !(value.parameters is Object) || value.parameters is Array) throw new Error("Session parameters must be an object.");
            var result:Object = {};
            for (var name:String in value.parameters) {
                if (!/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(name) || !(value.parameters[name] is String)) throw new Error("Invalid startup parameter format.");
                if (value.parameters[name].length > 8192) throw new Error("Startup parameter is unexpectedly large.");
                result[name] = value.parameters[name];
            }
            for each (var required:String in ["user", "key", "config"]) {
                if (!result[required]) throw new Error("Required startup parameters are missing.");
            }
            if (!/^https:\/\/([a-z0-9-]+\.)*ddclassico\.com(?::443)?\/(?:[^\s?#]*\/)?config\.xml(?:\?[^\s#]*)?$/i.test(result.config)) {
                throw new Error("Unsupported configuration origin or path.");
            }
            return result;
        }
    }
}
