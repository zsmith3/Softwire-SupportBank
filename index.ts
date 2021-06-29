// @ts-ignore
import csv from "csv-parse/lib/sync";
import * as fs from "fs";
import * as readlineSync from "readline-sync";
import { configure, getLogger } from "log4js";

import Account from "./Account";
import { Transaction, recordType } from "./Transaction";

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


function loadTransactions(filename: string) {
    logger.info("Loading file: " + filename);

    const csvFileData = fs.readFileSync(filename);
    const records: recordType[] = csv(csvFileData, { columns: true, skip_empty_lines: true });

    let errorCount = 0;
    for (let record of records) {
        try {
            Transaction.addTransaction(record);
        } catch {
            errorCount++;
        }
    }

    if (errorCount) throw(`Found ${errorCount} invalid records in ${filename}. See log for more details.`);
}

logger.info("Loading transactions");
loadTransactions("Transactions2014.csv");
loadTransactions("DodgyTransactions2015.csv");

logger.info("Reading command from CLI");
const command = readlineSync.question("Enter Command: ");
if (command === "List All") {
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
} else {
    logger.error("Invalid command: " + command);
    throw("Invalid command");
}

logger.info("Program terminated successfully");
