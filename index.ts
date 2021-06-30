import * as readlineSync from "readline-sync";
import { configure, getLogger } from "log4js";

import { loadTransactions, writeTransactions } from "./io";
import Account from "./Account";
import {Transaction} from "./Transaction";


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


function listForAccounts(command: string) {
    const accountNames = command.slice(5).split(", ");
    const accounts = accountNames.map(accountName => Account.getByName(accountName, false));
    logger.info("Listing for accounts: " + accountNames);
    if (accounts.length === 1) {
        accounts[0].transactions.forEach(transaction => {
            console.log(transaction.display())
        });
    } else {
        Transaction.transactions
            .filter(transaction => accounts.includes(transaction.from) && accounts.includes(transaction.to))
            .forEach(transaction => {
                console.log(transaction.display());
            });
    }
}

while (true) {
    logger.info("Reading command from CLI");
    const command = readlineSync.question("Enter Command: ");

    if (command.startsWith("Import File ")) {
        const filename = command.slice(12);
        loadTransactions("data/" + filename);
    } else if (command === "List All") {
        logger.info("Listing accounts");
        Account.accounts.forEach(account => {
            console.log(account.display());
        });
    } else if (command.startsWith("List ")) {
        listForAccounts(command);
    } else if (command.startsWith("Export File ")) {
        const filename = command.slice(12);
        writeTransactions("data/" + filename);
    } else if (command === "End") break;
    else {
        logger.error("Invalid command: " + command);
        throw("Invalid command");
    }
}

logger.info("Program terminated successfully");
