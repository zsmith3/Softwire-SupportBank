import { DateTime } from "luxon";
import { getLogger } from "log4js";

import Account from "./Account";

const logger = getLogger("logs/debug.log");


export type recordType = { Date: string; From: string; To: string; Narrative: string; Amount: string };

export class Transaction {
    static transactions: Transaction[] = [];

    static addTransaction(record: recordType): Transaction {
        const transaction = new Transaction(record);
        Transaction.transactions.push(transaction);
        return transaction;
    }

    from: Account;
    to: Account;
    amount: number;
    narrative: string;
    date: DateTime;

    constructor(record: recordType) {
        this.from = Account.getByName(record.From, true);
        this.to = Account.getByName(record.To, true);

        this.amount = parseFloat(record.Amount);
        if (isNaN(this.amount)) {
            logger.error("Invalid amount on record: " + JSON.stringify(record));
            throw("Invalid amount: " + record.Amount);
        }

        this.narrative = record.Narrative;

        this.date = DateTime.fromFormat(record.Date, "dd/mm/yyyy");
        if (!this.date.isValid) {
            logger.error("Invalid date on record: " + JSON.stringify(record));
            throw("Invalid date: " + record.Date);
        }

        this.from.addTransaction(this);
        this.to.addTransaction(this);
    }

    display (): string {
        return `From: ${this.from.name}, To: ${this.to.name}, Amount: ${this.amount}, Narrative: ${this.narrative}, Date: ${this.date.toFormat("dd/mm/yyyy")}`;
    }
}
