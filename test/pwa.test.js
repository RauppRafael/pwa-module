const path = require('path')
const { generate, loadConfig } = require('@nuxtjs/module-test-utils')
const klawSync = require('klaw-sync')
const fs = require('fs-extra')

const getRelativePath = fileObj => path.relative(__dirname, fileObj.path)
const noJS = item => !/\.js/.test(item)

describe('pwa', () => {
  let nuxt

  beforeAll(async () => {
    ({ nuxt } = await generate(loadConfig(__dirname)))
  }, 60000)

  afterAll(async () => {
    await nuxt.close()
  })

  test('build files (.nuxt)', () => {
    const buildFiles = klawSync(nuxt.options.buildDir).map(getRelativePath)

    expect(buildFiles.filter(noJS)).toMatchSnapshot()
  })

  test('generate files (dist)', () => {
    const generateFiles = klawSync(nuxt.options.generate.dir).map(getRelativePath)

    expect(generateFiles.filter(noJS)).toMatchSnapshot()
  })

  test('accessible icons', async () => {
    const { html } = await nuxt.renderRoute('/')
    expect(html).toContain('/_nuxt/icons/icon_512x512.b8f3a1.png')
  })

  test('icons purpose', () => {
    const assetDir = path.join(nuxt.options.generate.dir, '_nuxt')
    const manifestFileName = fs.readdirSync(assetDir).find(item => item.match(/^manifest./i))
    const manifestContent = JSON.parse(fs.readFileSync(path.join(assetDir, manifestFileName.split('?')[0])))
    expect(manifestContent.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          purpose: expect.stringMatching(/( ?(any|maskable|badge))+/)
        })
      ])
    )
  })

  test('sw.js', async () => {
    const swContents = await fs.readFile(path.resolve(nuxt.options.generate.dir, 'sw.js'), 'utf-8')

    expect(swContents.replace(/@[^/]*/, '')).toMatchSnapshot()
  })

  test('manifest.json', async () => {
    const manifestContents = await fs.readFile(path.resolve(nuxt.options.generate.dir, '_nuxt/manifest_test.webmanifest'), 'utf-8')

    expect(manifestContents).toMatchSnapshot()
  })
})
