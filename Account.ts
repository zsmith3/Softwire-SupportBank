import {Transaction} from "./Transaction";

export default class Account {
    static accounts: Account[] = [];

    static getByName(name: string, create: boolean): Account {
        const result = Account.accounts.find(account => account.name === name);
        if (result) return result;
        else if (create) {
            const newAccount = new Account(name);
            Account.accounts.push(newAccount);
            return newAccount;
        } else throw("Account not found");
    }

    name: string;
    transactions: Transaction[] = [];
    balance: number = 0;

    constructor(name: string) {
        this.name = name;
    }

    addTransaction(transaction: Transaction) {
        if (transaction.from.name === this.name) this.balance -= transaction.amount;
        else if (transaction.to.name === this.name) this.balance += transaction.amount;
        else throw("Cannot add a transaction to account not involved in the transaction");
        this.transactions.push(transaction);
    }

    displayBalance (): string {
        return (Math.round(this.balance * 100) / 100).toString();
    }

    display (): string {
        return `Name: ${this.name}, Balance: ${this.displayBalance()}`;
    }
}
