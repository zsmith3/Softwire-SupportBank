// @ts-ignore
import * as readlineSync from "readline-sync";
import { configure, getLogger } from "log4js";

import { loadTransactions } from "./io";
import Account from "./Account";


configure({
    appenders: {
        file: { type: 'fileSync', filename: 'logs/debug.log' }
    },
    categories: {
        default: { appenders: ['file'], level: 'debug'}
    }
});
const logger = getLogger("logs/debug.log");
logger.info("Program started");


while (true) {
    logger.info("Reading command from CLI");
    const command = readlineSync.question("Enter Command: ");

    if (command.startsWith("Import File ")) {
        const filename = command.slice(12);
        loadTransactions("data/" + filename);
    } else if (command === "List All") {
        logger.info("Listing accounts");
        for (const account of Account.accounts) {
            console.log(account.display());
        }
    } else if (command.startsWith("List ")) {
        const accountName = command.slice(5);
        const account = Account.getByName(accountName, false);
        logger.info("Listing for account: " + account.name);
        for (const transaction of account.transactions) {
            console.log(transaction.display())
        }
    } else if (command === "End") break;
    else {
        logger.error("Invalid command: " + command);
        throw("Invalid command");
    }
}

logger.info("Program terminated successfully");
