import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as fs from 'fs'
import {
  createTarBall,
  isActionYamlPresentInPathSrc,
  isValidPath
} from '../src/tar-helper'

describe('Tar create', () => {
  const timeoutMs: number = 35000
  const tempDir = '/tmp'

  beforeAll(() => {
    jest.spyOn(core, 'setFailed').mockImplementation(param => {
      return param
    })
    // Mock error/warning/info/debug
    jest.spyOn(core, 'error').mockImplementation(jest.fn())
    jest.spyOn(core, 'warning').mockImplementation(jest.fn())
    jest.spyOn(core, 'info').mockImplementation(jest.fn())
    jest.spyOn(core, 'debug').mockImplementation(jest.fn())
    process.env.GITHUB_REPOSITORY = 'monalisa/is-awesome'
  })

  afterEach(async () => {
    if (fs.existsSync(`${tempDir}/archive.tar.gz`))
      await exec.exec(`rm ${tempDir}/archive.tar.gz`)
  })
  
  beforeAll(async () => {
    if (fs.existsSync(`${tempDir}/archive.tar.gz`))
      await exec.exec(`rm ${tempDir}/archive.tar.gz`)
  })

  it(
    'has successfully created a tar.gzip with custom path input',
    async () => {
      let inputs = {
        path: 'dist/'
      } as any

      jest.spyOn(core, 'getInput').mockImplementation((name: string) => {
        return inputs[name]
      })
      const path = core.getInput('path')
      console.log(path)
      fs.existsSync(`${tempDir}/archive.tar.gz`) == false
      const tarBallCreated = await createTarBall(path)
      expect(tarBallCreated).toBe(true)
      fs.existsSync(`${tempDir}/archive.tar.gz`) == true
      expect(core.setFailed).not.toHaveBeenCalled()
      expect(core.info).toHaveBeenCalledWith('Tar ball created.')
    },
    timeoutMs
  )
  
  it(
    'has successfully created a tar.gzip with default path input',
    async () => {
      let inputs = {
        path: '.'
      } as any

      jest.spyOn(core, 'getInput').mockImplementation((name: string) => {
        return inputs[name]
      })
      const path = core.getInput('path')
      fs.existsSync(`${tempDir}/archive.tar.gz`) == false
      const tarBallCreated = await createTarBall(path)
      expect(tarBallCreated).toBe(true)
      fs.existsSync(`${tempDir}/archive.tar.gz`) == true
      expect(core.setFailed).not.toHaveBeenCalled()
      expect(core.info).toHaveBeenCalledWith('Tar ball created.')
    },
    timeoutMs
  )

  it('has not created a tar.gzip with default path input', () => {
    const path = '.'
    fs.existsSync(`${tempDir}/archive.tar.gz`) == false
    expect(core.setFailed).not.toHaveBeenCalled()
    expect(core.info).not.toHaveBeenCalled()
  })

  it('has not created a tar.gzip with custom path input', () => {
    const path = 'dist/ action.yml'
    fs.existsSync(`${tempDir}/archive.tar.gz`) == false
    expect(core.setFailed).not.toHaveBeenCalled()
    expect(core.info).not.toHaveBeenCalled()
  })

  it(
    'throws Error with invalid path input',
    async () => {
      let inputs = {
        path: 'disty/ action.yaml'
      } as any

      jest.spyOn(core, 'getInput').mockImplementation((name: string) => {
        return inputs[name]
      })
      const path = core.getInput('path')

      const tarBallCreated = await createTarBall(path)
      expect(tarBallCreated).toBe(false)

      expect(core.setFailed).toHaveBeenCalledWith(
        'Creation of tarball failed! Invalid path. Please ensure the path input has a valid path defined and separated by a space if you want multiple files/folders to be packaged.'
      )
      expect(core.info).not.toHaveBeenCalled()
    },
    timeoutMs
  )
})

describe('Tar creation path isValidPath', () => {
  it('is a valid custom pathname', () => {
    const path = ['dist/', 'action.yml']
    expect(isValidPath(path)).toBeTruthy()
  })
  it('is a valid custom pathname', () => {
    const path = ['.']
    expect(isValidPath(path)).toBeTruthy()
  })
  it('is an invalid custom pathname', () => {
    const path = ['distyy']
    expect(isValidPath(path)).toBeFalsy()
  })
})

describe('isActionYamlPresentInPathSrc returns', () => {
  it('true if action yml is present in src', () => {
    const path = ['dist', 'action.yml']
    expect(isActionYamlPresentInPathSrc(path)).toBeTruthy()
  })
  it('true if action yml is present in src', () => {
    const path = ['.']
    expect(isActionYamlPresentInPathSrc(path)).toBeTruthy()
  })
  it('false if action yml is not present in src', () => {
    const path = ['src']
    expect(isActionYamlPresentInPathSrc(path)).toBeFalsy()
  })
})
