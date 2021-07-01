// @ts-ignore
import csvParse from "csv-parse/lib/sync";
// @ts-ignore
import csvStringify from "csv-stringify/lib/sync";
import * as fastxml from "fast-xml-parser";
import * as fs from "fs";
import "ts-replace-all";
import {getLogger} from "log4js";
import {DateTime, Duration} from "luxon";

import {Record, Transaction, XmlRecord} from "./Transaction";

const logger = getLogger("io");


function getFilenameExtension(filename: string) {
    const filenameArray = filename.split(".");
    return filenameArray[filenameArray.length - 1];
}

function getDateFromSerialFormat(serialDate: string) {
    return DateTime.fromObject({year: 1900}).plus(Duration.fromMillis(parseInt(serialDate) * 24 * 3600 * 1000)).toFormat("dd/MM/yyyy");
}

function readFile(filename: string) {
    try {
        return fs.readFileSync(filename).toString();
    } catch (error) {
        logger.error(`Error when reading file ${filename}: ${error}`);
        throw("Error reading file: " + filename);
    }
}

function loadFromJson(fileData: string, filename: string): Record[] {
    const fileDataReformatted = fileData
        .replaceAll("FromAccount", "From")
        .replaceAll("ToAccount", "To");
    try {
        return JSON.parse(fileDataReformatted);
    } catch (error) {
        logger.error(`Error when reading JSON file ${filename}: ${error}`);
        throw("Invalid format in JSON file: " + filename);
    }
}

function loadFromXml(fileData: string, filename: string) {
    try {
        const xmlParseResult = fastxml.parse(fileData, {ignoreAttributes: false});
        const recordsRaw: XmlRecord[] = xmlParseResult.TransactionList.SupportTransaction;
        return recordsRaw.map(record => ({
            From: record.Parties.From,
            To: record.Parties.To,
            Date: getDateFromSerialFormat(record["@_Date"]),
            Narrative: record.Description,
            Amount: record.Value
        }));
    } catch (error) {
        logger.error(`Error when reading XML file ${filename}: ${error}`);
        throw("Invalid format in XML file: " + filename);
    }
}

function addTransactions(records: Record[], dateFormat: string, filename: string) {
    let errorCount = 0;
    records.forEach(record => {
        try {
            Transaction.addTransaction(record, dateFormat);
        } catch {
            logger.error("Error adding record: " + JSON.stringify(record));
            errorCount++;
        }
    });

    if (errorCount) throw(`Found ${errorCount} invalid records in ${filename}. See log for more details.`);
}

export function loadTransactions(filename: string) {
    logger.info("Loading file: " + filename);

    const fileData = readFile(filename);
    let records: Record[];
    let dateFormat: string;
    const ext = getFilenameExtension(filename);

    switch (ext) {
        case "json":
            records = loadFromJson(fileData, filename);
            dateFormat = "yyyy-MM-dd'T'HH:mm:ss";
            break;
        case "csv":
            records = csvParse(fileData, {columns: true, skip_empty_lines: true});
            dateFormat = "dd/MM/yyyy";
            break;
        case "xml":
            records = loadFromXml(fileData, filename);
            dateFormat = "dd/MM/yyyy";
            break;
        default:
            logger.error("Invalid format on file: " + filename);
            throw("Invalid file format: " + ext);
            break;
    }

    addTransactions(records, dateFormat, filename);
}


function transactionsToXml() {
    const parser = new fastxml.j2xParser({ignoreAttributes: false, format: true});
    const xmlData = parser.parse({TransactionList: {SupportTransaction: Transaction.transactions.map(transaction => transaction.toXMLFormat())}});
    const prefix = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n";
    return prefix + xmlData;
}

function writeToFile(filename: string, data: string) {
    try {
        fs.writeFileSync(filename, data);
    } catch (error) {
        logger.error(`Error when writing to file ${filename}: ${error}`);
        throw("Error writing file: " + filename);
    }
}

function encodeTransactions(ext: string, filename: string): string {
    switch (ext) {
        case "json":
            return JSON.stringify(Transaction.transactions, null, "  ");
            break;
        case "csv":
            return csvStringify(Transaction.transactions.map(transaction => transaction.toCSVFormat()), {
                header: true,
                columns: [{key: "Date"}, {key: "From"}, {key: "To"}, {key: "Narrative"}, {key: "Amount"}]
            });
            break;
        case "xml":
            return transactionsToXml();
            break;
        default:
            logger.error("Invalid format on file: " + filename);
            throw("Invalid file format: " + ext);
            break;
    }
}

export function writeTransactions(filename: string) {
    const ext = getFilenameExtension(filename);

    const data = encodeTransactions(ext, filename);

    writeToFile(filename, data);
}
