import * as fs from 'fs'
import * as core from '@actions/core'

export async function run(): Promise<void> {
  try {
    await removeTarArchive()
  } catch (error) {
    const err = error as Error
    core.info(err.message)
  }
}
async function removeTarArchive(): Promise<void> {
  const path = '/tmp/archive.tar.gz'
  try {
    if (fs.existsSync(path)) {
      core.debug(`Deleting temp folder "${path}"`)
      fs.unlinkSync(path)
    }
    core.info(`Action archive cleanup done!`)
  } catch (err) {
    core.info(`Cleanup job failed to complete with error: ${err}`)
  }
}
run()
