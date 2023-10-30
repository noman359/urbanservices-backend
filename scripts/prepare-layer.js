import fs from 'fs'

const prepareNodemodulesForLayer = () => {
    fs.rmSync("layer/nodejs/node_modules/.prisma")
    fs.rmSync("layer/nodejs/node_modules/@prisma")
    fs.cpSync("node_modules/.prisma", "layer/nodejs/node_modules")
    fs.cpSync("node_modules/@prisma", "layer/nodejs/node_modules")
}

prepareNodemodulesForLayer()