#!/usr/bin/env python3
"""Generate D1-compatible SQL seed statements from bin_database_sample_2026.csv."""

import csv
from pathlib import Path

CSV_PATH = Path("/home/saikot_my/titan/ultimate-bin-database-2026/bin_database_sample_2026.csv")
OUT_PATH = Path("/home/saikot_my/titan/seed/0001_seed_bins.sql")

ISO4217_NUMERIC_TO_ALPHA = {
    "008": "ALL",
    "036": "AUD",
    "044": "BSD",
    "048": "BHD",
    "050": "BDT",
    "072": "BWP",
    "124": "CAD",
    "170": "COP",
    "188": "CRC",
    "203": "CZK",
    "208": "DKK",
    "214": "DOP",
    "344": "HKD",
    "356": "INR",
    "360": "IDR",
    "392": "JPY",
    "400": "JOD",
    "404": "KES",
    "454": "MWK",
    "458": "MYR",
    "484": "MXN",
    "512": "OMR",
    "516": "NAD",
    "524": "NPR",
    "554": "NZD",
    "558": "NIO",
    "566": "NGN",
    "586": "PKR",
    "608": "PHP",
    "634": "QAR",
    "682": "SAR",
    "702": "SGD",
    "704": "VND",
    "710": "ZAR",
    "756": "CHF",
    "764": "THB",
    "776": "TOP",
    "784": "AED",
    "800": "UGX",
    "818": "EGP",
    "826": "GBP",
    "834": "TZS",
    "840": "USD",
    "901": "TWD",
    "936": "GHS",
    "943": "MZN",
    "952": "XOF",
    "967": "ZMW",
    "973": "AOA",
    "978": "EUR",
    "985": "PLN",
    "986": "BRL",
}

COLUMNS = [
    "bin", "bin_length", "brand", "bank", "type", "category", "country",
    "iso2", "iso3", "iso_num", "web", "phone", "pan_len", "segment",
    "regulated", "debit_network", "atm_network", "comm_l2", "comm_l3",
    "ff_dom", "ff_cross", "ms_ind", "push_dom", "push_cross", "mt_ind",
    "og_ff_dom", "og_ff_cross", "pull_dom", "token", "currency", "currency_raw",
]


def sql_str(value: str | None) -> str:
    if value is None or value == "":
        return "NULL"
    return "'" + value.replace("'", "''") + "'"


def yn_int(value: str) -> str:
    return "1" if value.strip().upper() == "Y" else "0"


def main() -> None:
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with CSV_PATH.open("r", encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f, delimiter=";"))

    tuples: list[str] = []
    for r in rows:
        bin_val = r["BIN"].strip()
        iso2 = r["iso2"].strip()
        # Upstream CSV generation dropped Namibia's "NA" iso2 as NaN
        if not iso2 and r["country"].strip() == "NAMIBIA":
            iso2 = "NA"

        iso_num_raw = r["iso_num"].strip()
        iso_num_sql = "NULL" if (not iso_num_raw or iso_num_raw == "0") else str(int(iso_num_raw))

        curr_raw = r["Currency"].strip()
        curr_norm = ISO4217_NUMERIC_TO_ALPHA.get(curr_raw, curr_raw) if curr_raw else ""

        vals = [
            sql_str(bin_val),
            str(len(bin_val)),
            sql_str(r["brand"].strip()),
            sql_str(r["bank"].strip()),
            sql_str(r["type"].strip()),
            sql_str(r["category"].strip()),
            sql_str(r["country"].strip()),
            sql_str(iso2),
            sql_str(r["iso3"].strip()),
            iso_num_sql,
            sql_str(r["web"].strip()),
            sql_str(r["phone"].strip()),
            str(int(r["pan_len"].strip())),
            sql_str(r["segment"].strip()),
            yn_int(r["regulated"]),
            sql_str(r["DebitNetwork"].strip()),
            sql_str(r["ATMNetwork"].strip()),
            yn_int(r["CommL2"]),
            yn_int(r["CommL3"]),
            yn_int(r["FF_Dom"]),
            yn_int(r["FF_Cross"]),
            yn_int(r["MS_Ind"]),
            yn_int(r["Push_Dom"]),
            yn_int(r["Push_Cross"]),
            yn_int(r["MT_Ind"]),
            yn_int(r["OG_FF_Dom"]),
            yn_int(r["OG_FF_Cross"]),
            yn_int(r["Pull_Dom"]),
            yn_int(r["Token"]),
            sql_str(curr_norm),
            sql_str(curr_raw),
        ]
        tuples.append("(" + ", ".join(vals) + ")")

    batch_size = 50
    col_list = ", ".join(COLUMNS)
    with OUT_PATH.open("w", encoding="utf-8") as out:
        out.write("-- Seeded from ultimate-bin-database-2026/bin_database_sample_2026.csv (10,000 rows)\n")
        out.write("DELETE FROM bins;\n")
        for i in range(0, len(tuples), batch_size):
            chunk = tuples[i : i + batch_size]
            out.write(f"INSERT INTO bins ({col_list}) VALUES\n")
            out.write(",\n".join(chunk))
            out.write(";\n")

    print(f"Wrote {len(tuples)} rows to {OUT_PATH} ({OUT_PATH.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
