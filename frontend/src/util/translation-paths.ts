export function processTitlePath(processName: string) {
  return `processes.${processName}.title`;
}
export function processDescriptionPath(processName: string) {
  return `processes.${processName}.description`;
}
export function processParameterTitlePath(processName: string, parameterName: string) {
  return `processes.${processName}.parameters.${parameterName}.title`;
}
export function processParameterDescriptionPath(processName: string, parameterName: string) {
  return `processes.${processName}.parameters.${parameterName}.description`;
}
export function actionTitlePath(actionName: string) {
  return `actions.${actionName}.title`;
}
export function actionDescriptionPath(actionName: string) {
  return `actions.${actionName}.description`;
}
export function actionParameterTitlePath(actionName: string, parameterName: string) {
  return `actions.${actionName}.parameters.${parameterName}.title`;
}
export function actionParameterDescriptionPath(actionName: string, parameterName: string) {
  return `actions.${actionName}.parameters.${parameterName}.description`;
}
export function functionTitlePath(functionName: string) {
  return `functions.${functionName}.title`;
}
export function functionDescriptionPath(functionName: string) {
  return `functions.${functionName}.description`;
}
export function functionParameterTitlePath(functionName: string, parameterName: string) {
  return `functions.${functionName}.parameters.${parameterName}.title`;
}
export function functionParameterDescriptionPath(functionName: string, parameterName: string) {
  return `functions.${functionName}.parameters.${parameterName}.description`;
}

export function typeTitlePath(typeId: string) {
  return `types.${typeId}.title`;
}
