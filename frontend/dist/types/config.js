/*
 * Configs represent the serialization structure for loading/storing process data.
 */
export var ConfigType;
(function (ConfigType) {
    ConfigType["PROCESS"] = "process";
    ConfigType["ACTION"] = "action";
    ConfigType["VALUE"] = "value";
    ConfigType["VARIABLE"] = "variable";
    ConfigType["FUNCTION"] = "function";
})(ConfigType || (ConfigType = {}));
