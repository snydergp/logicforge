/*
 * Specifications represent the system-level configurations defining the bounds of how processes can be structured.
 * These include the type system, the structure of processes, and the available actions and functions.
 */
export var SpecType;
(function (SpecType) {
    SpecType["ENGINE"] = "ENGINE";
    SpecType["TYPE"] = "TYPE";
    SpecType["PROCESS"] = "PROCESS";
    SpecType["ACTION_LIST"] = "ACTION_LIST";
    SpecType["ACTION"] = "ACTION";
    SpecType["FUNCTION"] = "FUNCTION";
    SpecType["PARAMETER"] = "PARAMETER";
})(SpecType || (SpecType = {}));
