import { DateTime } from "luxon";
import { getLogger } from "log4js";

import Account from "./Account";

const logger = getLogger("logs/debug.log");


export interface Record { Date: string; From: string; To: string; Narrative: string; Amount: string }
export interface XmlRecord {Description: string; ["@_Date"]: string; Value: string; Parties: { From: any; To: any; }}
export interface JsonRecord {Date: string; FromAccount: string, ToAccount: string; Narrative: string; Amount: number}

export class Transaction {
    static transactions: Transaction[] = [];

    static addTransaction(record: Record, dateFormat: string): Transaction {
        const transaction = new Transaction(record, dateFormat);
        Transaction.transactions.push(transaction);
        return transaction;
    }

    from: Account;
    to: Account;
    amount: number;
    narrative: string;
    date: DateTime;

    constructor(record: Record, dateFormat: string) {
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

    toJSON(): JsonRecord {
        return {Date: this.date.toFormat("yyyy-MM-dd'T'HH:mm:ss"), FromAccount: this.from.name, ToAccount: this.to.name, Narrative: this.narrative, Amount: this.amount};
    }

    toCSVFormat(): Record {
        return {Date: this.date.toFormat("dd/MM/yyyy"), From: this.from.name, To: this.to.name, Narrative: this.narrative, Amount: this.amount.toString()};
    }

    toXMLFormat(): XmlRecord {
        return {["@_Date"]: this.date.diff(DateTime.fromObject({year: 1900}), "days").days.toString(), Description: this.narrative, Value: this.amount.toString(), Parties: { From: this.from.name, To: this.to.name } };
    }

    display (): string {
        return `From: ${this.from.name}, To: ${this.to.name}, Amount: ${this.amount}, Narrative: ${this.narrative}, Date: ${this.date.toFormat("dd/MM/yyyy")}`;
    }
}
