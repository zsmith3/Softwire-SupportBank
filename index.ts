// @ts-ignore
import csv from "csv-parse/lib/sync";
import * as fs from "fs";
import * as readlineSync from "readline-sync";

import Account from "./Account";
import { Transaction, recordType } from "./Transaction";

const csvFileData = fs.readFileSync("Transactions2014.csv");
const records: recordType[] = csv(csvFileData, { columns: true, skip_empty_lines: true });
const transactions = records.map(record => new Transaction(record));

const command = readlineSync.question("Enter Command: ");
if (command === "List All") {
    for (const account of Account.accounts) {
        console.log(account.display());
    }
} else if (command.startsWith("List ")) {
    const accountName = command.slice(5);
    const account = Account.getByName(accountName, false);
    for (const transaction of account.transactions) {
        console.log(transaction.display())
    }
} else throw("Invalid command");
