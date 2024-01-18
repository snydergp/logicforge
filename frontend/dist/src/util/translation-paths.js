export function processTitlePath(processName) {
    return `processes.${processName}.title`;
}
export function processDescriptionPath(processName) {
    return `processes.${processName}.description`;
}
export function processParameterTitlePath(processName, parameterName) {
    return `processes.${processName}.parameters.${parameterName}.title`;
}
export function processParameterDescriptionPath(processName, parameterName) {
    return `processes.${processName}.parameters.${parameterName}.description`;
}
export function actionTitlePath(actionName) {
    return `actions.${actionName}.title`;
}
export function actionDescriptionPath(actionName) {
    return `actions.${actionName}.description`;
}
export function actionParameterTitlePath(actionName, parameterName) {
    return `actions.${actionName}.parameters.${parameterName}.title`;
}
export function actionParameterDescriptionPath(actionName, parameterName) {
    return `actions.${actionName}.parameters.${parameterName}.description`;
}
export function functionTitlePath(functionName) {
    return `functions.${functionName}.title`;
}
export function functionDescriptionPath(functionName) {
    return `functions.${functionName}.description`;
}
export function functionParameterTitlePath(functionName, parameterName) {
    return `functions.${functionName}.parameters.${parameterName}.title`;
}
export function functionParameterDescriptionPath(functionName, parameterName) {
    return `functions.${functionName}.parameters.${parameterName}.description`;
}
export function typeTitlePath(typeId) {
    return `types.${typeId}.title`;
}
