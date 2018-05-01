const path = require('path');
const solc = require('solc');
const fs = require('fs-extra');

const buildDirPath = path.resolve(__dirname, 'build');
fs.removeSync(buildDirPath); // removes exsting build dir if existing

const contractPath = path.resolve(__dirname, 'contracts', 'Campaign.sol');
const source = fs.readFileSync(contractPath, 'utf8');
const output = solc.compile(source, 1).contracts;

fs.ensureDirSync(buildDirPath);

for (let contract in output) {
  fs.outputJsonSync(
    path.resolve(buildDirPath, contract.replace(":", "") + ".json"),
    output[contract]
  );
}
