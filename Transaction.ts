import { DateTime } from "luxon";
import { getLogger } from "log4js";

import Account from "./Account";

const logger = getLogger("logs/debug.log");


export type recordType = { Date: string; From: string; To: string; Narrative: string; Amount: string };

export class Transaction {
    static transactions: Transaction[] = [];

    static addTransaction(record: recordType, dateFormat: string): Transaction {
        const transaction = new Transaction(record, dateFormat);
        Transaction.transactions.push(transaction);
        return transaction;
    }

    from: Account;
    to: Account;
    amount: number;
    narrative: string;
    date: DateTime;

    constructor(record: recordType, dateFormat: string) {
        logger.debug("Create transaction: " + JSON.stringify(record));
        this.from = Account.getByName(record.From, true);
        this.to = Account.getByName(record.To, true);

        this.amount = parseFloat(record.Amount);
        if (isNaN(this.amount)) {
            logger.error("Invalid amount: " + record.Amount);
            throw("Invalid amount: " + record.Amount);
        }

        this.narrative = record.Narrative;

        this.date = DateTime.fromFormat(record.Date, dateFormat);
        if (!this.date.isValid) {
            logger.error("Invalid date: " + record.Date);
            throw("Invalid date: " + record.Date);
        }

        this.from.addTransaction(this);
        this.to.addTransaction(this);
    }

    display (): string {
        return `From: ${this.from.name}, To: ${this.to.name}, Amount: ${this.amount}, Narrative: ${this.narrative}, Date: ${this.date.toFormat("dd/MM/yyyy")}`;
    }
}
