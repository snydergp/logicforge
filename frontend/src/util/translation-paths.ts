export function processTitleKey(processName: string) {
  return `processes.${processName}.title`;
}

export function processDescriptionKey(processName: string) {
  return `processes.${processName}.description`;
}

export function processParameterTitleKey(processName: string, parameterName: string) {
  return `processes.${processName}.parameters.${parameterName}.title`;
}

export function processParameterDescriptionKey(processName: string, parameterName: string) {
  return `processes.${processName}.parameters.${parameterName}.description`;
}

export function actionTitleKey(actionName: string) {
  return `actions.${actionName}.title`;
}

export function actionDescriptionKey(actionName: string) {
  return `actions.${actionName}.description`;
}

export function actionParameterTitleKey(actionName: string, parameterName: string) {
  return `actions.${actionName}.parameters.${parameterName}.title`;
}

export function actionParameterDescriptionKey(actionName: string, parameterName: string) {
  return `actions.${actionName}.parameters.${parameterName}.description`;
}

export function functionTitleKey(functionName: string) {
  return `functions.${functionName}.title`;
}

export function functionDescriptionKey(functionName: string) {
  return `functions.${functionName}.description`;
}

export function functionParameterTitleKey(functionName: string, parameterName: string) {
  return `functions.${functionName}.parameters.${parameterName}.title`;
}

export function functionParameterDescriptionKey(functionName: string, parameterName: string) {
  return `functions.${functionName}.parameters.${parameterName}.description`;
}

export function typeTitleKey(typeId: string) {
  return `types.${typeId}.title`;
}

export function typeDescriptionKey(typeId: string) {
  return `types.${typeId}.description`;
}

export function typePropertyTitleKey(typeId: string, propertyName: string) {
  return `types.${typeId}.properties.${propertyName}.title`;
}

export function typePropertyDescriptionKey(typeId: string, propertyName: string) {
  return `types.${typeId}.properties.${propertyName}.description`;
}

export function typeEnumValueTitleKey(typeId: string, value: string) {
  return `types.${typeId}.values.${value}.title`;
}

export function typeEnumValueDescriptionKey(typeId: string, value: string) {
  return `types.${typeId}.values.${value}.description`;
}

export function controlTitleKey(controlName: string) {
  return `controls.${controlName}.title`;
}

export function controlDescriptionKey(controlName: string) {
  return `controls.${controlName}.description`;
}

export function controlParameterTitleKey(controlName: string, parameterName: string) {
  return `controls.${controlName}.parameters.${parameterName}.title`;
}

export function controlParameterDescriptionKey(controlName: string, parameterName: string) {
  return `controls.${controlName}.parameters.${parameterName}.description`;
}

export function controlBlockTitleKey(controlName: string, blockName: string) {
  return `controls.${controlName}.blocks.${blockName}.title`;
}

export function controlBlockDescriptionKey(controlName: string, blockName: string) {
  return `controls.${controlName}.blocks.${blockName}.description`;
}

export function labelKey(name: string) {
  return `labels.${name}`;
}
