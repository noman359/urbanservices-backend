import fs from 'fs'

const transformPackageToCommon = () => {
    console.debug('converting package.json to commonJS')
    let package_f = fs.readFileSync('../package.json', { encoding: 'utf-8' })
    let parsed_file = JSON.parse(package_f)
    parsed_file['type'] = 'commonjs'
    parsed_file['main'] = 'server.js'
    delete parsed_file['devDependencies']
    fs.writeFileSync('../dist/package.json', JSON.stringify(parsed_file), { encoding: 'utf-8' })
    console.debug('conversion complete Project ready to ship.')
}


transformPackageToCommon()