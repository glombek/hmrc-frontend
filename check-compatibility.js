const consumerRoot = process.env.INIT_CWD
const consumerPackageJson = require(`${consumerRoot}/package.json`)
const hmrcFrontendPackageJson = require('./package.json')

const withManualSteps = 'withManualSteps'

const knownPrototypeKitNames = ['govuk-prototype-kit', 'express-prototype']

if (!knownPrototypeKitNames.includes(consumerPackageJson.name)) {
  // Not installing as a dependency of the prototype kit so silently exit and continue
  process.exit(0)
}

const compatibility = {
  '1.4': {
    'prototype-kit': ['9.4', '9.3', '9.2', '9.1', '9.0']
  },
  '0.6': {
    'prototype-kit': ['8.12', '8.11', '8.10', '8.9', '8.8', '8.7']
  },
  [`0.6${withManualSteps}`]: {
    'prototype-kit': ['8.0', '7.1']
  }
}

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
})
readline.on('close', () => process.exit(1))

const blue = '\x1b[36m'
const green = '\x1b[32m'
const underline = '\x1b[4m'
const reset = '\x1b[0m'

const hmrcFrontendVersion = hmrcFrontendPackageJson.version
const compatibilityVersion = Object.keys(compatibility)
  .find(version => parseFloat(version) < parseFloat(hmrcFrontendVersion))

const checkCompatibility = (dependency, version) => {
  const getMatchableVersion = (v) => String(parseFloat(v).toFixed(1))
  const versionMatcher = getMatchableVersion(version)
  const compatibleVersions = compatibility[compatibilityVersion][dependency]

  let compatible =
    // Version is newer than our compatibility matrix
    parseFloat(compatibleVersions[0]) < parseFloat(versionMatcher)
    // Version is compatible
    || !!compatibleVersions.find(v => getMatchableVersion(v) === versionMatcher)

  let alternativeVersion = Object.keys(compatibility)
    .find(version => compatibility[version]['prototype-kit'].includes(versionMatcher))

  let requiresManualSteps = false
  if (alternativeVersion && alternativeVersion.includes(withManualSteps)) {
    alternativeVersion = alternativeVersion.replace(withManualSteps, '')
    requiresManualSteps = true
    compatible = true
  }

  return { version, compatible, alternativeVersion, requiresManualSteps  }
}

const styleString = (str, colour = green, style = '') => `${colour}${style}${str}${reset}`

const { alternativeVersion, compatible, requiresManualSteps } = checkCompatibility('prototype-kit', consumerPackageJson.version)

if (compatible && !requiresManualSteps) {
  process.exit(0)
}

if (!compatible || requiresManualSteps) {
  if (alternativeVersion && requiresManualSteps) {
    console.log(
      styleString('The version of HMRC Frontend you are trying to install is not compatible with your version of the GOV.UK Prototype Kit.'),
      '\n\n'
    )

    console.log('You can install a compatible version by following the steps detailed below')
    console.log(
      styleString('https://design.tax.service.gov.uk/hmrc-design-patterns/install-hmrc-frontend-in-your-prototype/install-hrmc-frontend-in-an-old-version-of-the-govuk-prototype-kit/', blue, underline),
      '\n\n'
    )

    process.exit(1)
  } else if (alternativeVersion) {
    console.log(
      styleString('The version of HMRC Frontend you are trying to install is not compatible with your version of the GOV.UK Prototype Kit.'),
      '\n\n'
    )
    console.log('You can install a compatible version by typing', '\n\n')

    console.log('┌─────────────────────────────────┐')
    console.log(`| npm install hmrc-frontend@${alternativeVersion}.x |`)
    console.log('└─────────────────────────────────┘', '\n\n')

    process.exit(1)
  } else {
    console.log(styleString('Your prototype is not compatible with HMRC Frontend'), '\n\n')
    console.log('You are using an old version of the GOV.UK Prototype Kit. This means it is not compatible with HMRC Frontend. You need to update to the latest version of the GOV.UK Prototype Kit.', '\n\n')
    console.log('Find out more about updating your GOV.UK prototype')
    console.log(styleString('https://govuk-prototype-kit.herokuapp.com/docs/updating-the-kit', blue, underline), '\n\n')

    const acceptPrompt = (response) => process.exit((response === 'y') ? 0 : 1)

    if (process.env.atPrompt) {
      acceptPrompt(process.env.atPrompt)
    } else {
      readline.question('You can continue to install HMRC Frontend, but your prototype may look different or some features may not work. Do you want to continue? (y/n) ', (answer) => {
        console.log('\n\n')
        acceptPrompt(answer[0].toLowerCase())
      })
    }
  }
}
