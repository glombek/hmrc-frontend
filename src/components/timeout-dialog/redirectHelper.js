function RedirectHelper () {}

RedirectHelper.redirectToUrl = function (url) {
  // This exists to make redirects more testable
  window.location.href = url
}

export default RedirectHelper
