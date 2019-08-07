const express = require('express')
const app = express()
const nunjucks = require('nunjucks')
const path = require('path')

const helperFunctions = require('../lib/helper-functions')
const fileHelper = require('../lib/file-helper')
const configPaths = require('../config/paths.json')

// Set up views
const appViews = [
  configPaths.layouts,
  configPaths.views,
  configPaths.components,
  configPaths.src,
  path.join(configPaths.src, 'layouts'),
  configPaths.govukFrontend + '/components',
  configPaths.govukFrontend
]

module.exports = (options) => {
  const nunjucksOptions = options ? options.nunjucks : {}

  // Configure nunjucks
  let env = nunjucks.configure(appViews, {
    autoescape: true, // output with dangerous characters are escaped automatically
    express: app, // the express app that nunjucks should install to
    noCache: true, // never use a cache and recompile templates each time
    trimBlocks: true, // automatically remove trailing newlines from a block/tag
    lstripBlocks: true, // automatically remove leading whitespace from a block/tag
    watch: true, // reload templates when they are changed. needs chokidar dependency to be installed
    ...nunjucksOptions // merge any additional options and overwrite defaults above.
  })

  // Set view engine
  app.set('view engine', 'njk')

  // Disallow search index indexing
  app.use(function (req, res, next) {
    // none - Equivalent to noindex, nofollow
    // noindex - Do not show this page in search results and do not show a
    //   "Cached" link in search results.
    // nofollow - Do not follow the links on this page
    res.setHeader('X-Robots-Tag', 'none')
    next()
  })

  // Set up middleware to serve static assets
  app.use('/public', express.static(configPaths.public))

  app.use('/govuk-frontend', express.static(configPaths.govukFrontend))

  app.use('/docs', express.static(configPaths.sassdoc))

  // serve html5-shiv from node modules
  app.use('/vendor/html5-shiv/', express.static('node_modules/html5shiv/dist/'))
  app.use(
    '/assets',
    express.static(path.join(configPaths.src)),
    express.static(path.join(configPaths.govukFrontend, 'assets'))
  )

  // Define routes

  // Index page - render the component list template
  ;(function () {
    const components = fileHelper.allComponents

    app.get('/', function (req, res) {
      res.render('index', {
        componentsDirectory: components
      })
    })
  }())

  // Whenever the route includes a :component parameter, read the component data
  // from its YAML file
  app.param('component', function (req, res, next, componentName) {
    res.locals.componentData = fileHelper.getComponentData(componentName)
    next()
  })

  // Component 'README' page
  app.get('/components/:component', function (req, res, next) {
    // make variables available to nunjucks template
    res.locals.componentPath = req.params.component
    res.render('component', function (error, html) {
      if (error) {
        next(error)
      } else {
        res.send(html)
      }
    })
  })

  // Component example preview
  app.get('/components/:component/:example*?/preview', function (req, res, next) {
    // Find the data for the specified example (or the default example)
    let componentName = req.params.component
    let requestedExampleName = req.params.example || 'default'

    let previewLayout = res.locals.componentData.previewLayout || 'layout'
    let type = res.locals.componentData.type || 'component'

    let exampleConfig = res.locals.componentData.examples.find(
      example => example.name.replace(/ /g, '-') === requestedExampleName
    )

    const globalData = (type === 'layout' && exampleConfig.data) || {}

    if (!exampleConfig) {
      next()
    }

    // Construct and evaluate the component with the data for this example
    let macroName = helperFunctions.componentNameToMacroName(componentName)

    let macroParameters = JSON.stringify(exampleConfig.data, null, '\t')
    let componentDirectory = helperFunctions.componentNameToComponentDirectory(componentName)

    try {
      res.locals.componentView = env.renderString(
        `{% from '${componentDirectory}/macro.njk' import ${macroName} %}
      {{ ${macroName}(${macroParameters}) }}`
      )
    } catch (err) {
      res.locals.componentView = null
    }

    let bodyClasses = ''
    if (req.query.iframe) {
      bodyClasses = 'app-iframe-in-component-preview'
    }

    Object.assign(globalData, { bodyClasses, previewLayout })

    res.render(type + '-preview', globalData)
  })

  app.get('/robots.txt', function (req, res) {
    res.type('text/plain')
    res.send('User-agent: *\nDisallow: /')
  })

  return app
}
