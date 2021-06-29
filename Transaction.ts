import { DateTime } from "luxon";
import Account from "./Account";

export type recordType = { Date: string; From: string; To: string; Narrative: string; Amount: string };

export class Transaction {
    from: Account;
    to: Account;
    amount: number;
    narrative: string;
    date: DateTime;

    constructor(record: recordType) {
        this.from = Account.getByName(record.From, true);
        this.to = Account.getByName(record.To, true);
        this.amount = parseFloat(record.Amount);
        this.narrative = record.Narrative;
        this.date = DateTime.fromFormat(record.Date, "dd/mm/yyyy");

        this.from.addTransaction(this);
        this.to.addTransaction(this);
    }

    display (): string {
        return `From: ${this.from.name}, To: ${this.to.name}, Amount: ${this.amount}, Narrative: ${this.narrative}, Date: ${this.date.toFormat("dd/mm/yyyy")}`;
    }
}
