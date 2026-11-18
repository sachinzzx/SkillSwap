/*
Node.js event loop execution order (simplified):

1. Timers: callbacks scheduled by setTimeout and setInterval run.
2. Pending callbacks: deferred I/O callbacks run.
3. Idle/prepare: internal phases used by Node.js.
4. Poll: I/O callbacks execute and Node calculates whether timers are due.
5. Check: setImmediate callbacks run after poll in ordinary I/O callbacks.
6. Close callbacks: close events run.

After each JavaScript callback, Node drains process.nextTick callbacks,
then Promise microtasks. Because of those microtask queues, both 2 and 3
usually print before timers and the poll/check I/O work.

Standalone usage:
  node src/utils/eventLoopDemo.js
*/

const fs = require("fs");
const path = require("path");

console.log("1. Synchronous code");

process.nextTick(() => {
  console.log("2. process.nextTick (microtask)");
});

Promise.resolve().then(() => {
  console.log("3. Promise.resolve().then (microtask)");
});

setTimeout(() => {
  console.log("4. setTimeout 0 (timers phase)");
}, 0);

setImmediate(() => {
  console.log("5. setImmediate (check phase)");
});

const packageJsonPath = path.resolve(process.cwd(), "package.json");

fs.readFile(packageJsonPath, "utf8", (error, data) => {
  if (error) {
    console.error("6. fs.readFile (I/O phase) failed:", error);
    return;
  }

  console.log(
    `6. fs.readFile (I/O phase) completed, package.json bytes=${Buffer.byteLength(data)}`,
  );

  // WARNING: readFileSync blocks the event loop until package.json is fully read.
  // It prevents timers, I/O callbacks, promises, and user requests from running
  // until this synchronous operation finishes. Prefer readFile/fs/promises.
  const synchronousData = fs.readFileSync(packageJsonPath, "utf8");
  console.log(
    `7. readFileSync (BLOCKS the loop) completed, package.json bytes=${Buffer.byteLength(synchronousData)}`,
  );
});
