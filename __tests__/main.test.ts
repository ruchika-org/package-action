import * as apiClient from '../src/api-client'
import {run} from '../src/main'
import * as tarHelper from '../src/tar-helper'
import * as core from '@actions/core'
import * as github from '@actions/github'

describe('run function', () => {
  beforeAll(() => {
    jest.spyOn(core, 'setFailed').mockImplementation(param => {
      return param
    })

    // Mock error/warning/info/debug
    jest.spyOn(core, 'error').mockImplementation(jest.fn())
    jest.spyOn(core, 'warning').mockImplementation(jest.fn())
    jest.spyOn(core, 'info').mockImplementation(jest.fn())
    jest.spyOn(core, 'debug').mockImplementation(jest.fn())
    jest.spyOn(apiClient, 'publishOciArtifact').mockImplementation(jest.fn())
  })

  afterEach(() => {
    github.context.payload = {}
    github.context.eventName = ''
  })

  it('does not call createTarBall and publishOciArtifact without repo', async () => {
    process.env.GITHUB_REPOSITORY = ''
    let inputs = {
      path: '.'
    } as any

    jest.spyOn(core, 'getInput').mockImplementation((name: string) => {
      return inputs[name]
    })

    jest
      .spyOn(tarHelper, 'createTarBall')
      .mockImplementation(tarHelper.createTarBall)

    await run()

    expect(tarHelper.createTarBall).not.toHaveBeenCalled()
    expect(apiClient.publishOciArtifact).not.toHaveBeenCalled()
    expect(core.setFailed).toHaveBeenCalledTimes(1)
    expect(core.setFailed).toHaveBeenCalledWith(`Could not find Repository!`)
  })

  it('does not call createTarBall and publishOciArtifact without release trigger', async () => {
    process.env.GITHUB_REPOSITORY = 'monalisa/is-awesome'
    let inputs = {
      path: 'dist action.yml'
    } as any

    jest.spyOn(core, 'getInput').mockImplementation((name: string) => {
      return inputs[name]
    })

    jest
      .spyOn(tarHelper, 'createTarBall')
      .mockImplementation(tarHelper.createTarBall)

    await run()

    expect(tarHelper.createTarBall).not.toHaveBeenCalled()
    expect(apiClient.publishOciArtifact).not.toHaveBeenCalled()
    expect(core.setFailed).toHaveBeenCalledTimes(1)
    expect(core.setFailed).toHaveBeenCalledWith(
      `The action can only be used with release or repository_dispatch event.`
    )
  })

  it('does not call publishOciArtifact with invalid path', async () => {
    process.env.GITHUB_REPOSITORY = 'monalisa/is-awesome'
    process.env['GITHUB_EVENT_NAME'] = 'release'
    github.context.eventName = 'release'
    github.context.payload = {
      release: {
        tag_name: '1.0.1'
      }
    }
    let inputs = {
      path: 'notExisting'
    } as any

    jest.spyOn(core, 'getInput').mockImplementation((name: string) => {
      return inputs[name]
    })

    await run()

    expect(github.context.eventName).toBe('release')
    expect(tarHelper.createTarBall).toBeCalled()
    expect(apiClient.publishOciArtifact).not.toBeCalled()
  })

  it('calls publishOciArtifact with valid path', async () => {
    process.env.GITHUB_REPOSITORY = 'monalisa/is-awesome'
    process.env['GITHUB_EVENT_NAME'] = 'release'
    github.context.eventName = 'release'
    github.context.payload = {
      release: {
        tag_name: '1.0.1'
      }
    }
    let inputs = {
      path: 'src'
    } as any

    jest.spyOn(core, 'getInput').mockImplementation((name: string) => {
      return inputs[name]
    })

    jest.spyOn(tarHelper, 'createTarBall').mockResolvedValue(true)

    await run()

    expect(github.context.eventName).toBe('release')
    expect(tarHelper.createTarBall).toBeCalled()
    expect(apiClient.publishOciArtifact).toBeCalled()
    expect(core.setFailed).not.toHaveBeenCalled
  })
})
