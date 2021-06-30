// @ts-ignore
import csv from "csv-parse/lib/sync";
import * as fastxml from "fast-xml-parser";
import * as fs from "fs";
import "ts-replace-all";
import { getLogger } from "log4js";
import { DateTime, Duration } from "luxon";

import {recordType, Transaction} from "./Transaction";

const logger = getLogger("logs/debug.log");


type xmlRecordType = {Description: string; Date: string; Value: string; Parties: { From: any; To: any; }};

function getFilenameExtension(filename: string) {
    const filenameArray = filename.split(".");
    return filenameArray[filenameArray.length - 1];
}

function getDateFromSerialFormat(serialDate: string) {
    return DateTime.fromObject({year: 1900}).plus(Duration.fromMillis(parseInt(serialDate) * 24 * 3600 * 1000)).toFormat("dd/MM/yyyy");
}

export function loadTransactions(filename: string) {
    logger.info("Loading file: " + filename);

    let fileData: string;
    try {
        fileData = fs.readFileSync(filename).toString();
    } catch (error) {
        logger.error(`Error when reading file ${filename}: ${error}`);
        throw("Error reading file: " + filename);
    }
    let records: recordType[];
    let dateFormat: string;

    const ext = getFilenameExtension(filename);
    if (ext === "json") {
        const fileDataReformatted = fileData
            .replaceAll("FromAccount", "From")
            .replaceAll("ToAccount", "To");
        try {
            records = JSON.parse(fileDataReformatted);
        } catch (error) {
            logger.error(`Error when reading JSON file ${filename}: ${error}`);
            throw("Invalid format in JSON file: " + filename);
        }
        dateFormat = "yyyy-MM-dd'T'HH:mm:ss";
    } else if (ext === "csv") {
        records = csv(fileData, {columns: true, skip_empty_lines: true});
        dateFormat = "dd/MM/yyyy";
    } else if (ext === "xml") {
        try {
            const xmlParseResult = fastxml.parse(fileData, {ignoreAttributes: false, attributeNamePrefix: ""});
            const recordsRaw: xmlRecordType[] = xmlParseResult.TransactionList.SupportTransaction;
            records = recordsRaw.map(record => ({
                From: record.Parties.From,
                To: record.Parties.To,
                Date: getDateFromSerialFormat(record.Date),
                Narrative: record.Description,
                Amount: record.Value
            }));
        } catch (error) {
            logger.error(`Error when reading XML file ${filename}: ${error}`);
            throw("Invalid format in XML file: " + filename);
        }
        dateFormat = "dd/MM/yyyy";
    } else {
        logger.error("Invalid format on file: " + filename);
        throw("Invalid file format: " + ext);
    }

    let errorCount = 0;
    for (let record of records) {
        try {
            Transaction.addTransaction(record, dateFormat);
        } catch {
            logger.error("Error adding record: " + JSON.stringify(record));
            errorCount++;
        }
    }

    if (errorCount) throw(`Found ${errorCount} invalid records in ${filename}. See log for more details.`);
}
