/*
 * Content is an abstraction for storing the state of process data being viewed and edited. It is designed to break the
 * process tree-structure into doubly-linked parent/child nodes with unique (transient) keys for the purpose of
 * flattening the structure stored in Redux.
 */
export var ContentType;
(function (ContentType) {
    ContentType["PROCESS"] = "process";
    ContentType["ACTION_LIST"] = "actions";
    ContentType["ACTION"] = "action";
    ContentType["FUNCTION"] = "function";
    ContentType["INPUT_LIST"] = "inputs";
    ContentType["VALUE"] = "value";
})(ContentType || (ContentType = {}));
