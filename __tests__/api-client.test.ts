import * as core from '@actions/core'
import axios from 'axios'
import {getApiBaseUrl, publishOciArtifact} from '../src/api-client'
jest.mock('axios')

describe('getApiBaseUrl returns', () => {
  test('returns environment variable when set correctly', () => {
    process.env.GITHUB_API_URL = 'https://api.github.com'
    if (process.env.GITHUB_API_URL) {
      expect(getApiBaseUrl()).toEqual(process.env.GITHUB_API_URL)
    }
  })
  test('returns githubApiUrl when Env variable not set', () => {
    expect(getApiBaseUrl()).toEqual('https://api.github.com')
  })
})

describe('create and publish', () => {
  beforeAll(() => {
    process.env.GITHUB_REPOSITORY = 'monalisa/is-awesome'
    process.env.GITHUB_TOKEN = 'gha-token'
    process.env.GITHUB_ACTOR = 'monalisa'

    let inputs = {
      semver: '1.0.1',
      token: process.env.GITHUB_TOKEN,
      path: '.'
    } as any

    jest.spyOn(core, 'getInput').mockImplementation((name: string) => {
      return inputs[name]
    })

    jest.spyOn(core, 'setOutput').mockImplementation(param => {
      return param
    })

    jest.spyOn(core, 'setFailed').mockImplementation(param => {
      return param
    })
    jest.spyOn(core, 'setFailed').mockImplementation(jest.fn())
    // Mock error/warning/info/debug
    jest.spyOn(core, 'error').mockImplementation(jest.fn())
    jest.spyOn(core, 'warning').mockImplementation(jest.fn())
    jest.spyOn(core, 'info').mockImplementation(jest.fn())
    jest.spyOn(core, 'debug').mockImplementation(jest.fn())
  })

  it('can successfully create a package', async () => {
    axios.post = jest.fn().mockResolvedValue({
      status: 201,
      data: {
        package_url: 'https://ghcr.io/monalisa/is-awesome:1.0.1'
      }
    })

    await publishOciArtifact('monalisa/is-awesome', '154528', '1.0.1')

    expect(axios.post).toHaveBeenCalled()
    expect(axios.post).toHaveBeenCalledTimes(1)

    expect(core.setFailed).not.toHaveBeenCalled()
    expect(core.info).toHaveBeenCalledWith(
      'Created GHCR package for semver(1.0.1) with package URL https://ghcr.io/monalisa/is-awesome:1.0.1'
    )
  })

  it('Reports errors with response code 400', async () => {
    axios.post = jest.fn().mockRejectedValue({
      status: 400,
      message: `Error publishing actions packages for ${process.env.GITHUB_REPOSITORY}:1.0.1 on ghcr.io`
    })

    try {
      await publishOciArtifact('monalisa/is-awesome', '154528', '1.0.1')
    } catch (err) {
      expect(axios.post).toHaveBeenCalled()
      expect(axios.post).toHaveBeenCalledTimes(1)

      expect(core.setFailed).toHaveBeenCalledWith({status: 400})
      expect(core.setFailed).toHaveBeenCalledWith(
        `Failed to create package (status: 400) with semver 1.0.1. 
          Responded with: "Error publishing actions packages for ${process.env.GITHUB_REPOSITORY}:1.0.1 on ghcr.io"`
      )
    }
  })

  it('Reports errors with response code 403', async () => {
    axios.post = jest.fn().mockRejectedValue({
      status: 403
    })

    try {
      await publishOciArtifact('monalisa/is-awesome', '154528', '1.0.1')
    } catch (err) {
      expect(axios.post).toHaveBeenCalled()
      expect(axios.post).toHaveBeenCalledTimes(1)

      expect(core.setFailed).toHaveBeenCalledWith({status: 403})
      expect(core.setFailed).toHaveBeenCalledWith(
        `Failed to create package (status: 403) with semver 1.0.1. Ensure GITHUB_TOKEN has permission "packages: write".`
      )
    }
  })

  it('Reports errors with response code 404', async () => {
    axios.post = jest.fn().mockRejectedValue({
      status: 404,
      message: 'GitHub Actions is not enabled'
    })

    try {
      await publishOciArtifact('monalisa/is-awesome', '154528', '1.0.1')
    } catch (err) {
      expect(axios.post).toHaveBeenCalled()
      expect(axios.post).toHaveBeenCalledTimes(1)

      expect(core.setFailed).toHaveBeenCalledWith({status: 404})
      expect(core.setFailed).toHaveBeenCalledWith(
        `Failed to create package (status: 404) with semver 1.0.1. Ensure GitHub Actions have been enabled. 
         Responded with: "GitHub Actions is not enabled"`
      )
    }
  })

  it('Reports errors with response code 500', async () => {
    axios.post = jest.fn().mockRejectedValue({
      status: 500,
      message: 'Internal Server error'
    })

    try {
      await publishOciArtifact('monalisa/is-awesome', '154528', '1.0.1')
    } catch (err) {
      expect(axios.post).toHaveBeenCalled()
      expect(axios.post).toHaveBeenCalledTimes(1)

      expect(core.setFailed).toHaveBeenCalledWith({status: 500})
      expect(core.setFailed).toHaveBeenLastCalledWith(
        `Failed to create package (status: 500) with semver 1.0.1. Server error, is githubstatus.com reporting a GHCR outage? Please re-run the release at a later time. 
          Responded with: "Internal Server error"`
      )
    }
  })
})
