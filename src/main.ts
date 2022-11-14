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
    if (!isValidEventTrigger) {
      core.setFailed('Please ensure you have the workflow trigger as release or repository_dispatch.')
      return
    }

    const path: string = core.getInput('path')
    const tarBallCreated = await tarHelper.createTarBall(path)
    const isReleaseEvent = github.context.eventName == "release"
    const releaseId: string = isReleaseEvent ? github.context.payload.release.id : github.context.payload.client_payload.release.id
    const semver: string = isReleaseEvent ? github.context.payload.release.tag_name : github.context.payload.client_payload.release.tag_name

    if (tarBallCreated) {
      await apiClient.publishOciArtifact(repository, releaseId, semver)
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

function isValidEventTrigger(): boolean {
  const eventName = github.context.eventName;
  const validEventTypes = ['release', 'repository_dispatch']
  if(validEventTypes.includes(eventName))
    return true;
  return false;
}

run()
