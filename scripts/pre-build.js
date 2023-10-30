import fs from 'fs'

const removedistFolder = () => {
    console.debug("Removing dist")
    fs.rmSync('dist', { recursive: true, force: true })
}

removedistFolder()