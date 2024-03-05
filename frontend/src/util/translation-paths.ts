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

export function typeDescriptionPath(typeId: string) {
  return `types.${typeId}.description`;
}

export function typeEnumValueTitlePath(typeId: string, value: string) {
  return `types.${typeId}.values.${value}.title`;
}

export function typeEnumValueDescriptionPath(typeId: string, value: string) {
  return `types.${typeId}.values.${value}.description`;
}

export function controlTitle(controlName: string) {
  return `controls.${controlName}.title`;
}

export function controlDescription(controlName: string) {
  return `controls.${controlName}.description`;
}

export function controlParameterTitle(controlName: string, parameterName: string) {
  return `controls.${controlName}.parameters.${parameterName}.title`;
}

export function controlParameterDescription(controlName: string, parameterName: string) {
  return `controls.${controlName}.parameters.${parameterName}.description`;
}

export function controlBlockTitle(controlName: string, blockName: string) {
  return `controls.${controlName}.blocks.${blockName}.title`;
}

export function controlBlockDescription(controlName: string, blockName: string) {
  return `controls.${controlName}.blocks.${blockName}.description`;
}

export function label(name: string) {
  return `labels.${name}`;
}
