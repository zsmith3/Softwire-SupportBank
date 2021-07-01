import {getLogger} from "log4js";

import {Transaction} from "./Transaction";

const logger = getLogger("Account");


export default class Account {
    static accounts: Account[] = [];

    static getByName(name: string, createIfNotFound: boolean): Account {
        const result = Account.accounts.find(account => account.name === name);
        if (result) return result;
        else if (createIfNotFound) {
            const newAccount = new Account(name);
            Account.accounts.push(newAccount);
            return newAccount;
        } else {
            logger.error("Account not found: " + name);
            throw("Account not found: " + name);
        }
    }

    transactions: Transaction[] = [];
    balance: number = 0;

    constructor(public name: string) {
        logger.info("Create account: " + name);
    }

    addTransaction(transaction: Transaction) {
        if (transaction.from.name === this.name) this.balance -= transaction.amount;
        else if (transaction.to.name === this.name) this.balance += transaction.amount;
        else {
            logger.error(`Tried to add transaction between ${transaction.from} and ${transaction.to} to account: ${this.name}`);
            throw("Cannot add a transaction to account not involved in the transaction");
        }
        this.transactions.push(transaction);
    }

    displayBalance(): string {
        return (Math.round(this.balance * 100) / 100).toString();
    }

    display(): string {
        return `Name: ${this.name}, Balance: ${this.displayBalance()}`;
    }
}
