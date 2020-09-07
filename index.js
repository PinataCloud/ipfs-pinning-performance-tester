'use strict'

const ipfsClient = require('ipfs-http-client')
const { globSource } = ipfsClient
const path = require('path');
const fs = require('fs');
const ipfs = ipfsClient({ host: 'localhost', port: '5001', protocol: 'http' })
const directoryPath = path.join(__dirname, './testFiles');
const { performance } = require('perf_hooks');
const globSourceOptions = {
  recursive: true
};
const addOptions = {
  pin: true,
  timeout: 10000
};

let addResultsTotalBeforeAverage = 0;
let deleteResultsTotalBeforeAverage = 0;

async function addAndDeleteRun (runIndex) {
    let totalAddTime = 0;
    let totalDeleteTime = 0;
    let averageAddTime = 0;
    let averageDeleteTime = 0;
    const files = fs.readdirSync(directoryPath);
    const addPromises = [];
    //listing all files
    const listOfCIDs = [];
    for (const file of files) {
        addPromises.push(new Promise(async function(resolve, reject) {
            try {
                const t0 = performance.now();
                const results = await ipfs.add(globSource(`./testFiles/${file}`));
                const t1 = performance.now();
                const combinedTime = t1 - t0;
                listOfCIDs.push(results.cid.string);
                totalAddTime = combinedTime + totalAddTime;
                resolve('success');
            } catch(err) {
                console.log(err);
                reject(err);
            }
        }));
    }
    await Promise.all(addPromises).then((result) => {
        averageAddTime = totalAddTime / files.length;
    }).catch((err) => {
        console.log(err);
    });


    const deletePromises = [];
    for (const cid of listOfCIDs) {
        deletePromises.push(new Promise(async function(resolve, reject) {
            try {
                const t0 = performance.now();
                const results = await ipfs.pin.rm(cid);
                const t1 = performance.now();
                const combinedTime = t1 - t0;
                totalDeleteTime = combinedTime + totalDeleteTime;
                resolve('success');
            } catch(err) {
                console.log(err);
                reject(err);
            }
        }));
    }
    await Promise.all(deletePromises).then((result) => {
        averageDeleteTime = totalDeleteTime / files.length;
    }).catch((err) => {
        console.log(err);
    });
    addResultsTotalBeforeAverage = addResultsTotalBeforeAverage + averageAddTime;
    deleteResultsTotalBeforeAverage = deleteResultsTotalBeforeAverage + averageDeleteTime;
    console.log(`Index ${runIndex} - Average Add Time: ${averageAddTime} ms`);
    console.log(`Index ${runIndex} - Average Delete Time: ${averageDeleteTime} ms`);
}

async function main() {
    const numberOfRuns = 30;
    const indexArray = Array.from(Array(numberOfRuns).keys())
    for (const index of indexArray) {
        await addAndDeleteRun(index);
    }
    const totalAddAverage = addResultsTotalBeforeAverage / numberOfRuns;
    const totalDeleteAverage = deleteResultsTotalBeforeAverage / numberOfRuns;
    console.log(`Total Add Average: ${totalAddAverage} ms`);
    console.log(`Total Delete Average: ${totalDeleteAverage} ms`);
}

main()