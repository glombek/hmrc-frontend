function ValidateInput ($module) {
}

ValidateInput.int = function (stringToValidate) {
  const parsedInt = parseInt(stringToValidate, 10)
  return isNaN(parsedInt) ? undefined : parsedInt
}

ValidateInput.string = function (stringToValidate) {
  return '' + stringToValidate
}

export default ValidateInput
