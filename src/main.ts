import * as core from '@actions/core'
import * as apiClient from './api-client'
import * as tarHelper from './tar-helper'
import * as github from '@actions/github'

export async function run(): Promise<void> {
  try {
    const repository: string = process.env.GITHUB_REPOSITORY || ''
    if (repository === '') {
      core.setFailed(`Could not find Repository!`)
      return
    }
    const eventName: string = github.context.eventName
    let releaseId: string
    let semver: string
    if (eventName === 'release') {
      releaseId = github.context.payload.release.id
      semver = github.context.payload.release.tag_name
    } else if (eventName === 'repository_dispatch') {
      releaseId = github.context.payload.client_payload?.release?.id
      semver = github.context.payload.client_payload?.release?.tag_name
      if (releaseId === undefined || semver === undefined) {
        core.setFailed(
          'Missing release.id or release.tag_name in client_payload.'
        )
        return
      }
    } else {
      core.setFailed(
        'The action can only be used with release or repository_dispatch event.'
      )
      return
    }

    const path: string = core.getInput('path')
    const tarBallCreated = await tarHelper.createTarBall(path)

    if (tarBallCreated) {
      await apiClient.publishOciArtifact(repository, releaseId, semver)
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
