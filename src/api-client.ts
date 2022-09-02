import * as core from '@actions/core'
import axios from 'axios'
import * as fs from 'fs'

//returns the API Base Url
export function getApiBaseUrl(): string {
  const githubApiUrl = 'https://api.github.com'
  return githubApiUrl
}

// Publish the Action Artifact to GHCR by calling the post API
export async function publishOciArtifact(
  repository: string,
  semver: string
): Promise<void> {
  try {
    const TOKEN: string = core.getInput('token')
    core.setSecret(TOKEN)
    const path: string = core.getInput('path')
    const publishPackageEndpoint = `${getApiBaseUrl()}/repos/${repository}/actions/package`

    core.info(
      `Creating GHCR package for release with semver:${semver} with path:"${path}"`
    )

    const fileStream = fs.createReadStream('archive.tar.gz')

    await axios
      .post(publishPackageEndpoint, fileStream, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `Bearer ${TOKEN}`,
          'Content-type': 'application/octet-stream',
          tag: `${semver}`
        }
      })
      .then(response => {
        core.info(
          `Created GHCR package for semver(${semver}) with package URL ${response.data.package_url}`
        )
        core.setOutput('package-url', `${response.data.package_url}`)
      })
      .catch(error => {
        errorResponseHandling(error, semver)
      })
  } catch (error) {
    core.setFailed(
      `An unexpected error occured with error:\n${JSON.stringify(error)}`
    )
  }
}

// Respond with the appropriate error message based on response
function errorResponseHandling(error: any, semver: string): void {
  if (error.response) {
    let errorMessage = `Failed to create package (status: ${error.response.status}) with semver ${semver}. `
    let responseErrorMessage = ''
    if (error.response.status === 400) {
      if (error.message) {
        responseErrorMessage = error.message
        errorMessage += `\nResponded with: "${responseErrorMessage}"`
      }
    } else if (error.response.status === 403) {
      errorMessage += `Ensure GITHUB_TOKEN has permission "packages: write". `
    } else if (error.response.status === 404) {
      errorMessage += `Ensure GitHub Actions have been enabled. `
      if (error.message) {
        responseErrorMessage = error.message
        errorMessage += `\nResponded with: "${responseErrorMessage}"`
      }
    } else if (error.response.status >= 500) {
      errorMessage += `Server error, is githubstatus.com reporting a GHCR outage? Please re-run the release at a later time. `
      if (error.message) {
        responseErrorMessage = error.message
        errorMessage += `\nResponded with: "${responseErrorMessage}"`
      }
    }
    core.setFailed(errorMessage)
  } else {
    throw error
  }
}
