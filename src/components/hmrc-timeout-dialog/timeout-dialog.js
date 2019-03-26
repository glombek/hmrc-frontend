import displayDialog from './dialog.js'
import redirectToUrl from './redirectHelper.js'

function $ () {
  return {
    text: console.log
  }
}

$.get = function () {}

function TimeoutDialog (options) {
  validateInput(options)

  var cleanupFunctions = []
  var localisedDefaults = (readCookie('PLAY_LANG') && readCookie('PLAY_LANG') === 'cy' && {
    title: undefined,
    message: 'Er eich diogelwch, byddwn yn eich allgofnodi cyn pen',
    keepAliveButtonText: 'Parhau i fod wedi’ch mewngofnodi',
    signOutButtonText: 'Allgofnodi',
    properties: {
      minutes: 'funud',
      minute: 'funud',
      seconds: 'eiliad',
      second: 'eiliad'
    }
  }) || {
      title: undefined,
      message: 'For your security, we will sign you out in',
      keepAliveButtonText: 'Stay signed in',
      signOutButtonText: 'Sign out',
      properties: {
        minutes: 'minutes',
        minute: 'minute',
        seconds: 'seconds',
        second: 'second'
      }
    }

  var settings = mergeOptionsWithDefaults(options, localisedDefaults)

  setupDialogTimer()

  function validateInput (config) {
    var requiredConfig = ['timeout', 'countdown', 'keepAliveUrl', 'signOutUrl']
    var missingRequiredConfig = []

    requiredConfig.forEach(function (item) {
      if (!config.hasOwnProperty(item)) {
        missingRequiredConfig.push(item)
      }
    })

    if (missingRequiredConfig.length > 0) {
      throw new Error('Missing config item(s): [' + missingRequiredConfig.join(', ') + ']')
    }
  }

  function mergeOptionsWithDefaults (options, localisedDefaults) {
    return Object.assign({}, localisedDefaults, options)
  }

  function setupDialogTimer () {
    settings.signout_time = getDateNow() + settings.timeout * 1000

    var timeout = window.setTimeout(function () {
      setupDialog()
    }, ((settings.timeout) - (settings.countdown)) * 1000)

    cleanupFunctions.push(function () {
      window.clearTimeout(timeout)
    })
  }

  function setupDialog () {
    var $countdownElement = $('<span id="timeout-countdown" class="countdown">')
    // var $element = $('<div>')
    //   .append(settings.title ? $('<h1 class="heading-medium push--top">').text(settings.title) : '')
    //   .append($('<p id="timeout-message" role="text">').text(settings.message + ' ')
    //     .append($countdownElement)
    //     .append('.'))
    //   .append($('<button id="timeout-keep-signin-btn" class="button">').text(settings.keepAliveButtonText))
    //   .append($('<button id="timeout-sign-out-btn" class="button button--link">').text(settings.signOutButtonText))
    //
    // $element.find('#timeout-keep-signin-btn').on('click', keepAliveAndClose)
    // $element.find('#timeout-sign-out-btn').on('click', signOut)

    var dialogControl = displayDialog('<div><h1>Hello World</h1></div>')

    cleanupFunctions.push(function () {
      dialogControl.closeDialog()
    })

    dialogControl.addCloseHandler(keepAliveAndClose)

    dialogControl.setAriaLabelledBy('timeout-message')
    if (getSecondsRemaining() > 60) {
      dialogControl.setAriaLive('polite')
    }

    startCountdown($countdownElement, dialogControl)
  }

  function getSecondsRemaining () {
    return Math.floor((settings.signout_time - getDateNow()) / 1000)
  }

  function startCountdown ($countdownElement, dialogControl) {
    function updateCountdown (counter, $countdownElement) {
      var message
      if (counter === 60) {
        dialogControl.setAriaLive()
      }
      if (counter < 60) {
        message = counter + ' ' + settings.properties[counter !== 1 ? 'seconds' : 'second']
      } else {
        var minutes = Math.ceil(counter / 60)
        message = minutes + ' ' + settings.properties[minutes === 1 ? 'minute' : 'minutes']
      }
      $countdownElement.text(message)
    }

    function runUpdate () {
      var counter = getSecondsRemaining()
      updateCountdown(counter, $countdownElement)
      if (counter <= 0) {
        signOut()
      }
    }

    var countdown = window.setInterval(runUpdate, 1000)
    cleanupFunctions.push(function () {
      window.clearInterval(countdown)
    })
    runUpdate()
  }

  function keepAliveAndClose () {
    cleanup()
    setupDialogTimer()
    $.get(settings.keepAliveUrl, function () {
    })
  }

  function getDateNow () {
    return Date.now() || +new Date()
  }

  function signOut () {
    redirectToUrl(settings.signOutUrl)
  }

  function cleanup () {
    while (cleanupFunctions.length > 0) {
      var fn = cleanupFunctions.shift()
      fn()
    }
  }

  function readCookie (cookieName) { // From http://www.javascripter.net/faq/readingacookie.htm
    var re = new RegExp('[; ]' + cookieName + '=([^\\s;]*)')
    var sMatch = (' ' + document.cookie).match(re)
    if (cookieName && sMatch) return unescape(sMatch[1])
    return ''
  }

  return {cleanup: cleanup}
}

export default TimeoutDialog
