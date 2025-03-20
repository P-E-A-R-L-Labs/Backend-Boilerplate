import { chatThread } from "./ai/helpers/thread_helper.ts";

function main() {
    chatThread().catch(console.error);
}

main();