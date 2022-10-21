import * as core from '@actions/core'
import * as apiClient from './api-client'
import * as tarHelper from './tar-helper'
import * as github from '@actions/github'
import { promises as fs } from 'fs'
import * as yaml from 'js-yaml'


export async function run(): Promise<void> {
  try {
    const repository: string = process.env.GITHUB_REPOSITORY || ''
    if (repository === '') {
      core.setFailed(`Could not find Repository!`)
      return
    }
    if (github.context.eventName !== 'release') {
      core.setFailed('Please ensure you have the workflow trigger as release.')
      return
    }

    const file = 'action.yml'

    const content = await fs.readFile(file, 'utf8')

    let yamlData: any = yaml.load(content)

    if (yamlData == null || yamlData == undefined) {
        core.setFailed('Error in reading the yaml file')
        return
    }

    if (yamlData['version'] == null || yamlData['version'] == undefined){
      core.setFailed('No version provided to the action.yml')
        return
    }
    const semver_tag: string = yamlData['version']

   

    const path: string = core.getInput('path')
    const tarBallCreated = await tarHelper.createTarBall(path)
    const releaseId: string = github.context.payload.release.id
    // const semver: string = github.context.payload.release.tag_name

    if (tarBallCreated) {
      await apiClient.publishOciArtifact(repository, releaseId, semver_tag)
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
