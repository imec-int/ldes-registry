// @ts-check
const { exec } = require("child_process");
import throughput from "./benchmark_throughput.js";

function gitCommitAndPush(message) {
  exec(`git commit -am "${message}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error during commit: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Stderr during commit: ${stderr}`);
      return;
    }

    exec("git push", (error, stdout, stderr) => {
      if (error) {
        console.error(`Error during push: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`Stderr during push: ${stderr}`);
        return;
      }

      console.log("Commit and push successful");
    });
  });
}

async function run() {
  await throughput.run();
  // gitCommitAndPush("Update benchmarks");
}

console.info("Starting benchmarking...");
run();
